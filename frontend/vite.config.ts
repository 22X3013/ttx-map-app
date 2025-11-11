// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirnameをESM環境でも使えるように再定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ 公開リポジトリ名を指定（例：ttx-map-app）
const repoName = 'ttx-map-app'; // ← あなたのGitHubリポジトリ名に変更

// https://vitejs.dev/config/
export default defineConfig({
  base: `/${repoName}/`, // ✅ GitHub Pages用にルートパスを調整
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
      // ✅ 開発中のみバックエンドAPIを転送
      '/api': {
        target: 'https://ttx-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
