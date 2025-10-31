import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@platform/index': resolve(__dirname, '../../packages/platform/index.ts'),
      '@platform/web': resolve(__dirname, '../../packages/platform-web/index.ts'),
      '@core/index': resolve(__dirname, '../../packages/core/index.ts'),
    },
  },
  define: {
    'process.env.__TARGET__': JSON.stringify('web'),
    'window.__TARGET__': JSON.stringify('web'),
  },
  server: {
    port: 5173,
  },
})