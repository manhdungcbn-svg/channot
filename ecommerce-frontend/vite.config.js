import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: false,
    proxy: {
      // Proxy tới FastAPI backend (warranty-system/backend) chạy ở port 8000.
      // Backend đã expose router ở prefix /api/v1 -> rewrite /api/* sang /api/v1/*.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => `/api/v1${path.replace(/^\/api/, '')}`,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5175,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
