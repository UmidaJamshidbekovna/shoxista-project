// Ma'lumot turlari (README §5 arxitekturasiga mos, backend ulanganda API javoblari shu shaklda bo'ladi)

export type Role = 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'courier'
export type Channel = 'offline' | 'telegram' | 'instagram' | 'app'
export type PayMethod = 'cash' | 'card' | 'click' | 'payme' | 'transfer' | 'balance'
export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
export type PayStatus = 'paid' | 'partial' | 'unpaid'
export type DebtTerm = '3d' | '1w' | '2w' | '1m'

export interface Category { id: string, name: string, color: string, order: number }

/** O'lchov birliklari (Stock and History.md §9). `qadoq` eski ma'lumotlar bilan moslik uchun qoldirilgan */
export type ProductUnit = 'dona' | 'kg' | 'litr' | 'quti' | 'blok' | 'paket' | 'metr' | 'qadoq'

export interface ProductReview { name: string, rating: number, text: string, date: string }

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  categoryId: string
  unit: ProductUnit
  price: number
  cost: number
  stock: number
  minStock: number
  warehouseId: string
  image?: string
  /** Rasm yo'q bo'lsa ko'rsatiladigan emoji */
  emoji: string
  /** Rasm maydoni va ro'yxatdagi kvadrat foni */
  tint?: string
  /** Mahsulot rasmlari (URL yoki data URL) */
  images?: string[]
  /** Ta'minotchi tashkilot (Organization.id) */
  supplierId?: string
  description?: string
  /** O'rtacha reyting (1–5) */
  rating?: number
  reviews?: ProductReview[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  /** Musbat = mijoz bizga qarz, manfiy = bizda uning balansi (oldindan to'lov) */
  debt: number
  totalSpent: number
  purchases: number
  lastVisit: string
  channel: Channel
  note?: string
}

export interface Organization {
  id: string
  name: string
  type: 'supplier' | 'client'
  /** Musbat = biz ularga qarz, manfiy = ular bizga qarz */
  balance: number
  phone: string
  inn: string
  address: string
  contact: string
  /** Biz o'zimiz yaratgan (platformada ro'yxatdan o'tmagan) tashkilot */
  ownCreated: boolean
  categories: string[]
  logoColor: string
}

export interface TxItem { productId: string, name: string, qty: number, price: number }

export interface Transaction {
  id: string
  no: string
  kind: 'sale' | 'purchase'
  segment: 'B2C' | 'B2B'
  channel: Channel
  date: string // ISO
  customerId?: string
  orgId?: string
  items: TxItem[]
  total: number
  paid: number
  method: PayMethod
  status: OrderStatus
  payStatus: PayStatus
  cashier: string
  branchId: string
}

export interface WorkDay { day: string, open: string, close: string, off: boolean }

export interface Branch {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  manager: string
  phone: string
  hours: WorkDay[]
}

export interface Warehouse { id: string, name: string, branchId: string, address: string, manager: string }

export interface Employee {
  id: string
  name: string
  phone: string
  role: Role
  branchId: string
  active: boolean
  permissions: string[]
}

export interface ChatMessage { id: string, from: 'me' | 'them' | 'ai', text: string, time: string, orderId?: string }

export interface ChatThread {
  id: string
  kind: 'customer' | 'org' | 'ai' | 'support'
  channel: Channel
  title: string
  refId?: string
  unread: number
  messages: ChatMessage[]
}

export interface Notification { id: string, icon: string, title: string, text: string, time: string, read: boolean, to?: string }

export interface SupplierListing {
  id: string
  name: string
  category: string
  city: string
  rating: number
  products: number
  minOrder: number
  promo?: string
  color: string
  connected: boolean
  requested: boolean
}

export interface CartLine { productId: string, qty: number, price: number }

export interface Cart {
  id: string
  label: string
  customerId?: string
  lines: CartLine[]
  discount: number
  createdAt: string
}

export interface Business {
  name: string
  username: string
  inn: string
  description: string
  phone: string
  logoColor: string
  type: 'offline' | 'online' | 'mixed' | 'wholesale'
  plan: 'Start' | 'Pro' | 'Enterprise'
  planUntil: string
  owner: string
}
