import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  const isProd = command === 'build';

  return {
    // Only use the subpath base for production (GitHub Pages).
    // In dev, serve from root so URLs are just localhost:5173/
    base: isProd ? '/blueprint-full-exterior-visualizer/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      host: '0.0.0.0',
      proxy: {
        // Forward /api/* to the Express backend server
        '/api': {
          target: 'http://localhost:4010',
          changeOrigin: true,
        },
      },
    },
  };
});
