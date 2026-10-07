// Ombor (Stock and History.md §I) uchun umumiy yordamchilar
import type { Product, ProductUnit } from '~/data/types'

export type StockState = 'ok' | 'low' | 'out'
export type StockFilter = 'all' | 'low' | 'out'

/** §6 "Qoldiq holati" jadvali */
export const STOCK_TONE: Record<StockState, { label: string, color: string, bg: string }> = {
  ok: { label: 'Mavjud', color: '#15803d', bg: '#e7f7ec' },
  low: { label: 'Kam qoldi', color: '#b45309', bg: '#fff4e0' },
  out: { label: 'Tugagan', color: '#d93036', bg: '#fdecec' },
}

/** §4 tezkor filtrlar */
export const STOCK_FILTERS: { key: StockFilter, label: string, dot: string }[] = [
  { key: 'all', label: 'Barchasi', dot: '#8b9099' },
  { key: 'low', label: 'Kam qoldi', dot: '#f59e0b' },
  { key: 'out', label: 'Tugagan', dot: '#e5484d' },
]

/** §9 o'lchov birliklari */
export const PRODUCT_UNITS: ProductUnit[] = ['dona', 'kg', 'litr', 'quti', 'blok', 'paket', 'metr']

/** Yangi mahsulotlar uchun rasm foni (tint) palitrasi */
export const PRODUCT_TINTS = ['#f3ecdf', '#e6effb', '#fbf1d6', '#e3f1e4', '#f6eadf', '#fbe3e1', '#efe4f7', '#e2eef6']

/** Kategoriya bo'yicha standart tavsif (§9: Tavsif bo'sh bo'lsa avtomatik to'ldiriladi) */
const CATEGORY_DESC: Record<string, string> = {
  'Oziq-ovqat': 'Kundalik oziq-ovqat mahsuloti. Quruq va salqin joyda saqlang, yaroqlilik muddatini qadoqdan tekshiring.',
  'Ichimliklar': 'Alkogolsiz ichimlik. Sovutib iste\'mol qilish tavsiya etiladi, ochilgandan keyin 2 kun ichida iching.',
  'Sut mahsulotlari': 'Yangi sut mahsuloti. Sovutgichda +2…+6 °C da saqlang, ochilgandan keyin 48 soat ichida iste\'mol qiling.',
  'Shirinliklar': 'Shirinlik mahsuloti — choy bilan yoki sovg\'a uchun. Quruq joyda, +18 °C dan past haroratda saqlang.',
  'Maishiy kimyo': 'Maishiy kimyo vositasi. Bolalar qo\'li yetmaydigan joyda saqlang, qo\'llash yo\'riqnomasiga amal qiling.',
  'Non': 'Yangi yopilgan non mahsuloti. Quruq joyda saqlang, 2 kun ichida iste\'mol qilish tavsiya etiladi.',
}
export function categoryDefaultDesc(name?: string) {
  if (!name) return ''
  return CATEGORY_DESC[name] ?? `${name} toifasidagi mahsulot. Saqlash shartlari va yaroqlilik muddatini qadoqdan tekshiring.`
}

/** "Coca-Cola 1.5 L" -> "CC", "Ko'k choy" -> "KC" */
export function productInitials(name: string) {
  const words = name.split(/[\s\-–"«»()]+/).filter(w => /^\p{L}/u.test(w))
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '')).toUpperCase() || '?'
}

/** Mahsulot rasmlari: yangi `images` yoki eski `image` maydoni */
export function productImages(p: Product) {
  return p.images?.length ? p.images : p.image ? [p.image] : []
}

/** Son parse: "12 500" yoki "12,5" -> son; bo'sh bo'lsa NaN */
export function stockParseNum(v: string | number | undefined | null) {
  const s = String(v ?? '').replace(/\s/g, '').replace(',', '.')
  return s === '' ? Number.NaN : Number(s)
}
