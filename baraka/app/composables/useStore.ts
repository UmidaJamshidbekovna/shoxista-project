// Ilovaning umumiy holati (state). Boshlang'ich ma'lumotlar ~/services/api.ts dan olinadi
// (hozircha namunaviy `sampleApi`); biznes amallari (sotuv, kirim, to'lov, qaytarish) — useLedger().
import { api } from '~/services/api'
import type { Cart, Payment, Product, Transaction } from '~/data/types'

export function useStore() {
  const business = useState('business', () => api.load('business'))
  const branches = useState('branches', () => api.load('branches'))
  const warehouses = useState('warehouses', () => api.load('warehouses'))
  const categories = useState('categories', () => api.load('categories'))
  const products = useState('products', () => api.load('products'))
  const customers = useState('customers', () => api.load('customers'))
  const organizations = useState('organizations', () => api.load('organizations'))
  const transactions = useState('transactions', () => api.load('transactions'))
  /** Yagona to'lovlar jurnali (qarz to'lovi, balans, ta'minotchiga to'lov, kirim, sotuv, qaytarish) */
  const payments = useState<Payment[]>('payments', () => api.load('payments'))
  const employees = useState('employees', () => api.load('employees'))
  const chats = useState('chats', () => api.load('chats'))
  const notifications = useState('notifications', () => api.load('notifications'))
  const suppliers = useState('suppliers', () => api.load('suppliers'))

  /** Joriy foydalanuvchi roli: egasi yoki xodim (Profil'da almashtiriladi — demo uchun) */
  const role = useState<'owner' | 'staff'>('role', () => 'owner')
  const currentBranchId = useState('branch', () => 'b1')

  /** Sotish savatlari: bir nechta mijoz bilan parallel ishlash (hold) */
  const carts = useState<Cart[]>('carts', () => [newCart(1)])
  const activeCartId = useState('active-cart', () => carts.value[0]!.id)

  /** Sozlamalar (Profile.md §8, §11) */
  const settings = useState('settings', () => ({
    // Do'kon sozlamalari
    currency: 'UZS' as 'UZS' | 'USD',
    usdRate: 12650,
    b2b: true,
    confirm: false,
    showPrices: true,
    showPhone: true,
    dailyReport: true,
    lowStock: true,
    // Ilova sozlamalari
    theme: 'day' as 'day' | 'night' | 'system',
    lang: 'uz' as 'uz' | 'ru' | 'en',
    push: true,
  }))

  /** Ijtimoiy tarmoqlar (Profile.md §7). Namunaviy qiymatlar — sample.ts (`socials`) */
  const socials = useState('socials', () => api.load('socials'))

  // --- yordamchilar ---
  const productById = (id: string) => products.value.find(p => p.id === id)
  const customerById = (id?: string) => customers.value.find(c => c.id === id)
  const orgById = (id?: string) => organizations.value.find(o => o.id === id)
  const categoryById = (id: string) => categories.value.find(c => c.id === id)
  const branchById = (id: string) => branches.value.find(b => b.id === id)
  const txById = (id: string) => transactions.value.find(t => t.id === id)

  const stockState = (p: Product): 'ok' | 'low' | 'out' => p.stock <= 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok'
  const lowStock = computed(() => products.value.filter(p => stockState(p) !== 'ok'))

  /** Mijozlar bizga qarz (jami) va biz ta'minotchilarga qarz (jami) */
  const receivable = computed(() => customers.value.reduce((s, c) => s + Math.max(0, c.debt), 0)
    + organizations.value.reduce((s, o) => s + Math.max(0, -o.balance), 0))
  const payable = computed(() => organizations.value.reduce((s, o) => s + Math.max(0, o.balance), 0))

  const activeOnlineOrders = computed(() => transactions.value.filter(t =>
    t.kind === 'sale' && t.channel !== 'offline' && ['pending', 'processing', 'shipping'].includes(t.status)))
  const supplierOrders = computed(() => transactions.value.filter(t => t.kind === 'purchase'))
  const unreadChats = computed(() => chats.value.reduce((s, c) => s + c.unread, 0))
  const unreadNotifications = computed(() => notifications.value.filter(n => !n.read).length)

  /** Qaytarilgan va bekor qilinganlar jamiga kirmaydi */
  const countsInTotal = (t: Transaction) => t.status !== 'returned' && t.status !== 'cancelled'

  /** Keyingi raqam: "S-1053" / "P-0312". Noto'g'ri formatdagi raqamlar e'tiborga olinmaydi (NaN bo'lmaydi) */
  function nextNo(kind: 'sale' | 'purchase') {
    const prefix = kind === 'sale' ? 'S-' : 'P-'
    const nums = transactions.value
      .filter(t => t.kind === kind)
      .map(t => /^[A-Z]+-(\d+)$/i.exec(t.no)?.[1])
      .map(n => (n ? Number(n) : Number.NaN))
      .filter(n => Number.isFinite(n))
    return prefix + String(Math.max(0, ...nums) + 1).padStart(4, '0')
  }

  /**
   * Tranzaksiyani ro'yxatga qo'shadi va qoldiqni yangilaydi (sotuv −, xarid +). Qoldiq hech qachon manfiy bo'lmaydi.
   * Pul (qarz/balans/statistika) bu yerda o'zgarmaydi — buning uchun useLedger().sell / receiveGoods ishlating.
   */
  function addTransaction(t: Omit<Transaction, 'id' | 'no'>) {
    const full: Transaction = { ...t, id: uid('t'), no: nextNo(t.kind), stockApplied: true }
    transactions.value = [full, ...transactions.value]
    for (const i of t.items) {
      const p = productById(i.productId)
      if (!p || !Number.isFinite(i.qty)) continue
      p.stock = Math.max(0, roundQty(p.stock + (t.kind === 'sale' ? -i.qty : i.qty)))
    }
    return full
  }

  function newCart(n: number): Cart {
    return { id: uid('cart'), label: `Savat ${n}`, lines: [], discount: 0, createdAt: new Date().toISOString() }
  }

  return {
    business, branches, warehouses, categories, products, customers, organizations, transactions, payments,
    employees, chats, notifications, suppliers, role, currentBranchId, carts, activeCartId, settings, socials,
    productById, customerById, orgById, categoryById, branchById, txById, stockState, lowStock,
    receivable, payable, activeOnlineOrders, supplierOrders, unreadChats, unreadNotifications,
    countsInTotal, nextNo, addTransaction, newCart,
  }
}
