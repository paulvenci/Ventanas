// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
  },
  ssr: false,
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },
  router: {
    options: {
      hashMode: true,
    },
  },
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/registro'],
    },
  },
})
