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

  /** AI yordamchi javobi */
  function aiReply(q: string): string {
    const t = norm(q)
    const today = dayKey(new Date().toISOString())
    const sales = transactions.value.filter(x => x.kind === 'sale' && countsInTotal(x))

    if (/(sotuv|savdo|tushum|daromad|bugun)/.test(t)) {
      const td = sales.filter(x => dayKey(x.date) === today)
      const sum = td.reduce((s, x) => s + x.total, 0)
      const paid = td.reduce((s, x) => s + x.paid, 0)
      return `Bugun ${td.length} ta sotuv, jami ${formatSom(sum)} so'm. Shundan ${formatSom(paid)} so'm to'langan, ${formatSom(sum - paid)} so'm nasiya.`
    }
    if (/(qarz|nasiya|qarzdor)/.test(t)) {
      const top = customers.value.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 3)
      return `Mijozlar sizga jami ${formatSom(store.receivable.value)} so'm qarz. Eng ko'p: ${top.map(c => `${c.name} — ${formatSom(c.debt)}`).join('; ')}. Siz ta'minotchilarga ${formatSom(store.payable.value)} so'm qarzsiz.`
    }
    if (/(kam|tuga|qoldiq|ombor|zaxira)/.test(t)) {
      if (!lowStock.value.length) return 'Hamma mahsulotlar yetarli, kam qolgani yo\'q.'
      return `Kam qolgan mahsulotlar: ${lowStock.value.map(p => `${p.name} — ${p.stock} ${p.unit}`).join(', ')}. Ta'minotchiga buyurtma tayyorlab beraymi?`
    }
    if (/(buyurtma|online|zakaz)/.test(t)) {
      const a = activeOnlineOrders.value
      if (!a.length) return 'Hozir faol online buyurtma yo\'q.'
      return `${a.length} ta faol online buyurtma: ${a.map(o => `${o.no} (${statusLabel[o.status]})`).join(', ')}.`
    }
    if (/(top|eng ko'p|ommabop|yaxshi sotil)/.test(t)) {
      const qty: Record<string, number> = {}
      for (const s of sales) for (const i of s.items) qty[i.name] = (qty[i.name] ?? 0) + i.qty
      const top = Object.entries(qty).sort((a, b) => b[1] - a[1]).slice(0, 3)
      return `Eng ko'p sotilganlar: ${top.map(([n, q], i) => `${i + 1}. ${n} — ${q} ta`).join('; ')}.`
    }
    if (/^(ha|xo'p|mayli|tayyorla|ok)/.test(t)) {
      const low = lowStock.value
      return `Buyurtma qoralamasi tayyor: ${low.map(p => `${p.name} × ${Math.max(p.minStock * 2 - p.stock, 10)}`).join(', ')}. Ombor → Kirim bo'limida tasdiqlang.`
    }
    const ps = findProducts(t)
    if (ps.length) return ps.map(p => `${p.name}: narxi ${formatSom(p.price)} so'm, tannarx ${formatSom(p.cost)}, qoldiq ${p.stock} ${p.unit}.`).join(' ')
    return 'Men savdo, qarzlar, ombor qoldig\'i, online buyurtmalar va mahsulot narxlari bo\'yicha yordam bera olaman. Masalan: "Bugungi savdo qancha?"'
  }

  const aiPrompts = ['Bugungi savdo qancha?', 'Kim qarzdor?', 'Kam qolgan mahsulotlar', 'Faol buyurtmalar', 'Eng ko\'p sotilganlar']

  return { suggestions, aiReply, aiPrompts, findProducts }
}
