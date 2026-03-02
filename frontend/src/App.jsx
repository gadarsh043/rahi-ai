import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage/PlanPage';
import SettingsPage from './pages/SettingsPage';
import ToastContainer from './components/common/Toast/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthPage from './pages/AuthPage/AuthPage';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './stores/authStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <div className="flex flex-col h-screen bg-[var(--bg)]">
        <div className="flex flex-1 min-h-0 min-w-0">
          <Sidebar />
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-x-hidden">
            <TopBar />
            <div className="flex-1 min-h-0 overflow-auto px-4 md:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

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
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
