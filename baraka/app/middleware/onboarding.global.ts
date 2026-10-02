// Birinchi kirishda onboarding'ga yo'naltirish
export const ONBOARDED_KEY = 'baraka:onboarded'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/onboarding') return
  let done = false
  try { done = localStorage.getItem(ONBOARDED_KEY) === '1' } catch {}
  if (!done) return navigateTo('/onboarding', { replace: true })
})
