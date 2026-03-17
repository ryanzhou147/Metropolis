import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // Extend proxy timeout for long-running agent queries (Gemini API)
          proxy.on('proxyReq', (_proxyReq, _req, res) => {
            // 2-minute timeout on the proxy side
            res.setTimeout(120_000)
          })
        },
      },
    },
  },
})
