import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import { trackEvent } from '../../services/posthog';

function LegalModal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[70dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-[var(--text-secondary)] leading-relaxed space-y-3">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AuthPage() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [searchParams] = useSearchParams();
  const [legalModal, setLegalModal] = useState(null);

  useEffect(() => {
    trackEvent('login_page_viewed', { referrer: document.referrer });
  }, []);

  const handleLogin = () => {
    const redirect = searchParams.get('redirect') || '/';
    sessionStorage.setItem('rahify-redirect', redirect);
    signInWithGoogle();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg)] px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-brand-500 text-center">Rahify</h1>

        <p className="text-center text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
          Your trips stay with you. Sign in so you can come back
          to edit, share with friends, or download before you fly.
        </p>

        <button
          type="button"
          onClick={handleLogin}
          className="mt-8 w-full flex items-center justify-center gap-3 bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-xl px-6 py-3.5 transition-all hover:border-brand-400 hover:shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Continue with Google
          </span>
        </button>

        <p className="text-xs text-[var(--text-muted)] text-center mt-4">
          5 free trips. No credit card.
        </p>

        <p className="text-[11px] text-[var(--text-muted)] text-center mt-8">
          By signing in, you agree to our{' '}
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="text-brand-500 hover:underline cursor-pointer"
          >
            Terms
          </button>
          {' '}and{' '}
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="text-brand-500 hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>.
        </p>
      </div>

      <AnimatePresence>
        {legalModal === 'terms' && (
          <LegalModal title="Terms of Service" onClose={() => setLegalModal(null)}>
            <p>Welcome to Rahify. By using our service, you agree to the following:</p>
            <p><strong>What we do:</strong> Rahify generates travel itineraries using real place data from Google Places and AI. We provide suggestions — you make the final call on your plans.</p>
            <p><strong>Your account:</strong> You sign in via Google OAuth. We store your trip data so you can access it later. You can delete your trips at any time.</p>
            <p><strong>Free tier:</strong> Every account gets 5 free trips. We may adjust this in the future, but existing trips are always yours.</p>
            <p><strong>Your content:</strong> Trips you create are yours. We don't sell your data or share your itineraries without your permission.</p>
            <p><strong>Limitations:</strong> Itineraries are AI-generated suggestions. Verify important details (visa requirements, opening hours, prices) independently before traveling. We're not liable for inaccuracies.</p>
            <p><strong>Acceptable use:</strong> Don't abuse the service, scrape data, or use automated tools to generate trips in bulk.</p>
            <p>We may update these terms. Continued use means you accept the changes.</p>
            <p className="text-[var(--text-muted)]">Last updated: March 2026</p>
          </LegalModal>
        )}
        {legalModal === 'privacy' && (
          <LegalModal title="Privacy Policy" onClose={() => setLegalModal(null)}>
            <p>We keep it simple:</p>
            <p><strong>What we collect:</strong> Your Google profile (name, email, avatar) when you sign in, and the trips you create.</p>
            <p><strong>What we don't collect:</strong> We don't track you across the web, don't sell your data, and don't run third-party ad trackers.</p>
            <p><strong>How we use it:</strong> Your data is used solely to provide the service — saving trips, generating itineraries, and showing your trip history.</p>
            <p><strong>Storage:</strong> Data is stored securely on Supabase (PostgreSQL). Authentication is handled by Google OAuth — we never see or store your Google password.</p>
            <p><strong>Sharing:</strong> When you share a trip via invite code, only the people you share with can see it. We don't make trips public.</p>
            <p><strong>Deletion:</strong> You can delete your trips anytime. If you want your account removed entirely, email us.</p>
            <p><strong>Third parties:</strong> We use Google Places API for place data, Photon for geocoding, and Groq for AI generation. These services process queries but don't receive your personal info.</p>
            <p className="text-[var(--text-muted)]">Last updated: March 2026</p>
          </LegalModal>
        )}
      </AnimatePresence>
    </div>
  );
}
