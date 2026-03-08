import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initPosthog } from './services/posthog';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';

initPosthog();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
