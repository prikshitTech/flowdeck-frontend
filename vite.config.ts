import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const API_CACHE = 'flowdeck-api';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FlowDeck',
        short_name: 'FlowDeck',
        description: 'Pages, boards and channels for small teams',
        theme_color: '#0f766e',
        background_color: '#fafaf9',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.includes('/api/v1/') && !url.pathname.endsWith('/download'),
            handler: 'NetworkFirst',
            options: {
              cacheName: API_CACHE,
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  server: {
    port: 5173
  }
});
