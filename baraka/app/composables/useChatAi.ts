// Chat uchun "AI": javob takliflari va AI yordamchi javoblari (simulyatsiya, store ma'lumotlari asosida)
import type { ChatThread, Product } from '~/data/types'
import { statusLabel } from '~/data/labels'

const norm = (s: string) => s.toLowerCase().replace(/[‘’ʻʼ`]/g, '\'')
const SKIP = new Set(['dona', 'kg', 'l', 'g'])

export function useChatAi() {
  const store = useStore()
  const { products, transactions, customers, lowStock, activeOnlineOrders, countsInTotal, stockState } = store

  /** Matnda tilga olingan mahsulotlar (so'z boshlanishi bo'yicha) */
  function findProducts(text: string): Product[] {
    const words = norm(text).split(/[^a-z0-9'\-]+/).filter(w => w.length >= 3)
    return products.value.filter((p) => {
      const pw = norm(p.name).split(/[^a-z0-9'\-]+/).filter(w => w.length >= 3 && !SKIP.has(w) && !/^\d/.test(w))
      return pw.some(w => words.some(m => m.startsWith(w.slice(0, Math.min(4, w.length)))))
    })
  }

  const priceLine = (p: Product) => stockState(p) === 'out'
    ? `Kechirasiz, ${p.name} hozircha tugagan. 1–2 kunda keladi, sizga xabar beramiz.`
    : `Ha, ${p.name} bor — ${formatSom(p.price)} so'm. Omborda ${p.stock} ${p.unit} qoldi.`

  /** Mijoz/firma suhbati uchun 2–3 ta javob taklifi */
  function suggestions(thread: ChatThread): string[] {
    const them = thread.messages.filter(m => m.from === 'them')
    const recent = norm(them.slice(-3).map(m => m.text).join(' '))
    const lastThem = them[them.length - 1]
    const text = norm(lastThem?.text ?? '')
    const out: string[] = []

    const orderId = [...thread.messages].reverse().find(m => m.orderId)?.orderId
    const order = orderId ? store.txById(orderId) : undefined

    if (thread.kind === 'org') {
      const low = lowStock.value.slice(0, 2)
      if (low.length) out.push(`Assalomu alaykum! Bizga ${low.map(p => `${p.name} (${Math.max(p.minStock * 2 - p.stock, 10)} ta)`).join(', ')} kerak. Ertaga yetkazib bera olasizmi?`)
      out.push('Rahmat, qabul qildik! Nakladnoyni ham yuborib yuboring.')
      out.push('To\'lovni bugun o\'tkazma orqali amalga oshiramiz.')
      return out.slice(0, 3)
    }

    for (const p of findProducts(recent).slice(0, 2)) out.push(priceLine(p))

    if (order && /(qachon|qayer|holat|yetib|buyurtma)/.test(text)) {
      const map: Record<string, string> = {
        pending: 'qabul qilindi, tez orada tayyorlaymiz',
        processing: 'tayyorlanmoqda, 1 soat ichida jo\'natamiz',
        shipping: 'yo\'lda, kuryer 30–40 daqiqada yetib boradi',
        delivered: 'yetkazib berilgan',
        cancelled: 'bekor qilingan',
        returned: 'qaytarilgan',
      }
      out.unshift(`Buyurtmangiz ${order.no} ${map[order.status] ?? statusLabel[order.status]}. Jami: ${formatSom(order.total)} so'm.`)
    }
    if (/(yetkaz|manzil|dostavka|olib kel)/.test(text)) out.push('Albatta! Bugun 2–3 soat ichida yetkazib beramiz. To\'lovni Click yoki naqd qilishingiz mumkin.')
    if (/(narx|qancha|necha pul)/.test(text) && !out.length) out.push('Qaysi mahsulot qiziqtiradi? Narxini darhol aytaman.')

    const c = customers.value.find(x => x.id === thread.refId)
    if (c && c.debt > 0 && out.length < 3) out.push(`Eslatma: sizda ${formatSom(c.debt)} so'm qarz bor. Qulay paytda to'lab qo'ysangiz.`)

    if (out.length < 2) out.push('Rahmat! Buyurtmangizni tayyorlayapmiz.')
    if (out.length < 3) out.push('Assalomu alaykum! Qanday yordam bera olaman?')
    return [...new Set(out)].slice(0, 3)
  }

  return { suggestions, findProducts }
}
