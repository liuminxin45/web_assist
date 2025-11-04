import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@platform/index': resolve(__dirname, '../../packages/platform/index.ts'),
      '@platform/web': resolve(__dirname, '../../packages/platform-web/index.ts'),
      '@platform/webext': resolve(__dirname, '../../packages/platform-webext/index.ts'),
      '@core/index': resolve(__dirname, '../../packages/core/index.ts'),
    },
  },
  define: {
    'process.env.__TARGET__': JSON.stringify('webext'),
    'window.__TARGET__': JSON.stringify('webext'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
      },
    },
  },
});
