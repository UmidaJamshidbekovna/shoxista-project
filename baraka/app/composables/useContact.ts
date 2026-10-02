// Kontaktlar (mijoz/tashkilot) uchun yordamchilar va qo'shimcha holat
import type { PayMethod } from '~/data/types'
import type { Ref } from 'vue'

export interface ContactPayment {
  id: string
  refId: string
  amount: number
  method: PayMethod
  date: string
  /** in = bizga to'landi, out = biz to'ladik */
  dir: 'in' | 'out'
  note?: string
}

/** Har qanday kiritilgan matnni "+998 XX XXX XX XX" ko'rinishiga keltiradi */
export function formatUzPhone(v: string) {
  let d = String(v ?? '').replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  d = d.slice(0, 9)
  if (!d) return ''
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+998 ${parts.join(' ')}`
}

export const isUzPhone = (v: string) => /^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(v)

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

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

export function useContactPayments() {
  const payments = useState<ContactPayment[]>('contact-payments', () => [])
  function addPayment(p: Omit<ContactPayment, 'id' | 'date'>) {
    payments.value = [{ ...p, id: `pay${Date.now()}`, date: new Date().toISOString() }, ...payments.value]
  }
  return { payments, addPayment }
}
