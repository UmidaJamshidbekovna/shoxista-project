// Summalarni Do'kon sozlamalaridagi valyutada ko'rsatish (Profile.md §8: `currency`).
// UZS: "86 500" / "86 500 so'm"; USD: kurs bo'yicha "$6.84".
export function useMoney() {
  const { settings } = useStore()
  const usd = computed(() => settings.value.currency === 'USD')

  /** Faqat raqam (so'mda birliksiz, dollarda "$" bilan) — ixcham kartalar uchun */
  function amount(n: number) {
    if (!usd.value) return formatSom(n)
    const v = n / (settings.value.usdRate || 1)
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ')
    return `${v < 0 ? '−' : ''}$${s}`
  }
  /** To'liq: "86 500 so'm" yoki "$6.84" */
  function money(n: number) {
    return usd.value ? amount(n) : `${formatSom(n)} so'm`
  }

  return { usd, amount, money }
}
