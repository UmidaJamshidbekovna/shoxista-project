// Profil bo'limi uchun umumiy yordamchilar
import { planLimits } from '~/data/labels'

export type ProfPlan = keyof typeof planLimits

export const profPlans: { id: ProfPlan, price: number, desc: string, color: string }[] = [
  { id: 'Start', price: 0, desc: 'Kichik do\'kon uchun boshlang\'ich tarif', color: '#4a5a52' },
  { id: 'Pro', price: 199000, desc: 'O\'sayotgan biznes: filiallar, AI va online savdo', color: '#05472a' },
  { id: 'Enterprise', price: 499000, desc: 'Tarmoq do\'konlar uchun cheklovsiz imkoniyatlar', color: '#7c3aed' },
]

/** +998 XX XXX XX XX formatidagi telefon to'g'rimi */
export function profPhoneValid(v: string) {
  return /^998\d{9}$/.test(v.replace(/\D/g, ''))
}

export function profFormatPhone(v: string) {
  const d = v.replace(/\D/g, '').replace(/^(?!998)/, '998').slice(0, 12)
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean)
  return `+${p.join(' ')}`
}

/** planLimits dagi 99 / 999 / 99999 — cheksiz degani */
export function profUnlimited(n: number) {
  return n === 99 || n === 999 || n === 99999
}

export function profLimitText(n: number) {
  return profUnlimited(n) ? 'Cheksiz' : formatSom(n)
}

export function useProfHelpers() {
  return { profPlans, profPhoneValid, profFormatPhone, profLimitText }
}
