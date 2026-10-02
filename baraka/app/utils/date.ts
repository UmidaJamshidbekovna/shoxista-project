const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

const pad = (n: number) => String(n).padStart(2, '0')

/** "14:32" */
export function formatTime(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "Bugun" / "Kecha" / "23 sentabr" */
export function formatDay(iso: string) {
  const d = new Date(iso)
  const t = new Date()
  const diff = Math.round((new Date(t.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000)
  if (diff === 0) return 'Bugun'
  if (diff === 1) return 'Kecha'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "02.10.2026" */
export function formatDate(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** Kun kaliti (guruhlash uchun): "2026-10-02" */
export function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
