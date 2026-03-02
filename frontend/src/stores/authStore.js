import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        localStorage.setItem('supabase_token', session.access_token);
        set({ user: session.user });
        await get().fetchProfile();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('supabase_token', session.access_token);
        set({ user: session.user });
        await get().fetchProfile();
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_token');
        set({ user: null, profile: null });
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem('supabase_token', session.access_token);
      }
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name:
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Traveler',
          avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select()
        .single();
      set({ profile: newProfile });
    } else if (data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { data: null, error: new Error('No user') };

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      set({ profile: data });
    }
    return { data, error };
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Google sign-in error:', error);
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_token');
    set({ user: null, profile: null });
    window.location.href = '/login';
  },
}));

export default useAuthStore;

