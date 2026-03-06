import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const hasShared = searchParams.has('shared');

  if (hasShared) {
    return children;
  }

  // If there's a pending trip generation waiting after OAuth, don't redirect —
  // the auth state might not have propagated yet. Show spinner and let it resolve.
  const hasPendingTrip = location.pathname === '/plan/new' && sessionStorage.getItem('rahify-pending-trip');

  if (!initialized || loading || (hasPendingTrip && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div role="status" aria-label="Loading" className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const returnPath = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnPath)}`} replace />;
  }

  return children;
}

