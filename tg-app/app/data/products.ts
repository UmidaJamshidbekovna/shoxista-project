// Demo ma'lumotlar (keyinchalik API bilan almashtiriladi)
export interface Product {
  id: number
  name: string
  letter: string
  category: string
  price: number
  stock: number
  unit: string
  /** To'liq ombor hajmi — progress bar uchun */
  max: number
  tile: { bg: string, fg: string }
}

export const CATEGORIES = ['Oziq-ovqat', 'Ichimliklar', 'Sut mahsulotlari', 'Maishiy'] as const

export const LOW_STOCK = 5

export const products: Product[] = [
  { id: 1, name: 'Guruch lazer 1 kg', letter: 'G', category: 'Oziq-ovqat', price: 18000, stock: 64, unit: 'kg', max: 64, tile: { bg: '#F1E6D2', fg: '#7A4E12' } },
  { id: 2, name: 'Sut 2.5% 1 L', letter: 'S', category: 'Sut mahsulotlari', price: 12500, stock: 3, unit: 'dona', max: 60, tile: { bg: '#E4ECF7', fg: '#274C85' } },
  { id: 3, name: 'Paxta yog\'i 1 L', letter: 'Y', category: 'Oziq-ovqat', price: 24000, stock: 31, unit: 'dona', max: 40, tile: { bg: '#F5EBC8', fg: '#6B5310' } },
  { id: 4, name: 'Ko\'k choy 100 g', letter: 'C', category: 'Ichimliklar', price: 9000, stock: 48, unit: 'dona', max: 48, tile: { bg: '#DDEEE5', fg: '#1D5A3F' } },
  { id: 5, name: 'Tuxum, 10 dona', letter: 'T', category: 'Oziq-ovqat', price: 16000, stock: 0, unit: 'dona', max: 50, tile: { bg: '#F4E1DC', fg: '#8A2E1E' } },
  { id: 6, name: 'Makaron 400 g', letter: 'M', category: 'Oziq-ovqat', price: 7500, stock: 72, unit: 'dona', max: 80, tile: { bg: '#ECE3F3', fg: '#5A3480' } },
  { id: 7, name: 'Non, patir', letter: 'N', category: 'Oziq-ovqat', price: 6000, stock: 5, unit: 'dona', max: 30, tile: { bg: '#F5EBC8', fg: '#6B5310' } },
  { id: 8, name: 'Kir yuvish kukuni 3 kg', letter: 'K', category: 'Maishiy', price: 54000, stock: 22, unit: 'dona', max: 22, tile: { bg: '#ECE3F3', fg: '#5A3480' } },
]

export function stockStatus(p: Product): 'ok' | 'low' | 'out' {
  if (p.stock <= 0) return 'out'
  if (p.stock <= LOW_STOCK) return 'low'
  return 'ok'
}
