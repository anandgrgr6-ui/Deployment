import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api requests to the Node backend during `npm run dev`,
// so the browser never needs to know the backend port and there are no CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3006',
    },
  },
});
