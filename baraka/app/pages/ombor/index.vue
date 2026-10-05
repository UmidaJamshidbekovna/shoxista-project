<script setup lang="ts">
definePageMeta({ tab: true })

const store = useStore()
const { selection } = useTelegram()

const q = ref('')
const cat = ref('all')
const status = ref<'all' | 'low' | 'out' | 'ok'>('all')
const sort = ref<'name' | 'stock' | 'price' | 'value'>('name')
const sortOpen = ref(false)
const createOpen = ref(false)

const products = store.products
const totals = computed(() => ({
  count: products.value.length,
  low: products.value.filter(p => store.stockState(p) === 'low').length,
  out: products.value.filter(p => store.stockState(p) === 'out').length,
  value: products.value.reduce((s, p) => s + p.cost * Math.max(0, p.stock), 0),
  retail: products.value.reduce((s, p) => s + p.price * Math.max(0, p.stock), 0),
}))

const catOptions = computed(() => [
  { value: 'all', label: 'Hammasi' },
  ...[...store.categories.value].sort((a, b) => a.order - b.order).map(c => ({ value: c.id, label: c.name })),
])
const statusOptions = [
  { value: 'all', label: 'Hammasi' },
  { value: 'low', label: 'Kam qolgan' },
  { value: 'out', label: 'Tugagan' },
  { value: 'ok', label: 'Yetarli' },
]
const SORTS = [
  { value: 'name', label: 'Nomi bo\'yicha (A–Z)', icon: 'sort' },
  { value: 'stock', label: 'Qoldiq: kamdan ko\'pga', icon: 'arrow-up' },
  { value: 'price', label: 'Narx: qimmatdan arzonga', icon: 'arrow-down' },
  { value: 'value', label: 'Ombor qiymati bo\'yicha', icon: 'wallet' },
] as const

const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  const arr = products.value.filter(p =>
    (cat.value === 'all' || p.categoryId === cat.value)
    && (status.value === 'all' || store.stockState(p) === status.value)
    && (!s || p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.sku.toLowerCase().includes(s)))
  const by = {
    name: (a: typeof arr[0], b: typeof arr[0]) => a.name.localeCompare(b.name),
    stock: (a: typeof arr[0], b: typeof arr[0]) => a.stock - b.stock,
    price: (a: typeof arr[0], b: typeof arr[0]) => b.price - a.price,
    value: (a: typeof arr[0], b: typeof arr[0]) => b.cost * b.stock - a.cost * a.stock,
  }[sort.value]
  return [...arr].sort(by)
})

const filtersActive = computed(() => cat.value !== 'all' || status.value !== 'all' || !!q.value)
function resetFilters() {
  q.value = ''
  cat.value = 'all'
  status.value = 'all'
}
function pickStatus(s: typeof status.value) {
  status.value = status.value === s ? 'all' : s
  selection()
}

const links = [
  { to: '/ombor/kategoriyalar', label: 'Kategoriyalar', icon: 'tag', tone: 'bg-soft text-brand' },
  { to: '/ombor/kirim', label: 'Kirim', icon: 'truck', tone: 'bg-info-soft text-info' },
  { to: '/ombor/hisobot', label: 'Hisobot', icon: 'chart', tone: 'bg-warn-soft text-warn' },
] as const
</script>

