import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import webExtension from 'vite-plugin-web-extension'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest,
      webExtConfig: {
        sourceDir: 'dist',
        artifactsDir: 'artifacts',
        startUrl: ['about:blank']
      }
    })
  ],
  resolve: {
    alias: {
      '@platform/index': resolve(__dirname, '../../packages/platform/index.ts'),
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
    sourcemap: true
  }
})