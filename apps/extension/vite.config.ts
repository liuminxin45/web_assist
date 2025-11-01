import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
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
        popup: resolve(__dirname, 'src/popup.tsx')
      }
    }
  }
})