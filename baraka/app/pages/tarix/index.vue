<script setup lang="ts">
// Tarix (Stock and History.md §II): sotuvlar va xaridlar, kun guruhlari, filtr va tafsilotlar.
import type { Transaction } from '~/data/types'

definePageMeta({ tab: true })

const route = useRoute()
const router = useRouter()
const { countsInTotal, txById } = useStore()
const { dir, query, hf } = useHistFilters()
const { run, activeCount } = useHistList()
const { selection } = useTelegram()

const filterOpen = ref(false)
const orderOpen = ref(false)
const orderId = ref<string>()

const list = computed(() => run(hf.value))
const total = computed(() => list.value.filter(countsInTotal).reduce((s, t) => s + t.total, 0))
const badge = computed(() => activeCount(hf.value))

// --- Kun guruhlari: "BUGUN, 26-SENTABR", "KECHA", "24-SENTABR" ---
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
function dayHeading(iso: string) {
  const d = new Date(iso)
  const diff = Math.round((new Date(new Date().toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000)
  const date = `${d.getDate()}-${MONTHS[d.getMonth()]}`
  return (diff === 0 ? `Bugun, ${date}` : diff === 1 ? 'Kecha' : date).toUpperCase()
}
const groups = computed(() => {
  const map = new Map<string, { key: string, label: string, total: number, items: Transaction[] }>()
  for (const t of list.value) {
    const k = dayKey(t.date)
    if (!map.has(k)) map.set(k, { key: k, label: dayHeading(t.date), total: 0, items: [] })
    const g = map.get(k)!
    g.items.push(t)
    if (countsInTotal(t)) g.total += t.total
  }
  return [...map.values()]
})

const TABS = [
  { k: 'out' as const, label: 'Sotuvlar', d: 'M7 17 17 7M8 7h9v9' },
  { k: 'in' as const, label: 'Xaridlar', d: 'M17 7 7 17M16 17H7V8' },
]
function setDir(k: 'out' | 'in') {
  if (dir.value === k) return
  selection()
  dir.value = k
}

function openOrder(id: string) {
  orderId.value = id
  orderOpen.value = true
}

// --- Tashqi kirish: /tarix?dir=in, /tarix?order=t3 (Bosh sahifa, /tarix/[id]) ---
function consumeQuery() {
  const { dir: qDir, order, ...rest } = route.query
  if (!qDir && !order) return
  if (qDir === 'in' || qDir === 'out') dir.value = qDir
  const t = order ? txById(String(order)) : undefined
  if (t) {
    dir.value = t.kind === 'sale' ? 'out' : 'in'
    openOrder(t.id)
  }
  router.replace({ query: rest })
}
watch(() => [route.query.dir, route.query.order], consumeQuery, { immediate: true })
</script>

<template>
  <div class="no-scrollbar absolute inset-0 grid auto-rows-min content-start grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto bg-app px-5 pt-4 pb-[124px]">
    <!-- 1. Header + kurs vidjeti -->
    <header class="flex items-center gap-3">
      <div class="min-w-0 grow">
        <h1 class="truncate text-[25px] leading-tight font-extrabold tracking-[-0.02em] text-ink">Tarix</h1>
        <p class="mt-[3px] truncate text-[13px] font-semibold text-muted">{{ list.length }} ta buyurtma · {{ formatSom(total) }}</p>
      </div>
      <HistRateWidget />
    </header>

    <!-- 2. Yo'nalish tablari -->
    <div class="flex rounded-[26px] bg-card p-1" role="tablist">
      <button
        v-for="t in TABS" :key="t.k" type="button" role="tab" :aria-selected="dir === t.k"
        class="flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-[22px] text-[13px] font-bold transition-[background-color] duration-200"
        :class="dir === t.k ? 'bg-brand text-white' : 'bg-transparent text-[#5b616b]'"
        @click="setDir(t.k)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="t.d" />
        </svg>
        {{ t.label }}
      </button>
    </div>

    <!-- 3. Qidiruv + filtr -->
    <div class="flex items-center gap-2.5">
      <label class="flex h-12 min-w-0 grow items-center gap-2.5 rounded-full bg-card px-[18px]">
        <AppIcon name="search" :size="18" class="shrink-0 text-muted" />
        <input
          v-model="query" type="search" inputmode="search" placeholder="Mijoz yoki buyurtma raqami"
          class="min-w-0 grow bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        >
        <button v-if="query" type="button" aria-label="Tozalash" class="flex size-6 shrink-0 items-center justify-center rounded-full bg-field text-muted" @click="query = ''">
          <AppIcon name="x" :size="13" :stroke="2.4" />
        </button>
      </label>
      <button
        type="button" aria-label="Filtr"
        class="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-ink transition-transform active:scale-95"
        @click="filterOpen = true"
      >
        <AppIcon name="filter" :size="19" :stroke="1.9" />
        <span
          v-if="badge"
          class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-app bg-brand px-1 text-[11px] font-extrabold text-white"
        >{{ badge }}</span>
      </button>
    </div>

    <!-- 4–6. Kun guruhlari va buyurtmalar -->
    <p v-if="!groups.length" class="py-10 text-center text-[13px] font-medium text-muted">Filtrga mos buyurtma yo'q</p>
    <div v-else class="flex flex-col gap-[18px]">
      <section v-for="g in groups" :key="g.key" class="flex flex-col gap-2.5">
        <div class="flex items-baseline justify-between gap-3 px-1">
          <h2 class="text-[11.5px] font-extrabold tracking-[.06em] text-muted">{{ g.label }}</h2>
          <span class="text-[12.5px] font-extrabold text-[#6b7280]">{{ formatSom(g.total) }}</span>
        </div>
        <HistOrderRow v-for="t in g.items" :key="t.id" :tx="t" @open="openOrder(t.id)" />
      </section>
    </div>
  </div>

  <HistFilterSheet v-model="filterOpen" />
  <HistOrderSheet v-model="orderOpen" :tx-id="orderId" />
</template>
