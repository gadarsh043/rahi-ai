import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav/BottomNav';
import HomePage from './pages/HomePage';
import TripFormPage from './pages/TripFormPage';
import PlanPage from './pages/PlanPage/PlanPage';
import SettingsPage from './pages/SettingsPage';
import ToastContainer from './components/common/Toast/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthPage from './pages/AuthPage/AuthPage';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ExplorePage from './pages/ExplorePage';
import ExploreDestinationPage from './pages/ExploreDestinationPage';
import RoadmapPage from './pages/RoadmapPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import CreditsExhausted from './components/credits/CreditsExhausted';
import useTourStore from './stores/tourStore';
import TourOverlay from './components/onboarding/TourOverlay';
import TourPrompt from './components/onboarding/TourPrompt';
import TourMenu from './components/onboarding/TourMenu';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const profile = useAuthStore((s) => s.profile);
  const initToursFromProfile = useTourStore((s) => s.initFromProfile);
  const showCreditsExhausted = useUIStore((s) => s.showCreditsExhausted);
  const setShowCreditsExhausted = useUIStore((s) => s.setShowCreditsExhausted);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (profile) {
      initToursFromProfile(profile);
    }
  }, [profile, initToursFromProfile]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <TourOverlay />
      <TourPrompt />
      <TourMenu />
      {showCreditsExhausted && (
        <CreditsExhausted onClose={() => setShowCreditsExhausted(false)} />
      )}
      <div className="flex flex-col h-[100dvh] bg-[var(--bg)]">
        <div className="flex flex-1 min-h-0 min-w-0">
          <Sidebar />
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-x-hidden">
            <TopBar />
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
              <Routes>
                {/* Home page — full-width (no side padding for landing section) */}
                <Route
                  path="/"
                  element={(
                    <ErrorBoundary>
                      <HomePage />
                    </ErrorBoundary>
                  )}
                />

                {/* Explore SEO pages (public, crawlable) */}
                <Route
                  path="/explore"
                  element={(
                    <ErrorBoundary>
                      <ExplorePage />
                    </ErrorBoundary>
                  )}
                />
                <Route
                  path="/explore/:slug"
                  element={(
                    <ErrorBoundary>
                      <ExploreDestinationPage />
                    </ErrorBoundary>
                  )}
                />

                {/* Roadmap (public) */}
                <Route
                  path="/roadmap"
                  element={(
                    <ErrorBoundary>
                      <RoadmapPage />
                    </ErrorBoundary>
                  )}
                />

                {/* Auth pages */}
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route
                  path="/new"
                  element={(
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <TripFormPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  )}
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
                {/* Catch-all: unknown paths → home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BottomNav />
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
