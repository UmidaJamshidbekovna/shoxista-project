// Tarix sahifasi holati (Stock and History.md §II, §III): histDir, histQuery, hf, hfDraft.
// useState — sahifadan chiqib qaytganda saqlanib qoladi.
import type { Channel, OrderStatus, PayStatus, Transaction } from '~/data/types'
import { statusLabel } from '~/data/labels'

export type HistDir = 'out' | 'in'
export type HistKey = 'channel' | 'type' | 'status' | 'pay' | 'payType'
export type HistFilters = Record<HistKey, string>

export const HIST_ALL = 'Barchasi'
export const emptyHistFilters = (): HistFilters => ({
  channel: HIST_ALL, type: HIST_ALL, status: HIST_ALL, pay: HIST_ALL, payType: HIST_ALL,
})

/** Filtr sheet guruhlari (§7) */
export const HIST_GROUPS: { k: HistKey, title: string, opts: string[] }[] = [
  { k: 'channel', title: 'Savdo kanali', opts: [HIST_ALL, 'Ilova', 'Instagram', 'Telegram'] },
  { k: 'type', title: 'Savdo turi', opts: [HIST_ALL, 'B2C', 'B2B'] },
  { k: 'status', title: 'Buyurtma holati', opts: [HIST_ALL, 'Kutilmoqda', 'Jarayonda', 'Yo\'lda', 'Yetkazildi', 'Bekor qilindi', 'Qaytarildi'] },
  { k: 'pay', title: 'To\'lov holati', opts: [HIST_ALL, 'To\'langan', 'Qisman', 'Qarz'] },
  { k: 'payType', title: 'To\'lov turi', opts: [HIST_ALL, 'Naqd', 'Online'] },
]

/** To'lov holati tegi: yorliq / rang / fon (§6) */
export const HIST_PAY: Record<PayStatus, { label: string, c: string, bg: string }> = {
  paid: { label: 'To\'langan', c: '#15803d', bg: '#e7f7ec' },
  partial: { label: 'Qisman', c: '#b45309', bg: '#fff4e0' },
  unpaid: { label: 'Qarz', c: '#d93036', bg: '#fdecec' },
}

/** Buyurtma holati ranglari (§8) */
export const HIST_STATUS: Record<OrderStatus, { c: string, bg: string }> = {
  pending: { c: '#2f6fed', bg: '#eaf1ff' },
  processing: { c: '#b45309', bg: '#fff4e0' },
  shipping: { c: '#7c3aed', bg: '#f1ebfe' },
  delivered: { c: '#15803d', bg: '#e7f7ec' },
  cancelled: { c: '#d93036', bg: '#fdecec' },
  returned: { c: '#9a5b0b', bg: '#fbefdc' },
}

/** Kanal ikonkasi ranglari (Home Icons.md §3) */
export const HIST_CHANNEL: Record<Channel, { c: string, bg: string }> = {
  offline: { c: '#5b616b', bg: '#eef0f3' },
  instagram: { c: '#d6246e', bg: '#fdeaf2' },
  telegram: { c: '#229ed9', bg: '#e6f5fc' },
  app: { c: '#15803d', bg: '#e7f7ec' },
}

/** Kartadagi kanal yorlig'i: Instagram/Telegram — o'zi, Offline — "Do'kon", qolgani — "Ilova" */
export const histChannelLabel = (ch: Channel) =>
  ch === 'instagram' ? 'Instagram' : ch === 'telegram' ? 'Telegram' : ch === 'offline' ? 'Do\'kon' : 'Ilova'

/** Filtr guruhlash (GRP): kanal → Instagram/Telegram/Ilova; to'lov turi → Naqd/Online */
export const histGroupValue: Record<HistKey, (t: Transaction) => string> = {
  channel: t => t.channel === 'instagram' ? 'Instagram' : t.channel === 'telegram' ? 'Telegram' : 'Ilova',
  type: t => t.segment,
  status: t => statusLabel[t.status],
  pay: t => HIST_PAY[t.payStatus].label,
  payType: t => t.method === 'cash' ? 'Naqd' : 'Online',
}

/** Guruh joriy yo'nalishda qo'llanadimi (kanal/tur faqat Sotuvlarda, tur — B2B yoqilgan bo'lsa) */
export function histKeyApplies(k: HistKey, dir: HistDir, b2b: boolean) {
  if (dir === 'in' && (k === 'channel' || k === 'type')) return false
  if (k === 'type' && !b2b) return false
  return true
}

export const histDirKind = (d: HistDir) => d === 'out' ? 'sale' : 'purchase'

/** Ta'minotchi logosi ranglari (§6): Coca-Cola, Nestle, qolganlari */
export function histSupplierColors(name: string) {
  const n = name.toLowerCase()
  if (n.includes('coca')) return { c: '#c81e1e', bg: '#fde8e8' }
  if (n.includes('nestl')) return { c: '#1d4ed8', bg: '#e8f0fb' }
  return { c: '#9a5b0b', bg: '#fbefdc' }
}

/** "Oq Suv Sut MChJ" → "OS", "\"Nur\" kafesi" → "NK", "Coca-Cola 1.5 L" → "CC" */
export function histInitials(name: string) {
  const words = name.replace(/["'«»“”]/g, '').split(/[\s-]+/).filter(w => /^\p{L}/u.test(w))
  return words.slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?'
}

export function useHistFilters() {
  const dir = useState<HistDir>('hist-dir', () => 'out')
  const query = useState('hist-query', () => '')
  const hf = useState<HistFilters>('hist-hf', emptyHistFilters)
  const hfDraft = useState<HistFilters>('hist-hf-draft', emptyHistFilters)
  return { dir, query, hf, hfDraft }
}

/** Tranzaksiya tomoni: mijoz yoki tashkilot nomi */
export function useTxParty() {
  const { customerById, orgById } = useStore()
  return (t: Transaction) => {
    if (t.customerId) return customerById(t.customerId)?.name ?? 'Mijoz'
    if (t.orgId) return orgById(t.orgId)?.name ?? 'Tashkilot'
    return 'Umumiy mijoz'
  }
}

/** Ro'yxat: yo'nalish → filtrlar → qidiruv (§7 dagi `hist`), yangi buyurtmalar boshida */
export function useHistList() {
  const { transactions, settings } = useStore()
  const { dir, query } = useHistFilters()
  const party = useTxParty()
  const keys: HistKey[] = ['channel', 'type', 'status', 'pay', 'payType']

  function run(f: HistFilters) {
    const d = dir.value
    const b2b = settings.value.b2b
    const q = query.value.trim().toLowerCase()
    return transactions.value
      .filter(t => t.kind === histDirKind(d))
      .filter(t => keys.every(k => f[k] === HIST_ALL || !histKeyApplies(k, d, b2b) || histGroupValue[k](t) === f[k]))
      .filter(t => !q || `${party(t)} ${t.no}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  /** Faol (qo'llanadigan) filtrlar soni — filtr tugmasi badge'i */
  function activeCount(f: HistFilters) {
    return keys.filter(k => f[k] !== HIST_ALL && histKeyApplies(k, dir.value, settings.value.b2b)).length
  }

  return { run, activeCount }
}
