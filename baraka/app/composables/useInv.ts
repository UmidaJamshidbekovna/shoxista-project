// Ombor bo'limi uchun yordamchilar: qoldiq holati yorliqlari va qo'lda tuzatishlar jurnali
import type { Product } from '~/data/types'

export type AdjustReason = 'in' | 'writeoff' | 'count'

export interface StockAdjustment {
  id: string
  productId: string
  reason: AdjustReason
  delta: number
  after: number
  note: string
  date: string
}

export const invAdjustReasonLabel: Record<AdjustReason, string> = {
  in: 'Kirim',
  writeoff: 'Hisobdan chiqarish',
  count: 'Inventarizatsiya',
}

export const invStockLabel = { ok: 'Yetarli', low: 'Kam qolgan', out: 'Tugagan' } as const
export const invStockTone = { ok: 'brand', low: 'warn', out: 'danger' } as const

export const invUnitLabel: Record<Product['unit'], string> = { dona: 'dona', kg: 'kg', litr: 'litr', quti: 'quti', blok: 'blok', paket: 'paket', metr: 'metr', qadoq: 'qadoq' }

export const INV_CATEGORY_COLORS = [
  '#05472a', '#0e8a5f', '#65a30d', '#1d5bd8', '#0891b2', '#7c3aed',
  '#db2777', '#d92d20', '#c2410c', '#b45309', '#ca8a04', '#475569',
]

/** "12 500" yoki "12,5" kabi matnni songa aylantiradi; bo'sh bo'lsa NaN */
export function invParseNum(v: string | number | undefined | null) {
  const s = String(v ?? '').replace(/\s/g, '').replace(',', '.')
  return s === '' ? Number.NaN : Number(s)
}

export function useInv() {
  const adjustments = useState<StockAdjustment[]>('inv-adjustments', () => [])

  /** Qoldiqni foiz ko'rinishida (minimal zaxiraning 2 barobari = 100%) */
  const stockPct = (p: Product) => {
    const full = Math.max(p.minStock * 2, 1)
    return Math.max(0, Math.min(100, (p.stock / full) * 100))
  }

  function adjust(p: Product, reason: AdjustReason, qty: number, note = '') {
    const before = p.stock
    if (reason === 'in') p.stock = before + qty
    else if (reason === 'writeoff') p.stock = Math.max(0, before - qty)
    else p.stock = qty
    adjustments.value = [{
      id: `adj${Date.now()}`, productId: p.id, reason, delta: p.stock - before, after: p.stock, note, date: new Date().toISOString(),
    }, ...adjustments.value]
  }

  return { adjustments, stockPct, adjust }
}
