// Son kiritish va pul hisoblari uchun yordamchilar

export interface ParseNumOptions {
  /** "12,5" → 12.5 (birinchi vergul nuqtaga almashtiriladi). Standart: true */
  decimalComma?: boolean
}

/**
 * "12 500" yoki "12,5" kabi matnni songa aylantiradi (bo'shliqlar olib tashlanadi); bo'sh bo'lsa NaN.
 * `decimalComma: false` — vergul o'nlik ajratuvchi sifatida qabul qilinmaydi ("12,5" → NaN).
 */
export function parseNum(v: string | number | undefined | null, opts: ParseNumOptions = {}) {
  const { decimalComma = true } = opts
  let s = String(v ?? '').replace(/\s/g, '')
  if (decimalComma) s = s.replace(',', '.')
  return s === '' ? Number.NaN : Number(s)
}

/**
 * Pul summasini butun so'mga yaxlitlaydi (masalan 1.25 kg × 18 000). Kasr miqdor × narx hisoblangan
 * har bir joyda ishlatiladi, shunda jami, to'lov va qarz bir xil butun songa tayanadi.
 */
export function roundMoney(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

/** Miqdorni 3 xonagacha yaxlitlash (kg/litr uchun suzuvchi nuqta qoldiqlarisiz) */
export function roundQty(n: number) {
  return Math.round(n * 1000) / 1000
}
