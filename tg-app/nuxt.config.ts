import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Telegram Mini App — faqat klient tomonda ishlaydi
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: true },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'uz' },
      title: 'AI Pos',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#F3F1EB' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Onest:wght@400;500;600;700&display=swap' },
      ],
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js', tagPosition: 'head' }],
    },
  },
})
