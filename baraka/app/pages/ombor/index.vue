<script setup lang="ts">
// Ombor (Stock and History.md §I.1–§7)
import type { StockFilter } from '~/utils/stock'

definePageMeta({ tab: true })

const store = useStore()
const { selection } = useTelegram()

// §III state: sahifadan chiqib qaytganda saqlanadi
const stockQuery = useState('stock-query', () => '')
const stockFilter = useState<StockFilter>('stock-filter', () => 'all')
const cat = useState('stock-cat', () => 'Barchasi')
const addOpen = ref(false)

const products = store.products
/** Ombor qiymati = Σ (qoldiq × sotuv narxi) */
const stockValue = computed(() => products.value.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0))
const counts = computed(() => ({
  all: products.value.length,
  low: products.value.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
  out: products.value.filter(p => p.stock <= 0).length,
}))

const cats = computed(() => ['Barchasi', ...[...store.categories.value].sort((a, b) => a.order - b.order).map(c => c.name)])
const catName = (id: string) => store.categoryById(id)?.name

const list = computed(() => {
  const q = stockQuery.value.trim().toLowerCase()
  return products.value
    .filter(p => stockFilter.value === 'all' || (stockFilter.value === 'low' ? p.stock > 0 && p.stock <= p.minStock : p.stock <= 0))
    .filter(p => cat.value === 'Barchasi' || catName(p.categoryId) === cat.value)
    .filter(p => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q))
})

// Kategoriya o'chirilgan bo'lsa — Barchasi
watch(cats, (c) => { if (!c.includes(cat.value)) cat.value = 'Barchasi' }, { immediate: true })

function pickFilter(k: StockFilter) {
  stockFilter.value = k
  selection()
}
function pickCat(c: string) {
  cat.value = c
  selection()
}
</script>

<template>
  <div class="no-scrollbar grid min-h-0 grow auto-rows-min content-start grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto px-5 pt-4 pb-[124px]">
    <!-- 1. Header -->
    <header class="flex items-center gap-3">
      <div class="min-w-0 grow">
        <h1 class="truncate text-[25px] leading-tight font-extrabold tracking-[-0.02em] text-ink">Ombor</h1>
        <p class="mt-[3px] truncate text-[13px] text-muted">{{ counts.all }} ta mahsulot · {{ formatSom(stockValue) }}</p>
      </div>
      <button
        type="button" aria-label="Mahsulot qo'shish"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform active:scale-95"
        @click="addOpen = true; selection()"
      >
        <AppIcon name="plus" :size="22" :stroke="2.2" />
      </button>
    </header>

    <!-- 2. Qidiruv -->
    <label class="flex h-[50px] items-center gap-2.5 rounded-[25px] bg-card px-[18px]">
      <AppIcon name="search" :size="18" class="shrink-0 text-muted" />
      <input
        v-model="stockQuery" type="search" inputmode="search" placeholder="Nomi yoki SKU bo'yicha qidirish"
        class="min-w-0 grow bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      >
      <button v-if="stockQuery" type="button" aria-label="Tozalash" class="shrink-0 text-muted" @click="stockQuery = ''">
        <AppIcon name="x" :size="16" />
      </button>
    </label>

    <!-- 3. Tezkor filtrlar -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="f in STOCK_FILTERS" :key="f.key" type="button"
        class="flex flex-col items-start gap-1 rounded-[18px] p-3 text-left transition-[background-color] duration-200"
        :class="stockFilter === f.key ? 'bg-brand text-white' : 'bg-card text-ink'"
        @click="pickFilter(f.key)"
      >
        <span class="text-[20px] leading-tight font-extrabold">{{ counts[f.key] }}</span>
        <span class="flex items-center gap-1.5 text-[11.5px] font-bold whitespace-nowrap">
          <span class="size-[7px] shrink-0 rounded-full" :style="{ background: f.dot }" />{{ f.label }}
        </span>
      </button>
    </div>

    <!-- 4. Kategoriya chiplari -->
    <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      <button
        v-for="c in cats" :key="c" type="button"
        class="shrink-0 rounded-[20px] border px-[15px] py-[9px] text-[13px] font-bold whitespace-nowrap transition-colors"
        :class="cat === c ? 'border-brand bg-brand text-white' : 'border-[#e4e7eb] bg-card text-ink'"
        @click="pickCat(c)"
      >
        {{ c }}
      </button>
    </div>

    <!-- 5. Mahsulot ro'yxati -->
    <div v-if="list.length" class="flex flex-col gap-2.5">
      <StockProductCard v-for="p in list" :key="p.id" :product="p" />
    </div>
    <p v-else class="py-10 text-center text-[13px] text-muted">Mos mahsulot topilmadi</p>
  </div>

  <StockAddSheet v-model="addOpen" />
</template>
