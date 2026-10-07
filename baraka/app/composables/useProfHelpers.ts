// Profil bo'limi uchun umumiy yordamchilar (Profile.md)
import type { Branch, Employee, Plan } from '~/data/types'
import { planLimits, roleLabel } from '~/data/labels'

/** Tariflar (Profile.md §9) */
export const profPlans: { id: Plan, price: number, features: string[] }[] = [
  { id: 'Start', price: 0, features: ['100 tagacha mahsulot', '1 ta xodim', 'Asosiy hisobotlar'] },
  { id: 'Pro', price: 149000, features: ['Cheksiz mahsulot', 'AI yordamchi: Instagram, Telegram', '5 tagacha xodim', 'B2B savdo'] },
  { id: 'Biznes', price: 349000, features: ['Cheksiz xodim', 'Bir nechta filial', 'Kengaytirilgan AI tahlil', 'API integratsiya'] },
]

/** "149 000 / oy" yoki "Bepul" */
export function profPlanPrice(id: Plan) {
  const p = profPlans.find(x => x.id === id)!
  return p.price ? `${formatSom(p.price)} / oy` : 'Bepul'
}

/** Limit matni: Infinity → "Cheksiz" */
export function profLimit(n: number) {
  return Number.isFinite(n) ? formatSom(n) : 'Cheksiz'
}

export function profPlanLimits(id: Plan) {
  return planLimits[id]
}

/** Telefonda kamida 9 ta raqam (Profile.md §2, §6) */
export function profPhoneValid(v: string) {
  return v.replace(/\D/g, '').length >= 9
}

/** Kiritilgan raqamni "+998 90 123 45 67" ko'rinishiga keltirish */
export function profFormatPhone(v: string) {
  let d = v.replace(/\D/g, '')
  if (d.length === 9) d = `998${d}`
  if (!/^998\d{9}$/.test(d)) return v.trim()
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
/** "10-oktabr" */
export function profDateUz(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}-${MONTHS[d.getMonth()]}`
}
export function profDaysLeft(iso: string) {
  const end = new Date(`${iso.slice(0, 10)}T23:59:59`)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000) - 1)
}

/** Rol matni: egasi → "Do'kon egasi", boshqalar — o'z nomi (§1.2) */
export function profRoleText(e?: Employee) {
  if (!e) return ''
  return e.role === 'owner' ? 'Do\'kon egasi' : roleLabel[e.role]
}

export function profInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Haftaning bugungi kuni (0 = Dushanba) */
export function profTodayIdx() {
  return (new Date().getDay() + 6) % 7
}
export function profTodayHours(b: Branch) {
  return b.hours[profTodayIdx()]
}
/** "Bugun · 08:00–22:00" yoki "Bugun · Yopiq" */
export function profTodayText(b: Branch) {
  const h = profTodayHours(b)
  return !h || h.off ? 'Bugun · Yopiq' : `Bugun · ${h.open}–${h.close}`
}
export function profIsOpen(b: Branch) {
  const h = profTodayHours(b)
  if (!h || h.off) return false
  const now = new Date()
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return h.close > h.open ? cur >= h.open && cur < h.close : cur >= h.open || cur < h.close
}

/** Bot token maskasi: "7712…AAF6qP" */
export function profMask(token: string) {
  return token.length > 12 ? `${token.slice(0, 4)}…${token.slice(-6)}` : token
}

/** Rasm faylini data URL ga o'qish (avatar / logo sloti) */
export function profReadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Joriy foydalanuvchi: egasi yoki demo xodim (Kassir) */
export function useProfMe() {
  const { employees, role } = useStore()
  const me = computed(() => role.value === 'owner'
    ? employees.value.find(e => e.role === 'owner')
    : employees.value.find(e => e.role === 'cashier') ?? employees.value.find(e => e.role !== 'owner'))
  return { me }
}

export function useProfHelpers() {
  return { profPlans, profPhoneValid, profFormatPhone }
}
