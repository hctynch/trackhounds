import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for Electron
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Add these settings for better Electron compatibility
    assetsDir: './',
    sourcemap: true,
    // Ensure compatible output format
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: undefined,
      },
    },
  },
});