<template>
  <PageHeader title="Ombor" :subtitle="`${totals.count} ta mahsulot · ${store.warehouses.value[0]?.name}`">
    <RoundButton icon="plus" label="Yangi mahsulot" variant="brand" @click="createOpen = true" />
  </PageHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-28">
    <div class="relative overflow-hidden rounded-[24px] bg-brand p-5 text-white shadow-float">
      <div class="absolute -top-10 -right-8 size-36 rounded-full bg-white/8" />
      <p class="text-[13px] font-bold text-white/70">Ombor qiymati (tannarxda)</p>
      <p class="mt-1 text-[30px] leading-tight font-extrabold tracking-tight">{{ formatSom(totals.value) }} <span class="text-base font-bold text-white/70">so'm</span></p>
      <p class="mt-1 text-xs font-semibold text-white/70">Sotuv narxida: {{ formatSom(totals.retail) }} so'm</p>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <button type="button" class="card flex flex-col items-start gap-1 p-3 text-left" :class="status === 'all' && 'ring-2 ring-brand/30'" @click="pickStatus('all')">
        <span class="flex size-8 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="box" :size="16" /></span>
        <span class="text-[22px] leading-none font-extrabold">{{ totals.count }}</span>
        <span class="text-[11px] font-bold text-muted">Jami mahsulot</span>
      </button>
      <button type="button" class="card flex flex-col items-start gap-1 p-3 text-left" :class="status === 'low' && 'ring-2 ring-warn/40'" @click="pickStatus('low')">
        <span class="flex size-8 items-center justify-center rounded-full bg-warn-soft text-warn"><AppIcon name="alert" :size="16" /></span>
        <span class="text-[22px] leading-none font-extrabold">{{ totals.low }}</span>
        <span class="text-[11px] font-bold text-muted">Kam qolgan</span>
      </button>
      <button type="button" class="card flex flex-col items-start gap-1 p-3 text-left" :class="status === 'out' && 'ring-2 ring-danger/40'" @click="pickStatus('out')">
        <span class="flex size-8 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="x" :size="16" /></span>
        <span class="text-[22px] leading-none font-extrabold">{{ totals.out }}</span>
        <span class="text-[11px] font-bold text-muted">Tugagan</span>
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="card flex flex-col items-center gap-1.5 py-3 transition active:scale-[0.98]" @click="selection()">
        <span class="flex size-10 items-center justify-center rounded-full" :class="l.tone"><AppIcon :name="l.icon" :size="19" /></span>
        <span class="text-xs font-extrabold text-ink">{{ l.label }}</span>
      </NuxtLink>
    </div>

    <div class="flex items-center gap-2">
      <div class="grow">
        <BInput v-model="q" icon="search" placeholder="Nomi, shtrix-kod yoki SKU" inputmode="search">
          <template #end>
            <button v-if="q" type="button" aria-label="Tozalash" class="shrink-0 text-muted" @click="q = ''"><AppIcon name="x" :size="18" /></button>
          </template>
        </BInput>
      </div>
      <RoundButton icon="sort" label="Saralash" :size="50" @click="sortOpen = true" />
    </div>

    <Chips v-model="cat" :options="catOptions" />
    <Chips v-model="status" :options="statusOptions" />

    <div class="flex items-center justify-between">
      <SectionHead :title="`Mahsulotlar (${list.length})`" />
      <button v-if="filtersActive" type="button" class="text-[13px] font-bold text-brand" @click="resetFilters">Filtrni tozalash</button>
    </div>

    <TransitionGroup tag="div" class="flex flex-col gap-2.5" move-class="transition-transform duration-300">
      <InvProductRow v-for="p in list" :key="p.id" :product="p" />
    </TransitionGroup>
    <EmptyState v-if="!list.length" icon="box" title="Mahsulot topilmadi" text="Qidiruv yoki filtrlarni o'zgartirib ko'ring">
      <PillButton size="sm" variant="soft" icon="plus" class="mt-2" @click="createOpen = true">Yangi mahsulot</PillButton>
    </EmptyState>
  </div>

  <BSheet v-model="sortOpen" title="Saralash">
    <div class="card px-4">
      <ListRow
        v-for="s in SORTS" :key="s.value" :icon="s.icon" :title="s.label" :chevron="false"
        @click="sort = s.value; sortOpen = false; selection()"
      >
        <template #end>
          <AppIcon v-if="sort === s.value" name="check" class="text-brand" />
        </template>
      </ListRow>
    </div>
  </BSheet>

  <InvProductForm v-model="createOpen" @saved="p => navigateTo(`/ombor/${p.id}`)" />
</template>
