import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return; // prevent StrictMode double-fire
    handledRef.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Ensure the auth store has the user before navigating,
        // so ProtectedRoute won't redirect away
        const store = useAuthStore.getState();
        if (!store.user) {
          store.user = session.user;
          localStorage.setItem('supabase_token', session.access_token);
          useAuthStore.setState({ user: session.user, loading: false, initialized: true });
          // Fetch profile in background
          useAuthStore.getState().fetchProfile();
        }

        const returnTo = sessionStorage.getItem('rahify-redirect') || '/';
        sessionStorage.removeItem('rahify-redirect');
        navigate(returnTo, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-muted)]">Signing you in...</p>
      </div>
    </div>
  );
}

