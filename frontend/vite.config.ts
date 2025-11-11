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
  base: '/', // ✅ Vercel用（GitHub Pagesではない）
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // ✅ ビルド結果フォルダ
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://ttx-backend.onrender.com', // ✅ RenderのURL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
