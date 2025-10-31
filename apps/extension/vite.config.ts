import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import webExtension from 'vite-plugin-web-extension'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        name: 'Web Helper Extension',
        version: '0.0.0',
        manifest_version: 3,
        action: {
          default_popup: 'popup.html',
          default_icon: {
            16: 'icons/icon16.png',
            48: 'icons/icon48.png',
            128: 'icons/icon128.png'
          }
        },
        background: {
          service_worker: 'background.ts',
          type: 'module'
        },
        permissions: ['storage']
      },
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