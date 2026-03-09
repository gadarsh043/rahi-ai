import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// TODO: Add a prerender plugin (e.g. puppeteer-based) for SEO
// when the build pipeline is ready to support it. For now we rely
// on meta tags, structured data, and a noscript fallback.

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
