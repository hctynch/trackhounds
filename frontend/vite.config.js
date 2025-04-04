import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://trackhounds.live',
        changeOrigin: true,
        secure: false,
      },
      // Add any other API endpoints you have
    }
  },
});
