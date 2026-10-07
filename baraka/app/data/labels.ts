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

export const permissionList = [
  { id: 'sales', label: 'Sotish (POS)' },
  { id: 'inventory', label: 'Ombor va kirim' },
  { id: 'reports', label: 'Hisobotlar' },
  { id: 'customers', label: 'Mijozlar va qarzlar' },
  { id: 'orders', label: 'Online buyurtmalar' },
  { id: 'chat', label: 'Chat' },
  { id: 'settings', label: 'Do\'kon sozlamalari' },
] as const

export const planLimits = {
  Start: { employees: 2, branches: 1, products: 200, ai: 50 },
  Pro: { employees: 10, branches: 3, products: 5000, ai: 1000 },
  Enterprise: { employees: 999, branches: 99, products: 99999, ai: 99999 },
} as const
