// Ombor bo'limi uchun yordamchilar: qo'lda tuzatishlar jurnali.
// Qoldiqning o'zi useLedger().adjustStock orqali o'zgaradi; bu yerda faqat jurnal yuritiladi.
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

export const INV_CATEGORY_COLORS = [
  '#05472a', '#0e8a5f', '#65a30d', '#1d5bd8', '#0891b2', '#7c3aed',
  '#db2777', '#d92d20', '#c2410c', '#b45309', '#ca8a04', '#475569',
]

export function useInv() {
  const adjustments = useState<StockAdjustment[]>('inv-adjustments', () => [])
  const { adjustStock } = useLedger()

  /** Qoldiqni foiz ko'rinishida (minimal zaxiraning 2 barobari = 100%) */
  const stockPct = (p: Product) => {
    const full = Math.max(p.minStock * 2, 1)
    return Math.max(0, Math.min(100, (p.stock / full) * 100))
  }

  /** Qoldiqni tuzatadi (useLedger orqali) va jurnalga yozadi */
  function adjust(p: Product, reason: AdjustReason, qty: number, note = '') {
    const r = adjustStock(p, reason, qty)
    if (!r) return null
    adjustments.value = [{
      id: uid('adj'), productId: p.id, reason, delta: r.delta, after: r.after, note, date: new Date().toISOString(),
    }, ...adjustments.value]
    return r
  }

  return { adjustments, stockPct, adjust }
}
