import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-[var(--bg)]">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/plan/:id" element={<PlanPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
