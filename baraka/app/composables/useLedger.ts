// Biznes qoidalari (domain layer): pul va qoldiqqa ta'sir qiluvchi barcha amallar shu yerda.
// Har bir amal qoldiq, mijoz qarzi/balansi, tashkilot balansi, mijoz statistikasi, tranzaksiyalar va
// yagona to'lovlar jurnalini (useStore().payments) birgalikda, izchil yangilaydi.
// Sahifalar holatni to'g'ridan-to'g'ri o'zgartirmaydi — shu funksiyalarni chaqiradi.
import type { Channel, Payment, PayMethod, PayStatus, Product, Transaction, TxItem } from '~/data/types'
import type { AdjustReason } from '~/composables/useInv'


export interface SellInput {
  customerId?: string
  items: TxItem[]
  /** Chegirmadan keyingi jami summa */
  total: number
  /** To'lov usullari bo'yicha (naqd qaytim chiqarilgan holda). Balansdan yechilgani `method: 'balance'` */
  payments: { method: PayMethod, amount: number }[]
  /** Qarzga yoziladigan summa (mijoz majburiy) */
  debt: number
  cashier: string
  branchId: string
  segment?: Transaction['segment']
  channel?: Channel
  date?: string
}

export interface ReceiveGoodsInput {
  orgId: string
  items: { productId: string, qty: number, price: number }[]
  /** Qabul paytida ta'minotchiga to'langan summa */
  paid: number
  method: PayMethod
  cashier: string
  branchId: string
  /** Mahsulot tannarxini kirim narxiga yangilash (standart: true) */
  updateCost?: boolean
}

export interface StockAdjustResult { before: number, after: number, delta: number }

const fmtQty = (n: number) => String(roundQty(n))
const payStatusOf = (paid: number, total: number): PayStatus => paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
const validAmount = (n: number) => Number.isFinite(n) && n > 0

