// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],
  
  typescript: {
    strict: true,
    typeCheck: false  // Disabled during build, enable in development
  },
  
  ssr: false, // Static generation for PWA
  
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/wallet/' : '/',
    buildAssetsDir: '_nuxt/',
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Wallet PWA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Local-First Personal Finance Wallet' }
      ]
    }
  },
  
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Wallet PWA',
      short_name: 'Wallet',
      description: 'Local-First Personal Finance Management',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: process.env.NODE_ENV === 'production' ? '/wallet/' : '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: process.env.NODE_ENV === 'production' ? '/wallet/' : '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      // Show periodic update checks every hour
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
