import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'target.mind'],
      manifest: {
        name: 'Photo AR',
        short_name: 'Photo AR',
        description: 'Bring physical photo albums to life with augmented reality',
        theme_color: '#030305',
        background_color: '#030305',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mind}'],
        maximumFileSizeToCacheInBytes: 10485760,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.match(/\.mp4$/i),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ar-video-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200, 206]
              }
            }
          }
        ]
      }
    })
  ],
})
