import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://skin-api.kaizencore.tech",
      'X-Frame-Options': 'ALLOW-FROM https://skin-api.kaizencore.tech',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://skin-api.kaizencore.tech",
      'X-Frame-Options': 'ALLOW-FROM https://skin-api.kaizencore.tech',
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
});
