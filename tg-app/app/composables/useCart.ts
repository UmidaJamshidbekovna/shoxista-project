import { products, type Product } from '~/data/products'

export type PayMethod = 'naqd' | 'karta' | 'qarz' | 'aralash'

export interface Customer { name: string, initials: string, debt: number }

// Kassa → Savat → Chek oqimi uchun umumiy holat
export function useCart() {
  // Dizayndagi boshlang'ich savat: 2× guruch, 1× sut, 1× yog', 2× choy
  const items = useState<Record<number, number>>('cart', () => ({ 1: 2, 2: 1, 3: 1, 4: 2 }))
  const customer = useState<Customer | null>('cart-customer', () => ({ name: 'Dilnoza Karimova', initials: 'DK', debt: 120000 }))
  const method = useState<PayMethod>('cart-method', () => 'aralash')
  const cashPart = useState<number>('cart-cash', () => 50000)
  const lastReceipt = useState<ReturnType<typeof snapshot> | null>('last-receipt', () => null)

  const lines = computed(() =>
    Object.entries(items.value)
      .map(([id, qty]) => ({ product: products.find(p => p.id === Number(id))!, qty }))
      .filter(l => l.product && l.qty > 0),
  )
  const count = computed(() => lines.value.reduce((s, l) => s + l.qty, 0))
  const subtotal = computed(() => lines.value.reduce((s, l) => s + l.qty * l.product.price, 0))
  // Mijoz kartasi chegirmasi (demo)
  const discount = computed(() => (customer.value && subtotal.value > 0 ? 4000 : 0))
  const total = computed(() => Math.max(0, subtotal.value - discount.value))

  function add(p: Product) {
    if (p.stock <= 0) return
    items.value = { ...items.value, [p.id]: (items.value[p.id] ?? 0) + 1 }
  }
  function dec(p: Product) {
    const q = (items.value[p.id] ?? 0) - 1
    const next = { ...items.value }
    if (q <= 0) delete next[p.id]
    else next[p.id] = q
    items.value = next
  }

  function snapshot() {
    return {
      no: String(4817 + Math.floor(Math.random() * 100)).padStart(6, '0'),
      date: new Date(),
      lines: lines.value.map(l => ({ name: l.product.name, qty: l.qty, sum: l.qty * l.product.price })),
      discount: discount.value,
      total: total.value,
      method: method.value,
      cash: method.value === 'aralash' ? Math.min(cashPart.value, total.value) : method.value === 'naqd' ? total.value : 0,
      customer: customer.value?.name,
    }
  }

  function checkout() {
    lastReceipt.value = snapshot()
    items.value = {}
  }

  return { items, lines, count, subtotal, discount, total, customer, method, cashPart, lastReceipt, add, dec, checkout }
}