export function useLedger() {
  const store = useStore()
  const { show } = useToast()

  // ---------- To'lovlar jurnali ----------

  /** To'lovni yagona jurnalga yozadi (holatga boshqa ta'sir qilmaydi) */
  function recordPayment(p: Omit<Payment, 'id' | 'date'> & { date?: string }): Payment {
    const full: Payment = { ...p, id: uid('pay'), date: p.date ?? new Date().toISOString(), amount: roundMoney(p.amount) }
    store.payments.value = [full, ...store.payments.value]
    return full
  }

  const paymentsOf = (refId: string) => store.payments.value.filter(p => p.refId === refId)

  // ---------- Qoldiq ----------

  /** Bir xil mahsulot bir necha qatorda bo'lsa ham jami miqdorni tekshiradi */
  function stockShortage(items: { productId: string, qty: number }[]): string | null {
    const need = new Map<string, number>()
    for (const i of items) {
      if (!Number.isFinite(i.qty) || i.qty <= 0) return 'Miqdor noto\'g\'ri'
      need.set(i.productId, (need.get(i.productId) ?? 0) + i.qty)
    }
    for (const [id, qty] of need) {
      const p = store.productById(id)
      if (!p) return 'Savatdagi mahsulot topilmadi (o\'chirilgan bo\'lishi mumkin)'
      if (roundQty(qty) > p.stock) {
        return p.stock > 0
          ? `${p.name}: omborda faqat ${fmtQty(p.stock)} ${p.unit} qoldi`
          : `${p.name} — tugagan`
      }
    }
    return null
  }

  /** Qo'lda tuzatish: kirim (+), hisobdan chiqarish (−, 0 dan past emas), inventarizatsiya (aniq qiymat) */
  function adjustStock(p: Product, reason: AdjustReason, qty: number): StockAdjustResult | null {
    if (!Number.isFinite(qty) || qty < 0) {
      show('Miqdor noto\'g\'ri', 'error')
      return null
    }
    const before = p.stock
    if (reason === 'in') p.stock = roundQty(before + qty)
    else if (reason === 'writeoff') p.stock = Math.max(0, roundQty(before - qty))
    else p.stock = roundQty(qty)
    return { before, after: p.stock, delta: roundQty(p.stock - before) }
  }

  // ---------- Sotuv (POS) ----------

  /**
   * Sotuvni yakunlaydi. Hisob-kitobdan oldin BARCHA qatorlar qoldig'i qayta tekshiriladi (boshqa savatlar
   * shu orada sotib yuborgan bo'lishi mumkin). Muvaffaqiyatsiz bo'lsa toast ko'rsatib `null` qaytaradi.
   */
  function sell(input: SellInput): Transaction | null {
    const items = input.items.filter(i => i.qty > 0)
    if (!items.length) {
      show('Savat bo\'sh', 'error')
      return null
    }
    const shortage = stockShortage(items)
    if (shortage) {
      show(shortage, 'error')
      return null
    }
    const cust = store.customerById(input.customerId)
    if (input.customerId && !cust) {
      show('Mijoz topilmadi — qaytadan tanlang', 'error')
      return null
    }
    const total = roundMoney(input.total)
    const debt = roundMoney(Math.max(0, input.debt))
    const pays = input.payments.map(p => ({ method: p.method, amount: roundMoney(p.amount) })).filter(p => p.amount > 0)
    const balanceUsed = pays.filter(p => p.method === 'balance').reduce((s, p) => s + p.amount, 0)
    const paid = Math.min(total, pays.reduce((s, p) => s + p.amount, 0))

    if ((debt > 0 || balanceUsed > 0) && !cust) {
      show('Qarz yoki balansdan to\'lov uchun mijoz tanlang', 'error')
      return null
    }
    if (cust && balanceUsed > Math.max(0, -cust.debt)) {
      show(`Balansda faqat ${formatSom(Math.max(0, -cust.debt))} so'm bor`, 'error')
      return null
    }
    if (paid + debt < total) {
      show(`Yana ${formatSom(total - paid - debt)} so'm kerak yoki qarzga yozing`, 'error')
      return null
    }

    const date = input.date ?? new Date().toISOString()
    const main = [...pays].sort((a, b) => b.amount - a.amount)[0]?.method ?? 'cash'
    const tx = store.addTransaction({
      kind: 'sale', segment: input.segment ?? 'B2C', channel: input.channel ?? 'offline', date,
      customerId: cust?.id,
      items: items.map(i => ({ ...i })),
      total, paid, method: main, status: 'delivered', payStatus: payStatusOf(paid, total),
      cashier: input.cashier, branchId: input.branchId,
      balancePaid: balanceUsed || undefined,
    })

    if (cust) {
      cust.debt = roundMoney(cust.debt + debt + balanceUsed)
      cust.totalSpent = roundMoney(cust.totalSpent + total)
      cust.purchases += 1
      cust.lastVisit = date
    }
    for (const p of pays) {
      recordPayment({ refId: cust?.id, amount: p.amount, method: p.method, dir: 'in', note: `#${tx.no} sotuv`, txId: tx.id, date })
    }
    return tx
  }

  // ---------- Bekor qilish / qaytarish ----------


  /** Tasdiqlash oynasi uchun: bekor qilish/qaytarishda nima bo'lishini tushuntiradi */
  function describeReversal(t: Transaction) {
    const rem = Math.max(0, t.total - t.paid)
    const paid = Math.min(t.paid, t.total)
    const isSale = t.kind === 'sale'
    const parts: string[] = [
      t.stockApplied
        ? (isSale ? 'Mahsulotlar omborga qaytariladi' : 'Mahsulotlar ombordan chiqariladi')
        : 'Ombor qoldig\'i o\'zgarmaydi',
    ]
    if (rem) parts.push(`${formatSom(rem)} so'm qarz yopiladi`)
    if (paid) {
      if (isSale && t.customerId && store.customerById(t.customerId)) parts.push(`${formatSom(paid)} so'm mijoz balansiga qaytariladi`)
      else if (isSale && t.orgId) parts.push(`${formatSom(paid)} so'm tashkilot hisobiga qaytariladi`)
      else if (isSale) parts.push(`${formatSom(paid)} so'm mijozga qaytariladi`)
      else parts.push(`${formatSom(paid)} so'm ta'minotchidan qaytarib olinadi`)
    }
    return `${parts.join(', ')}.`
  }

  function reverse(t: Transaction, status: 'cancelled' | 'returned'): boolean {
    if (!store.countsInTotal(t)) {
      show('Bu buyurtma allaqachon yopilgan', 'error')
      return false
    }
    const isSale = t.kind === 'sale'
    let clipped = false
    // Qoldiq faqat tranzaksiya uni haqiqatan o'zgartirgan bo'lsa tiklanadi (seed ma'lumotlarda — yo'q)
    if (t.stockApplied) {
      for (const i of t.items) {
        const p = store.productById(i.productId)
        if (!p || !Number.isFinite(i.qty)) continue
        if (isSale) p.stock = roundQty(p.stock + i.qty)
        else {
          if (p.stock < i.qty) clipped = true
          p.stock = Math.max(0, roundQty(p.stock - i.qty))
        }
      }
    }

    const rem = Math.max(0, roundMoney(t.total - t.paid))
    const paid = Math.min(t.paid, t.total)
    const c = store.customerById(t.customerId)
    const o = store.orgById(t.orgId)
    const note = `#${t.no} ${status === 'cancelled' ? 'bekor qilindi' : 'qaytarildi'}`

    if (isSale && c) {
      // To'lanmagan qoldiq qarzdan olinadi, to'langan summa (balansdan to'langani ham) balansga qaytadi
      c.debt = roundMoney(c.debt - rem - paid)
      c.totalSpent = Math.max(0, roundMoney(c.totalSpent - t.total))
      c.purchases = Math.max(0, c.purchases - 1)
      if (paid) recordPayment({ refId: c.id, amount: paid, method: 'balance', dir: 'out', note: `${note} — balansga`, txId: t.id })
    }
    else if (isSale && o) {
      // B2B mijoz: qarzi yopiladi, to'lagani uning foydasiga (biz qarzdormiz)
      o.balance = roundMoney(o.balance + rem + paid)
      if (paid) recordPayment({ refId: o.id, amount: paid, method: t.method, dir: 'out', note, txId: t.id })
    }
    else if (isSale) {
      // Umumiy mijoz: to'langan summa qo'lga qaytariladi (balansdan to'lov bo'lmaydi)
      if (paid) recordPayment({ amount: paid, method: t.method, dir: 'out', note, txId: t.id })
    }
    else if (o) {
      // Xarid: bizning qarzimiz yopiladi, to'laganimizni ta'minotchi qaytarishi kerak
      o.balance = roundMoney(o.balance - rem - paid)
      if (paid) recordPayment({ refId: o.id, amount: paid, method: t.method, dir: 'in', note, txId: t.id })
    }

    t.status = status
    if (clipped) show('Ba\'zi mahsulotlar allaqachon sotilgan — qoldiq 0 gacha kamaytirildi', 'info')
    return true
  }

  const cancelOrder = (t: Transaction) => reverse(t, 'cancelled')
  const returnOrder = (t: Transaction) => reverse(t, 'returned')

  // ---------- Kirim (ta'minotchidan qabul) ----------

  function receiveGoods(input: ReceiveGoodsInput): Transaction | null {
    const org = store.orgById(input.orgId)
    if (!org) {
      show('Ta\'minotchini tanlang', 'error')
      return null
    }
    const items: TxItem[] = []
    for (const l of input.items) {
      const p = store.productById(l.productId)
      if (!p) {
        show('Mahsulot topilmadi (o\'chirilgan bo\'lishi mumkin)', 'error')
        return null
      }
      if (!(l.qty > 0) || !Number.isFinite(l.qty) || !(l.price >= 0) || !Number.isFinite(l.price)) {
        show('Miqdor va narxlarni tekshiring', 'error')
        return null
      }
      items.push({ productId: p.id, name: p.name, qty: l.qty, price: l.price })
    }
    if (!items.length) {
      show('Mahsulot qo\'shing', 'error')
      return null
    }
    const total = items.reduce((s, i) => s + roundMoney(i.qty * i.price), 0)
    const paid = roundMoney(input.paid)
    if (!Number.isFinite(paid) || paid < 0 || paid > total) {
      show('To\'lov summasini tekshiring', 'error')
      return null
    }

    const tx = store.addTransaction({
      kind: 'purchase', segment: 'B2B', channel: 'app', date: new Date().toISOString(), orgId: org.id, items,
      total, paid, method: input.method, status: 'delivered', payStatus: payStatusOf(paid, total),
      cashier: input.cashier, branchId: input.branchId,
    })
    if (input.updateCost !== false) {
      for (const i of items) {
        const p = store.productById(i.productId)
        if (p) p.cost = i.price
      }
    }
    org.balance = roundMoney(org.balance + total - paid)
    if (paid > 0) recordPayment({ refId: org.id, amount: paid, method: input.method, dir: 'out', note: `#${tx.no} kirim uchun`, txId: tx.id, date: tx.date })
    return tx
  }

  // ---------- Qarz va hisob-kitob to'lovlari ----------

  /** Mijoz qarzini to'laydi (`debt`) yoki balansini to'ldiradi (`topup`) */
  function receivePayment(customerId: string, amount: number, method: PayMethod, kind: 'debt' | 'topup' = 'debt'): Payment | null {
    const c = store.customerById(customerId)
    if (!c) return null
    if (!validAmount(amount)) {
      show('Summani to\'g\'ri kiriting', 'error')
      return null
    }
    if (kind === 'debt' && amount > Math.max(0, c.debt)) {
      show(`Qarz ${formatSom(Math.max(0, c.debt))} so'm — undan ko'p qabul qilib bo'lmaydi`, 'error')
      return null
    }
    c.debt = roundMoney(c.debt - amount)
    return recordPayment({ refId: c.id, amount, method, dir: 'in', note: kind === 'debt' ? 'Qarz to\'lovi' : 'Balansga qo\'shildi' })
  }

  /** Biz ta'minotchiga to'laymiz (balans kamayadi) */
  function paySupplier(orgId: string, amount: number, method: PayMethod): Payment | null {
    const o = store.orgById(orgId)
    if (!o) return null
    if (!validAmount(amount)) {
      show('Summani to\'g\'ri kiriting', 'error')
      return null
    }
    o.balance = roundMoney(o.balance - amount)
    return recordPayment({ refId: o.id, amount, method, dir: 'out', note: 'To\'lov qilindi' })
  }

  /** B2B mijoz tashkilot bizga to'laydi (balans oshadi) */
  function receiveFromOrg(orgId: string, amount: number, method: PayMethod): Payment | null {
    const o = store.orgById(orgId)
    if (!o) return null
    if (!validAmount(amount)) {
      show('Summani to\'g\'ri kiriting', 'error')
      return null
    }
    o.balance = roundMoney(o.balance + amount)
    return recordPayment({ refId: o.id, amount, method, dir: 'in', note: 'To\'lov qabul qilindi' })
  }

  // ---------- O'chirish (pul yo'qolmasligi uchun himoya) ----------

  /** O'chirib bo'lmasa sababini qaytaradi */
  function customerDeleteBlock(id: string): string | null {
    const c = store.customerById(id)
    if (!c) return null
    if (c.debt > 0) return `Mijozda ${formatSom(c.debt)} so'm qarz bor — avval qarzni yoping`
    if (c.debt < 0) return `Mijoz balansida ${formatSom(-c.debt)} so'm bor — avval balansni qaytaring`
    const n = store.transactions.value.filter(t => t.customerId === id).length
    if (n) return `Mijozning ${n} ta xaridi bor — tarix buzilmasligi uchun o'chirib bo'lmaydi`
    return null
  }

  function deleteCustomer(id: string): boolean {
    const block = customerDeleteBlock(id)
    if (block) {
      show(block, 'error')
      return false
    }
    store.customers.value = store.customers.value.filter(c => c.id !== id)
    // Yetim havolalar: savatdagi mijoz
    for (const cart of store.carts.value) if (cart.customerId === id) cart.customerId = undefined
    return true
  }

  function orgDeleteBlock(id: string): string | null {
    const o = store.orgById(id)
    if (!o || !o.balance) return null
    return o.balance > 0
      ? `Tashkilotga ${formatSom(o.balance)} so'm qarzimiz bor — avval hisobni yoping`
      : `Tashkilot bizga ${formatSom(-o.balance)} so'm qarz — avval hisobni yoping`
  }

  function deleteOrg(id: string): boolean {
    const block = orgDeleteBlock(id)
    if (block) {
      show(block, 'error')
      return false
    }
    store.organizations.value = store.organizations.value.filter(o => o.id !== id)
    for (const p of store.products.value) if (p.supplierId === id) p.supplierId = undefined
    return true
  }

  /**
   * Filialni o'chiradi: joriy filial bo'lsa boshqasiga o'tadi, uning omborlari va xodimlari asosiy filialga
   * o'tkaziladi. Boshqa filial qolmasa — bloklanadi.
   */
  function deleteBranch(id: string): boolean {
    const b = store.branchById(id)
    if (!b) return false
    const rest = store.branches.value.filter(x => x.id !== id)
    const target = rest.find(x => x.main) ?? rest[0]
    if (!target) {
      show('Oxirgi filialni o\'chirib bo\'lmaydi', 'error')
      return false
    }
    if (b.main) {
      show('Asosiy filialni o\'chirib bo\'lmaydi — avval boshqa filialni asosiy qiling', 'error')
      return false
    }
    const whs = store.warehouses.value.filter(w => w.branchId === id)
    store.warehouses.value = store.warehouses.value.map(w => w.branchId === id ? { ...w, branchId: target.id } : w)
    for (const e of store.employees.value) if (e.branchId === id) e.branchId = target.id
    store.branches.value = rest
    if (store.currentBranchId.value === id) store.currentBranchId.value = target.id
    if (whs.length) show(`${whs.length} ta ombor "${target.name}" ga o'tkazildi`, 'info')
    return true
  }

  /** Omborni o'chiradi: undagi mahsulotlar boshqa omborga o'tkaziladi; boshqa ombor bo'lmasa — bloklanadi */
  function deleteWarehouse(id: string): boolean {
    const rest = store.warehouses.value.filter(w => w.id !== id)
    const items = store.products.value.filter(p => p.warehouseId === id)
    const target = rest[0]
    if (items.length && !target) {
      show(`Omborda ${items.length} ta mahsulot bor — avval boshqa ombor qo'shing`, 'error')
      return false
    }
    if (target) for (const p of items) p.warehouseId = target.id
    store.warehouses.value = rest
    if (items.length && target) show(`${items.length} ta mahsulot "${target.name}" ga o'tkazildi`, 'info')
    return true
  }

  return {
    recordPayment, paymentsOf,
    stockShortage, adjustStock,
    sell, cancelOrder, returnOrder, describeReversal,
    receiveGoods, receivePayment, paySupplier, receiveFromOrg,
    customerDeleteBlock, deleteCustomer, orgDeleteBlock, deleteOrg, deleteBranch, deleteWarehouse,
  }
}
