<script setup lang="ts">
definePageMeta({ tab: true })

const { transactions, countsInTotal, unreadChats } = useStore()
const { kind, query, activeCount, matches, reset } = useHistFilters()
const party = useTxParty()
const { selection } = useTelegram()
const filterOpen = ref(false)

const kindOpts = [{ value: 'sale', label: 'Sotuvlar' }, { value: 'purchase', label: 'Xaridlar' }]

const list = computed(() => {
  const q = query.value.trim().toLowerCase()
  return transactions.value
    .filter(t => t.kind === kind.value && matches(t))
    .filter(t => !q || t.no.toLowerCase().includes(q) || party(t).toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date))
})

const groups = computed(() => {
  const map = new Map<string, { key: string, label: string, total: number, items: typeof list.value }>()
  for (const t of list.value) {
    const k = dayKey(t.date)
    if (!map.has(k)) map.set(k, { key: k, label: formatDay(t.date), total: 0, items: [] })
    const g = map.get(k)!
    g.items.push(t)
    if (countsInTotal(t)) g.total += t.total
  }
  return [...map.values()]
})

const grandTotal = computed(() => list.value.filter(countsInTotal).reduce((s, t) => s + t.total, 0))
const counted = computed(() => list.value.filter(countsInTotal).length)

function resetAll() {
  reset()
  query.value = ''
  selection()
}
</script>

<template>
  <PageHeader title="Tarix" subtitle="Sotuvlar va xaridlar">
    <RoundButton icon="chat" label="Chat" to="/chat" :badge="unreadChats || undefined" />
    <RoundButton icon="filter" label="Filtr" :badge="activeCount || undefined" :variant="activeCount ? 'brand' : 'white'" @click="filterOpen = true" />
  </PageHeader>

  <div class="flex shrink-0 flex-col gap-3 px-5 pb-3">
    <Segmented v-model="kind" :options="kindOpts" />
    <BInput v-model="query" icon="search" inputmode="search" placeholder="Raqam, mijoz yoki tashkilot">
      <template #end>
        <button v-if="query" type="button" aria-label="Tozalash" class="flex size-6 items-center justify-center rounded-full bg-muted/25 text-muted-2" @click="query = ''">
          <AppIcon name="x" :size="14" />
        </button>
      </template>
    </BInput>
    <div v-if="activeCount" class="flex items-center justify-between gap-2 rounded-2xl bg-soft px-3.5 py-2">
      <span class="flex items-center gap-2 text-[13px] font-bold text-brand">
        <AppIcon name="filter" :size="15" />{{ activeCount }} ta filtr faol
      </span>
      <button type="button" class="text-[13px] font-extrabold text-brand underline-offset-2 hover:underline" @click="reset(); selection()">Tozalash</button>
    </div>
  </div>

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-28">
    <div class="mb-4 flex items-center justify-between rounded-[20px] bg-brand px-4 py-3.5 text-white shadow-float">
      <div>
        <p class="text-xs font-semibold text-white/70">{{ kind === 'sale' ? 'Jami sotuv' : 'Jami xarid' }}</p>
        <p class="text-[22px] leading-tight font-extrabold">{{ formatSom(grandTotal) }} <span class="text-sm font-bold text-white/70">so'm</span></p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold text-white/70">Tranzaksiyalar</p>
        <p class="text-[22px] leading-tight font-extrabold">{{ counted }}<span v-if="list.length !== counted" class="text-sm font-bold text-white/60"> / {{ list.length }}</span></p>
      </div>
    </div>

    <EmptyState v-if="!groups.length" icon="history" title="Hech narsa topilmadi" text="Qidiruv yoki filtrlarni o'zgartirib ko'ring">
      <PillButton v-if="activeCount || query" size="sm" variant="soft" class="mt-2" @click="resetAll">Filtrlarni tozalash</PillButton>
    </EmptyState>

    <section v-for="g in groups" :key="g.key" class="mb-4">
      <div class="mb-2 flex items-baseline justify-between px-1">
        <h2 class="text-base font-extrabold">{{ g.label }}</h2>
        <span class="text-[13px] font-bold text-muted-2">{{ formatSom(g.total) }} so'm</span>
      </div>
      <div class="card divide-y divide-line overflow-hidden">
        <HistTxRow v-for="t in g.items" :key="t.id" :tx="t" />
      </div>
    </section>
  </div>

  <HistFilterSheet v-model="filterOpen" />
</template>
