// AI yordamchi (AI Robot.md §4): mini oyna va Chat → "Baraka AI yordamchi" bitta tarixni ishlatadi.
// Backend ulanganda aiAnswer o'rniga POST /ai/ask chaqiriladi.

export const AI_DELAY = 1100

export const AI_QUICK = [
  'Bugun nima ko\'p sotildi?',
  'Qaysi mahsulotlar tugayapti?',
  'Savdoni oshirish uchun tavsiya',
]

export function useAiRobot() {
  const { chats, products } = useStore()
  /** Joriy savol va javob (a = null → yuklanmoqda) */
  const aiCur = useState<{ q: string, a: string | null } | null>('ai-cur', () => null)
  const timer = useState<ReturnType<typeof setTimeout> | null>('ai-timer', () => null)

  const thread = computed(() => chats.value.find(c => c.kind === 'ai'))

  /** Demo javoblar — kalit so'z bo'yicha (§4.3) */
  function aiAnswer(text: string): string {
    const q = text.toLowerCase()
    if (/tuga|kam|ombor|qoldi/.test(q)) {
      const out = products.value.filter(p => p.stock <= 0)
      const low = products.value.filter(p => p.stock > 0 && p.stock <= p.minStock)
      const parts: string[] = []
      if (low.length) parts.push(`Minimal qoldiqdan past: ${low.map(p => `${p.name} (${p.stock} ta, min ${p.minStock})`).join(', ')}.`)
      if (out.length) parts.push(`Tugagan: ${out.map(p => p.name).join(', ')}.`)
      if (!parts.length) return 'Hamma mahsulotlar yetarli — minimal qoldiqdan past mahsulot yo\'q.'
      return `${parts.join(' ')} Ta'minotchiga hozir buyurtma berishni tavsiya qilaman — Ombor → Kirim → "Tashkilotdan buyurtma".`
    }
    if (/aksiya|tavsiya|maslahat|oshir/.test(q)) {
      return 'Juma kuni ichimliklarga 10% aksiya qiling — o\'tgan haftalarda juma kunlari ichimliklar savdosi eng yuqori bo\'lgan. Taxminan o\'rtacha chek ~15 000 so\'mga oshadi. Aksiyani Telegram kanalingizda ham e\'lon qiling.'
    }
    if (/mijoz|xabar|chat/.test(q)) {
      const waiting = chats.value.filter(c => c.kind === 'customer' && c.channel === 'instagram' && c.unread > 0)
      const names = waiting.map(c => c.title).join(', ') || 'Madina Yusupova'
      return `Instagram'da ${waiting.length || 1} ta mijoz javob kutmoqda: ${names}. Buyurtma #10251 tasdiqlanishini kutyapti — Chat bo'limidan javob bering.`
    }
    return 'Bugungi savdo: 38 buyurtma, 4 850 000 so\'m (+12% kechagiga nisbatan). Eng ko\'p sotilganlar: Coca-Cola 1.5 L, Guruch Lazer 1 kg, Kungaboqar yog\'i 1 L.'
  }

  function push(from: 'me' | 'ai', text: string) {
    thread.value?.messages.push({ id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`, from, text, time: new Date().toISOString() })
  }

  /** Savol yuborish oqimi (§4.2). onAnswer — chat sahifasi uchun (scroll va h.k.) */
  function askAiQ(text: string, onAnswer?: () => void) {
    const q = text.trim()
    if (!q) return
    if (timer.value) clearTimeout(timer.value)
    aiCur.value = { q, a: null }
    push('me', q)
    timer.value = setTimeout(() => {
      const a = aiAnswer(q)
      aiCur.value = { q, a }
      push('ai', a)
      timer.value = null
      onAnswer?.()
    }, AI_DELAY)
  }

  const loading = computed(() => !!timer.value)

  return { aiCur, thread, loading, aiAnswer, askAiQ }
}
