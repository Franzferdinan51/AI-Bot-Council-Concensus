import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3002,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('.')
    }
  }
});
