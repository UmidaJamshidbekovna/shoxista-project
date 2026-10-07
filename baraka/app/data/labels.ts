// UI yorliqlari (o'zbekcha)
import type { Channel, DebtTerm, OrderStatus, PayMethod, PayStatus, Role } from './types'

export const statusLabel: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  shipping: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
  returned: 'Qaytarildi',
}
export const statusTone: Record<OrderStatus, 'warn' | 'info' | 'brand' | 'danger' | 'neutral'> = {
  pending: 'warn',
  processing: 'info',
  shipping: 'info',
  delivered: 'brand',
  cancelled: 'danger',
  returned: 'neutral',
}
/** Buyurtma holati oqimi: Kutilmoqda → Jarayonda → Yo'lda → Yetkazildi */
export const statusFlow: OrderStatus[] = ['pending', 'processing', 'shipping', 'delivered']

export const payStatusLabel: Record<PayStatus, string> = { paid: 'To\'langan', partial: 'Qisman', unpaid: 'To\'lanmagan' }
export const payStatusTone: Record<PayStatus, 'brand' | 'warn' | 'danger'> = { paid: 'brand', partial: 'warn', unpaid: 'danger' }

export const methodLabel: Record<PayMethod, string> = {
  cash: 'Naqd', card: 'Karta', click: 'Click', payme: 'Payme', transfer: 'O\'tkazma', balance: 'Balansdan',
}
export const methodIcon: Record<PayMethod, string> = {
  cash: 'cash', card: 'card', click: 'wallet', payme: 'wallet', transfer: 'transfer', balance: 'wallet',
}

export const channelLabel: Record<Channel, string> = { offline: 'Do\'kon', telegram: 'Telegram', instagram: 'Instagram', app: 'Ilova' }
// Home Icons.md §3: Telegram → send, Ilova → mobile
export const channelIcon: Record<Channel, string> = { offline: 'store', telegram: 'send', instagram: 'instagram', app: 'mobile' }

export const roleLabel: Record<Role, string> = { owner: 'Egasi', manager: 'Menejer', cashier: 'Kassir', storekeeper: 'Omborchi', courier: 'Kuryer' }

export const debtTermLabel: Record<DebtTerm, string> = { '3d': '3 kun', '1w': '1 hafta', '2w': '2 hafta', '1m': '1 oy' }
export const debtTermDays: Record<DebtTerm, number> = { '3d': 3, '1w': 7, '2w': 14, '1m': 30 }

/** Xodim ruxsatlari (Profile.md §6) */
export const permissionList = [
  { id: 'kassa', label: 'Kassa' },
  { id: 'orders', label: 'Buyurtmalar' },
  { id: 'stock', label: 'Ombor' },
  { id: 'kirim', label: 'Kirim' },
  { id: 'customers', label: 'Mijozlar' },
  { id: 'reports', label: 'Hisobotlar' },
  { id: 'delivery', label: 'Yetkazish' },
] as const

/** Tarif limitlari (Profile.md §9). Infinity — cheksiz; ai — oylik AI xabarlar */
export const planLimits = {
  Start: { employees: 1, branches: 1, products: 100, ai: 0 },
  Pro: { employees: 5, branches: 1, products: Infinity, ai: 3000 },
  Biznes: { employees: Infinity, branches: Infinity, products: Infinity, ai: Infinity },
} as const
