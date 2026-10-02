// POS (Sotish) holati va yordamchilari: faol savat, qatorlar, chek qo'shimchalari
import type { Cart, DebtTerm, PayMethod, Product } from '~/data/types'

export interface PosPayment { method: PayMethod, amount: number }
export interface PosReceiptExtra {
  subtotal: number
  discount: number
  payments: PosPayment[]
  change: number
  debt: number
  term?: DebtTerm
  dueDate?: string
}
export interface PosDetected { productId: string, qty: number, confidence?: number, on: boolean }

const norm = (s: string) => s.toLowerCase().replace(/[’‘`ʻʼ]/g, '\'').replace(/\s+/g, ' ').trim()

const NUM_WORDS: Record<string, number> = {
  bir: 1, bitta: 1, ikki: 2, ikkita: 2, uch: 3, uchta: 3, 'to\'rt': 4, 'to\'rtta': 4, besh: 5, beshta: 5,
  olti: 6, oltita: 6, yetti: 7, yettita: 7, sakkiz: 8, sakkizta: 8, 'to\'qqiz': 9, 'to\'qqizta': 9, 'o\'n': 10, 'o\'nta': 10,
}

export function usePos() {
  const store = useStore()
  const { carts, activeCartId, products } = store
  const receipts = useState<Record<string, PosReceiptExtra>>('pos-receipts', () => ({}))

  const cart = computed<Cart>(() => carts.value.find(c => c.id === activeCartId.value) ?? carts.value[0]!)
  const lines = computed(() => cart.value.lines
    .map(l => ({ ...l, product: store.productById(l.productId)! }))
    .filter(l => l.product))
  const count = computed(() => cart.value.lines.reduce((s, l) => s + l.qty, 0))
  const subtotal = computed(() => cart.value.lines.reduce((s, l) => s + l.qty * l.price, 0))
  const total = computed(() => Math.max(0, subtotal.value - cart.value.discount))
  const customer = computed(() => store.customerById(cart.value.customerId))

  const qtyInCart = (id: string, c: Cart = cart.value) => c.lines.find(l => l.productId === id)?.qty ?? 0
  const cartLabel = (c: Cart) => store.customerById(c.customerId)?.name.split(' ')[0] ?? c.label
  const cartTotal = (c: Cart) => Math.max(0, c.lines.reduce((s, l) => s + l.qty * l.price, 0) - c.discount)

  /** Qo'shadi; ombordagi qoldiqdan oshsa false qaytaradi */
  function add(p: Product, qty = 1): boolean {
    const line = cart.value.lines.find(l => l.productId === p.id)
    const next = (line?.qty ?? 0) + qty
    if (next > p.stock) return false
    if (line) line.qty = next
    else cart.value.lines.push({ productId: p.id, qty, price: p.price })
    return true
  }
  function setQty(id: string, qty: number) {
    if (qty <= 0) return remove(id)
    const line = cart.value.lines.find(l => l.productId === id)
    if (line) line.qty = qty
  }
  function remove(id: string) {
    cart.value.lines = cart.value.lines.filter(l => l.productId !== id)
    if (!cart.value.lines.length) cart.value.discount = 0
  }
  function clampDiscount() {
    if (cart.value.discount > subtotal.value) cart.value.discount = subtotal.value
  }

  function createCart() {
    const n = Math.max(0, ...carts.value.map(c => Number(c.label.replace(/\D/g, '')) || 0)) + 1
    const c = store.newCart(n)
    carts.value.push(c)
    activeCartId.value = c.id
    return c
  }
  function deleteCart(id: string) {
    const idx = carts.value.findIndex(c => c.id === id)
    carts.value.splice(idx, 1)
    if (!carts.value.length) carts.value.push(store.newCart(1))
    if (activeCartId.value === id) activeCartId.value = carts.value[Math.max(0, idx - 1)]!.id
  }
  function resetActive() {
    cart.value.lines = []
    cart.value.discount = 0
    cart.value.customerId = undefined
  }

  const findByCode = (code: string) => {
    const c = code.trim().toLowerCase()
    if (!c) return undefined
    return products.value.find(p => p.barcode === c || p.sku.toLowerCase() === c)
  }

  /** Nom bo'yicha taxminiy moslik ("guruch" → "Guruch Lazer 1 kg") */
  function matchProduct(phrase: string): Product | undefined {
    const q = norm(phrase).split(' ').filter(w => w.length >= 3)
    if (!q.length) return undefined
    let best: Product | undefined
    let bestScore = 0
    for (const p of products.value) {
      const words = norm(p.name).split(/[\s\-.]+/).filter(w => w.length >= 3)
      let score = 0
      for (const w of q) {
        for (const pw of words) {
          if (pw === w) score += 3
          else if (pw.startsWith(w.slice(0, 4)) || w.startsWith(pw.slice(0, 4))) score += 2
          else if (pw.includes(w) || w.includes(pw)) score += 1
        }
      }
      if (score > bestScore) { best = p; bestScore = score }
    }
    return best
  }

  /** "2 ta guruch, 1 ta sut va ikkita choy" → [{productId, qty}] */
  function parseSpeech(text: string): { items: PosDetected[], unknown: string[] } {
    const parts = norm(text).split(/,|\bva\b|\bhamda\b|;|\./).map(s => s.trim()).filter(Boolean)
    const items: PosDetected[] = []
    const unknown: string[] = []
    for (const part of parts) {
      const m = part.match(/^(\d+(?:[.,]\d+)?|[a-z']+)\s*(?:ta|dona|kg|kilo|litr|l)?\s+(.+)$/)
      let qty = 1
      let name = part
      if (m) {
        const n = /^\d/.test(m[1]!) ? Number(m[1]!.replace(',', '.')) : NUM_WORDS[m[1]!]
        if (n) { qty = n; name = m[2]! }
      }
      const p = matchProduct(name)
      if (!p) { unknown.push(part); continue }
      const ex = items.find(i => i.productId === p.id)
      if (ex) ex.qty += qty
      else items.push({ productId: p.id, qty, on: p.stock > 0 })
    }
    return { items, unknown }
  }

  return {
    store, cart, lines, count, subtotal, total, customer, receipts,
    qtyInCart, cartLabel, cartTotal, add, setQty, remove, clampDiscount,
    createCart, deleteCart, resetActive, findByCode, matchProduct, parseSpeech,
  }
}

/** +998 XX XXX XX XX formatlash */
export function posFormatPhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  d = d.slice(0, 9)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+998${parts.length ? ' ' : ''}${parts.join(' ')}`
}
export const posIsPhone = (s: string) => /^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(s)
