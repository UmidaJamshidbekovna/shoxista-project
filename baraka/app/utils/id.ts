// Noyob identifikatorlar: `uid('t')` → "t3f2a…". Prefiks avvalgi `${prefix}${Date.now()}` bilan bir xil saqlanadi.

function randomPart() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '')
  // Eski brauzerlar / xavfsiz bo'lmagan kontekst uchun zaxira
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
}

export function uid(prefix = '') {
  return `${prefix}${randomPart()}`
}
