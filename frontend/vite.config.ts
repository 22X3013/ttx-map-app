// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirnameをESM環境でも使えるように再定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ import '@/components/...'
    },
  },
  server: {
    port: 5173,
    open: true, // ✅ 起動時にブラウザを自動で開く
    proxy: {
      // ✅ バックエンド(Express)のAPIを5174へ転送
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
