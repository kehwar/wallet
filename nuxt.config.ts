// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: ['@nuxt/eslint'],
  
  typescript: {
    strict: true,
    typeCheck: false  // Disabled during build, enable in development
  },
  
  ssr: false, // Static generation for PWA
  
  app: {
    head: {
      title: 'Wallet PWA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Local-First Personal Finance Wallet' }
      ]
    }
  }
})
