import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Prevent shipping a build that talks to localhost or relative /api on Pages. */
function requireProductionApiBase(): Plugin {
  return {
    name: 'require-production-api-base',
    configResolved(config) {
      if (config.command !== 'build' || config.mode === 'development') return
      const raw = (process.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
      if (!raw) {
        throw new Error(
          'VITE_API_BASE_URL is required for production builds (e.g. https://….onrender.com).',
        )
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) {
        throw new Error(
          `VITE_API_BASE_URL must not be a localhost URL in production builds (got: ${raw}).`,
        )
      }
      if (!/^https:\/\//i.test(raw)) {
        throw new Error(
          `VITE_API_BASE_URL must use HTTPS in production (got: ${raw}).`,
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), requireProductionApiBase()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
