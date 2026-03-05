import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav/BottomNav';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage/PlanPage';
import SettingsPage from './pages/SettingsPage';
import ToastContainer from './components/common/Toast/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthPage from './pages/AuthPage/AuthPage';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import CreditsExhausted from './components/credits/CreditsExhausted';
import { useOnboardingStore } from './stores/onboardingStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const profile = useAuthStore((s) => s.profile);
  const initFromProfile = useOnboardingStore((s) => s.initFromProfile);
  const showCreditsExhausted = useUIStore((s) => s.showCreditsExhausted);
  const setShowCreditsExhausted = useUIStore((s) => s.setShowCreditsExhausted);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (profile) initFromProfile(profile);
  }, [profile, initFromProfile]);

  return (
    <BrowserRouter>
      <ToastContainer />
      {showCreditsExhausted && (
        <CreditsExhausted onClose={() => setShowCreditsExhausted(false)} />
      )}
      <div className="flex flex-col h-screen bg-[var(--bg)]">
        <div className="flex flex-1 min-h-0 min-w-0">
          <Sidebar />
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-x-hidden">
            <TopBar />
            <div className="flex-1 min-h-0 overflow-auto px-4 md:px-6 lg:px-8 pb-16 lg:pb-0">
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                <Route
                  path="/"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <HomePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/new"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="/plan/:id"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <PlanPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/plan/demo"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <PlanPage isDemo />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/trip/:id"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <PlanPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SettingsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
                />
              </Routes>
            </div>
            <BottomNav />
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
