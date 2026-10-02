<script setup lang="ts">
import { products, stockStatus } from '~/data/products'

definePageMeta({ tab: true })

const { scanQr } = useTelegram()
const query = ref('')
const filter = ref('Hammasi')
const filters = ['Hammasi', 'Kam qolgan', 'Tugagan', 'Oziq-ovqat', 'Maishiy']

const stats = computed(() => ({
  total: 248,
  low: 12,
  out: 3,
}))

// Kam qolgan/tugaganlar ro'yxat tepasida
const order = { out: 1, low: 0, ok: 2 }
const visible = computed(() => products
  .filter((p) => {
    const s = stockStatus(p)
    if (filter.value === 'Kam qolgan') return s === 'low'
    if (filter.value === 'Tugagan') return s === 'out'
    if (filter.value !== 'Hammasi') return p.category === filter.value
    return true
  })
  .filter(p => p.name.toLowerCase().includes(query.value.trim().toLowerCase()))
  .sort((a, b) => order[stockStatus(a)] - order[stockStatus(b)]))

const tone = { ok: 'text-brand', low: 'text-warn', out: 'text-danger' }
const bar = { ok: 'bg-brand', low: 'bg-warn', out: 'bg-danger' }

async function onScan() {
  const code = await scanQr()
  if (code) query.value = code
}
</script>

<template>
  <ScreenHeader title="Ombor" subtitle="Chilonzor filiali">
    <IconButton icon="barcode" label="Shtrix-kod bo'yicha qidirish" @click="onScan" />
  </ScreenHeader>

  <div class="flex shrink-0 gap-2.5 px-5 pb-3">
    <SearchField v-model="query" placeholder="Mahsulotni qidirish" />
  </div>

  <div class="flex shrink-0 gap-2 px-5 pb-3">
    <div class="grow basis-0 rounded-2xl border border-line bg-surface px-3.5 py-3">
      <div class="font-display text-2xl font-bold">{{ stats.total }}</div>
      <div class="text-xs font-semibold">Mahsulot</div>
    </div>
    <button type="button" class="grow basis-0 rounded-2xl border border-warn-soft bg-warn-soft px-3.5 py-3 text-left text-warn" @click="filter = 'Kam qolgan'">
      <div class="font-display text-2xl font-bold">{{ stats.low }}</div>
      <div class="text-xs font-semibold">Kam qolgan</div>
    </button>
    <button type="button" class="grow basis-0 rounded-2xl border border-danger-soft bg-danger-soft px-3.5 py-3 text-left text-danger" @click="filter = 'Tugagan'">
      <div class="font-display text-2xl font-bold">{{ stats.out }}</div>
      <div class="text-xs font-semibold">Tugagan</div>
    </button>
  </div>

  <FilterChips v-model="filter" :options="filters" />

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pt-3 pb-24">
    <div class="rounded-[18px] border border-line bg-surface px-3.5">
      <NuxtLink
        v-for="p in visible" :key="p.id" :to="`/mahsulot?id=${p.id}`"
        class="flex items-center gap-3 border-b border-line py-3 text-ink last:border-b-0"
      >
        <LetterTile :text="p.letter" :bg="p.tile.bg" :fg="p.tile.fg" />
        <div class="flex min-w-0 grow flex-col gap-1">
          <span class="truncate text-[15px] font-semibold">{{ p.name }}</span>
          <div class="text-xs text-muted">{{ p.category }} · {{ formatSom(p.price) }} so'm</div>
          <div class="h-1 overflow-hidden rounded-sm bg-track">
            <div class="h-1" :class="bar[stockStatus(p)]" :style="{ width: `${Math.max(2, Math.min(100, (p.stock / p.max) * 100))}%` }" />
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 text-right">
          <span class="text-base font-bold" :class="tone[stockStatus(p)]">{{ p.stock }} <span class="text-xs font-medium text-muted">{{ p.unit }}</span></span>
          <Tag v-if="stockStatus(p) === 'low'" tone="warn">Kam qoldi</Tag>
          <Tag v-else-if="stockStatus(p) === 'out'" tone="danger">Tugagan</Tag>
        </div>
      </NuxtLink>
      <p v-if="!visible.length" class="py-8 text-center text-sm text-muted">Hech narsa topilmadi</p>
    </div>
  </div>

  <NuxtLink
    to="/mahsulot"
    class="absolute right-5 bottom-4 flex h-[52px] items-center gap-1.5 rounded-[18px] bg-brand px-[18px] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(14,106,78,0.35)]"
  >
    <AppIcon name="plus" />Mahsulot
  </NuxtLink>
</template>
