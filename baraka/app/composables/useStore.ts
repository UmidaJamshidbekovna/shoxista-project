// Ilovaning umumiy holati. Hozircha namunaviy ma'lumotlar bilan to'ldiriladi;
// backend ulanganda har bir kolleksiya API'dan yuklanadi.
import * as S from '~/data/sample'
import type { Cart, Product, Transaction } from '~/data/types'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export function useStore() {
  const business = useState('business', () => clone(S.business))
  const branches = useState('branches', () => clone(S.branches))
  const warehouses = useState('warehouses', () => clone(S.warehouses))
  const categories = useState('categories', () => clone(S.categories))
  const products = useState('products', () => clone(S.products))
  const customers = useState('customers', () => clone(S.customers))
  const organizations = useState('organizations', () => clone(S.organizations))
  const transactions = useState('transactions', () => clone(S.transactions))
  const employees = useState('employees', () => clone(S.employees))
  const chats = useState('chats', () => clone(S.chats))
  const notifications = useState('notifications', () => clone(S.notifications))
  const suppliers = useState('suppliers', () => clone(S.supplierListings))

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

  /** Ijtimoiy tarmoqlar (Profile.md §7). permissions: e'lon joylash, kommentga va mijozlarga javob */
  const socials = useState('socials', () => ({
    telegram: {
      connected: true,
      botToken: '7712345678:AAHdemoBarakaMarketToken_AAF6qP',
      botUsername: '@baraka_shop_bot',
      channel: '@baraka_market',
      adminChatId: '-1001842736510',
      permissions: { post: true, comments: true, clients: true },
    },
    instagram: {
      connected: false,
      account: '',
      permissions: { post: true, comments: true, clients: false },
    },
  }))

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

  function nextNo(kind: 'sale' | 'purchase') {
    const prefix = kind === 'sale' ? 'S-' : 'P-'
    const nums = transactions.value.filter(t => t.kind === kind).map(t => Number(t.no.slice(2)))
    return prefix + String(Math.max(0, ...nums) + 1).padStart(4, '0')
  }

  function addTransaction(t: Omit<Transaction, 'id' | 'no'>) {
    const full: Transaction = { ...t, id: `t${Date.now()}`, no: nextNo(t.kind) }
    transactions.value = [full, ...transactions.value]
    // Qoldiqni yangilash
    for (const i of t.items) {
      const p = productById(i.productId)
      if (p) p.stock += t.kind === 'sale' ? -i.qty : i.qty
    }
    return full
  }

  function newCart(n: number): Cart {
    return { id: `cart${Date.now()}${n}`, label: `Savat ${n}`, lines: [], discount: 0, createdAt: new Date().toISOString() }
  }

  return {
    business, branches, warehouses, categories, products, customers, organizations, transactions,
    employees, chats, notifications, suppliers, role, currentBranchId, carts, activeCartId, settings, socials,
    productById, customerById, orgById, categoryById, branchById, txById, stockState, lowStock,
    receivable, payable, activeOnlineOrders, supplierOrders, unreadChats, unreadNotifications,
    countsInTotal, addTransaction, newCart,
  }
}
