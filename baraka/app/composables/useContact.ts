// Kontaktlar (mijoz/tashkilot) uchun yordamchilar.
// Telefon formatlash: ~/utils/phone.ts (formatUzPhone, isUzPhone, telHref). To'lovlar: useStore().payments (yagona jurnal).
import type { Payment, PayMethod } from '~/data/types'
import type { Ref } from 'vue'

/** @deprecated Yagona `Payment` turidan foydalaning (~/data/types) */
export type ContactPayment = Payment

/** Telefon inputini avtomatik formatlash */
export function usePhoneMask(r: Ref<string>) {
  watch(r, (v) => {
    const f = formatUzPhone(v)
    if (f !== v) r.value = f
  })
}

export const contactPayMethods: { value: PayMethod, label: string }[] = [
  { value: 'cash', label: 'Naqd' },
  { value: 'card', label: 'Karta' },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'transfer', label: 'O\'tkazma' },
]

export const orgColors = ['#1d5bd8', '#05472a', '#c2410c', '#7c3aed', '#0891b2', '#db2777', '#b45309', '#0f766e']

/**
 * Kontakt to'lovlari — yagona jurnal (useStore().payments) ustidagi yupqa qatlam (orqaga moslik uchun).
 * Yangi kod pul harakati uchun useLedger() dan foydalansin.
 */
export function useContactPayments() {
  const { payments } = useStore()
  const { recordPayment } = useLedger()
  function addPayment(p: Omit<Payment, 'id' | 'date'>) {
    return recordPayment(p)
  }
  return { payments, addPayment }
}
