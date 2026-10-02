// Bosh sahifadagi AI robot: savol-javob (simulyatsiya, javoblar store ma'lumotlaridan hisoblanadi)
import { revenue } from '~/data/sample'
import { statusLabel } from '~/data/labels'

export interface AiMsg { id: number, from: 'me' | 'ai', text: string, links?: { label: string, to: string }[] }

export const AI_SUGGESTIONS = [
  'Bugungi tushum qancha?',
  'Qaysi mahsulot tugayapti?',
  'Kim qarzdor?',
  'Faol buyurtmalar qancha?',
  'Eng ko\'p sotilgan mahsulot?',
  'Ta\'minotchilarga qarzimiz?',
]

export function useHomeAi() {
  const store = useStore()
  const messages = useState<AiMsg[]>('home-ai-messages', () => [{
    id: 0, from: 'ai',
    text: 'Assalomu alaykum, Aziz! Men Baraka AI yordamchisiman. Tushum, qoldiq, qarzlar va buyurtmalar haqida so\'rang.',
  }])
  const typing = useState('home-ai-typing', () => false)

  const som = (n: number) => `${formatSom(n)} so'm`
  const isToday = (iso: string) => dayKey(iso) === dayKey(new Date().toISOString())

  function answer(q: string): Omit<AiMsg, 'id' | 'from'> {
    const s = q.toLowerCase().replace(/[‘’ʻʼ`]/g, '\'')
    const sales = store.transactions.value.filter(t => t.kind === 'sale' && store.countsInTotal(t))

    if (/tushum|savdo|daromad|sotuv|revenue/.test(s) && !/ko'p sotil|top/.test(s)) {
      const today = sales.filter(t => isToday(t.date))
      const sum = today.reduce((a, t) => a + t.total, 0)
      const paid = today.reduce((a, t) => a + t.paid, 0)
      const r = revenue.day
      return {
        text: `Bugungi umumiy tushum: ${som(r.total)} (${r.change >= 0 ? '+' : ''}${r.change}% kechagiga nisbatan).\n`
          + `Ilovada bugun ${today.length} ta sotuv qayd etilgan — jami ${som(sum)}, shundan ${som(paid)} to'langan.\n`
          + `Haftalik: ${som(revenue.week.total)}, oylik: ${som(revenue.month.total)}.`,
        links: [{ label: 'Hisobotni ochish', to: '/ombor/hisobot' }],
      }
    }
    if (/tuga|kam qol|qoldiq|ombor|zaxira/.test(s)) {
      const low = store.lowStock.value
      if (!low.length) return { text: 'Hozircha barcha mahsulotlar yetarli. Kam qolgan mahsulot yo\'q ✅' }
      const lines = low.map(p => `• ${p.emoji} ${p.name} — ${p.stock <= 0 ? 'tugagan' : `${p.stock} ${p.unit} qoldi`} (min. ${p.minStock})`)
      return {
        text: `${low.length} ta mahsulot kam qoldi:\n${lines.join('\n')}\n\nTa'minotchidan kirim qilishni tavsiya qilaman.`,
        links: [{ label: 'Kirim qilish', to: '/ombor/kirim' }, { label: 'Omborga o\'tish', to: '/ombor' }],
      }
    }
    if (/ta'minot|bizning qarz|qarzimiz|yetkazib beruvchi/.test(s)) {
      const orgs = store.organizations.value.filter(o => o.balance > 0).sort((a, b) => b.balance - a.balance)
      if (!orgs.length) return { text: 'Ta\'minotchilarga qarzingiz yo\'q 👍' }
      return {
        text: `Ta'minotchilarga jami qarzimiz: ${som(store.payable.value)}.\n${orgs.map(o => `• ${o.name} — ${som(o.balance)}`).join('\n')}`,
        links: [{ label: 'Tashkilotlar', to: '/mijozlar?tab=org' }],
      }
    }
    if (/qarz/.test(s)) {
      const cs = store.customers.value.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt)
      const os = store.organizations.value.filter(o => o.balance < 0)
      const lines = [
        ...cs.map(c => `• ${c.name} — ${som(c.debt)}`),
        ...os.map(o => `• ${o.name} — ${som(-o.balance)}`),
      ]
      if (!lines.length) return { text: 'Hech kim qarzdor emas 🎉' }
      return {
        text: `Mijozlar qarzi jami: ${som(store.receivable.value)}.\nQarzdorlar (${lines.length}):\n${lines.join('\n')}\n\nEng katta qarz: ${cs[0]?.name ?? os[0]?.name}.`,
        links: [{ label: 'Mijozlar', to: '/mijozlar' }],
      }
    }
    if (/buyurtma|online|zakaz/.test(s)) {
      const os = store.activeOnlineOrders.value
      if (!os.length) return { text: 'Hozir faol online buyurtma yo\'q.' }
      const lines = os.map((t) => {
        const who = store.customerById(t.customerId)?.name ?? store.orgById(t.orgId)?.name ?? 'Mijoz'
        return `• ${t.no} · ${who} — ${som(t.total)} (${statusLabel[t.status]})`
      })
      return {
        text: `${os.length} ta faol online buyurtma bor:\n${lines.join('\n')}`,
        links: [{ label: 'Tarixga o\'tish', to: '/tarix' }],
      }
    }
    if (/ko'p sotil|top|eng yaxshi|mashhur/.test(s)) {
      const m = new Map<string, { name: string, qty: number, sum: number }>()
      for (const t of sales) for (const i of t.items) {
        const r = m.get(i.productId) ?? { name: i.name, qty: 0, sum: 0 }
        r.qty += i.qty
        r.sum += i.qty * i.price
        m.set(i.productId, r)
      }
      const top = [...m.values()].sort((a, b) => b.sum - a.sum).slice(0, 3)
      return {
        text: `Eng ko'p sotilgan mahsulotlar (summa bo'yicha):\n${top.map((p, k) => `${k + 1}. ${p.name} — ${p.qty} ta, ${som(p.sum)}`).join('\n')}`,
      }
    }
    if (/salom|assalom|hello|hi\b/.test(s)) return { text: 'Va alaykum assalom! Qanday yordam bera olaman?' }
    return {
      text: 'Kechirasiz, bu savolni hali tushunmadim 🙏\nMen quyidagilar haqida javob bera olaman: tushum, tugayotgan mahsulotlar, qarzdorlar, online buyurtmalar, eng ko\'p sotilgan mahsulotlar va ta\'minotchilarga qarz.',
    }
  }

  function ask(q: string) {
    const text = q.trim()
    if (!text || typing.value) return
    messages.value = [...messages.value, { id: Date.now(), from: 'me', text }]
    typing.value = true
    setTimeout(() => {
      messages.value = [...messages.value, { id: Date.now() + 1, from: 'ai', ...answer(text) }]
      typing.value = false
    }, 900 + Math.random() * 700)
  }

  function reset() {
    messages.value = messages.value.slice(0, 1)
  }

  return { messages, typing, ask, reset }
}
