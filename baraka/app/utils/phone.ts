// O'zbekiston telefon raqamlari: "+998 XX XXX XX XX"

export interface UzPhoneFormatOptions {
  /** Bo'sh kiritishda ham "+998" qaytarish (POS mijoz formasi). Standart: '' */
  keepPrefix?: boolean
  /**
   * Faqat to'liq raqamni formatlash (9 ta raqam yoki 998 + 9 ta raqam); to'liq bo'lmasa kiritilgan matn
   * (trim) qaytariladi — Profil formalaridagi saqlash paytidagi normalizatsiya.
   */
  completeOnly?: boolean
}

/** Har qanday kiritilgan matnni "+998 XX XXX XX XX" ko'rinishiga keltiradi (yozish davomida ham) */
export function formatUzPhone(v: string | null | undefined, opts: UzPhoneFormatOptions = {}) {
  const raw = String(v ?? '')
  let d = raw.replace(/\D/g, '')
  if (opts.completeOnly) {
    if (d.length === 9) d = `998${d}`
    if (!/^998\d{9}$/.test(d)) return raw.trim()
    d = d.slice(3)
  }
  else {
    if (d.startsWith('998')) d = d.slice(3)
    d = d.slice(0, 9)
  }
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  if (!parts.length) return opts.keepPrefix ? '+998' : ''
  return `+998 ${parts.join(' ')}`
}

export interface UzPhoneValidateOptions {
  /** Format talab qilinmaydi — kamida 9 ta raqam bo'lsa yetarli (Profil formalari) */
  loose?: boolean
}

/** Qat'iy: aynan "+998 XX XXX XX XX". `loose` — kamida 9 ta raqam */
export function isUzPhone(v: string | null | undefined, opts: UzPhoneValidateOptions = {}) {
  const s = String(v ?? '')
  if (opts.loose) return s.replace(/\D/g, '').length >= 9
  return /^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(s)
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
