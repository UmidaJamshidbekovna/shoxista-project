<script setup lang="ts">
import type { AdjustReason } from '~/composables/useInv'

const route = useRoute()
const NuxtLink = resolveComponent('NuxtLink')
const store = useStore()
const { adjustments, stockPct } = useInv()
const { show } = useToast()
const { haptic } = useTelegram()

const product = computed(() => store.productById(String(route.params.id)))
const cat = computed(() => product.value && store.categoryById(product.value.categoryId))
const wh = computed(() => store.warehouses.value.find(w => w.id === product.value?.warehouseId))
const state = computed(() => product.value ? store.stockState(product.value) : 'ok')
const margin = computed(() => {
  const p = product.value
  if (!p || !p.price) return 0
  return Math.round(((p.price - p.cost) / p.price) * 1000) / 10
})

const editOpen = ref(false)
const adjustOpen = ref(false)
const adjustReason = ref<AdjustReason>('in')
const deleteOpen = ref(false)

function openAdjust(r: AdjustReason) {
  adjustReason.value = r
  adjustOpen.value = true
}

interface Movement { id: string, title: string, sub: string, date: string, delta: number, to?: string, struck?: boolean, icon: 'cart' | 'truck' | 'edit' | 'trash' | 'check' }

const movements = computed<Movement[]>(() => {
  const p = product.value
  if (!p) return []
  const fromTx: Movement[] = store.transactions.value.flatMap(t => t.items
    .filter(i => i.productId === p.id)
    .map(i => ({
      id: `${t.id}-${i.productId}`,
      title: t.kind === 'sale' ? `Sotuv ${t.no}` : `Kirim ${t.no}`,
      sub: t.kind === 'sale'
        ? (store.customerById(t.customerId)?.name ?? store.orgById(t.orgId)?.name ?? 'Mijoz') + ` · ${formatSom(i.price)} so'm`
        : (store.orgById(t.orgId)?.name ?? 'Ta\'minotchi') + ` · ${formatSom(i.price)} so'm`,
      date: t.date,
      delta: t.kind === 'sale' ? -i.qty : i.qty,
      to: `/tarix/${t.id}`,
      struck: !store.countsInTotal(t),
      icon: t.kind === 'sale' ? 'cart' as const : 'truck' as const,
    })))
  const fromAdj: Movement[] = adjustments.value.filter(a => a.productId === p.id).map(a => ({
    id: a.id,
    title: invAdjustReasonLabel[a.reason],
    sub: a.note || `Qoldiq: ${a.after} ${p.unit}`,
    date: a.date,
    delta: a.delta,
    icon: a.reason === 'in' ? 'truck' as const : a.reason === 'writeoff' ? 'trash' as const : 'check' as const,
  }))
  return [...fromTx, ...fromAdj].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
})

const sold30 = computed(() => {
  const p = product.value
  if (!p) return 0
  const from = Date.now() - 30 * 86400000
  return store.transactions.value
    .filter(t => t.kind === 'sale' && store.countsInTotal(t) && new Date(t.date).getTime() >= from)
    .reduce((s, t) => s + t.items.filter(i => i.productId === p.id).reduce((x, i) => x + i.qty, 0), 0)
})

function remove() {
  const p = product.value
  if (!p) return
  store.products.value = store.products.value.filter(x => x.id !== p.id)
  haptic('heavy')
  show('Mahsulot o\'chirildi')
  deleteOpen.value = false
  navigateTo('/ombor', { replace: true })
}
</script>

<template>
  <PageHeader title="Mahsulot kartasi" :subtitle="product?.sku" back="/ombor">
    <RoundButton v-if="product" icon="edit" label="Tahrirlash" @click="editOpen = true" />
  </PageHeader>

  <div v-if="!product" class="grow px-5">
    <EmptyState icon="box" title="Mahsulot topilmadi" text="U o'chirilgan bo'lishi mumkin">
      <PillButton to="/ombor" size="sm" variant="soft" class="mt-2">Omborga qaytish</PillButton>
    </EmptyState>
  </div>

  <template v-else>
    <div class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
      <div class="card flex flex-col items-center gap-2 px-5 pt-6 pb-5 text-center">
        <span
          class="flex size-28 items-center justify-center rounded-[32px] text-[64px]"
          :style="{ background: `${cat?.color ?? '#05472a'}14` }"
        >{{ product.emoji }}</span>
        <h2 class="mt-1 text-[22px] leading-tight font-extrabold">{{ product.name }}</h2>
        <div class="flex flex-wrap items-center justify-center gap-1.5">
          <span class="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold" :style="{ background: `${cat?.color}1a`, color: cat?.color }">
            <span class="size-2 rounded-full" :style="{ background: cat?.color }" />{{ cat?.name ?? 'Kategoriyasiz' }}
          </span>
          <Badge :tone="invStockTone[state]">{{ invStockLabel[state] }}</Badge>
        </div>
        <div class="mt-1 flex items-center gap-2 rounded-full bg-field px-3 py-1.5 text-xs font-bold text-muted-2">
          <AppIcon name="barcode" :size="15" />{{ product.barcode }}
          <span class="text-muted">·</span>SKU {{ product.sku }}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2.5">
        <div class="card p-3">
          <p class="text-[11px] font-bold text-muted">Sotuv narxi</p>
          <p class="mt-0.5 text-[15px] font-extrabold">{{ formatSom(product.price) }}</p>
          <p class="text-[11px] font-semibold text-muted">so'm</p>
        </div>
        <div class="card p-3">
          <p class="text-[11px] font-bold text-muted">Tannarx</p>
          <p class="mt-0.5 text-[15px] font-extrabold">{{ formatSom(product.cost) }}</p>
          <p class="text-[11px] font-semibold text-muted">so'm</p>
        </div>
        <div class="card p-3">
          <p class="text-[11px] font-bold text-muted">Marja</p>
          <p class="mt-0.5 text-[15px] font-extrabold" :class="margin < 0 ? 'text-danger' : 'text-brand'">{{ margin }}%</p>
          <p class="text-[11px] font-semibold text-muted">+{{ formatSom(product.price - product.cost) }}</p>
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[13px] font-bold text-muted">Ombordagi qoldiq</p>
            <p class="text-[30px] leading-tight font-extrabold tracking-tight">
              {{ product.stock }} <span class="text-base font-bold text-muted">{{ product.unit }}</span>
            </p>
          </div>
          <div class="flex gap-2">
            <RoundButton icon="minus" label="Hisobdan chiqarish" variant="field" @click="openAdjust('writeoff')" />
            <RoundButton icon="plus" label="Kirim" variant="brand" @click="openAdjust('in')" />
          </div>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-field">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="state === 'ok' ? 'bg-brand' : state === 'low' ? 'bg-warn' : 'bg-danger'"
            :style="{ width: `${stockPct(product)}%` }"
          />
        </div>
        <div class="mt-2 flex justify-between text-xs font-semibold text-muted">
          <span>Minimal: {{ product.minStock }} {{ product.unit }}</span>
          <span>30 kunda sotildi: {{ sold30 }} {{ product.unit }}</span>
        </div>
        <button type="button" class="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-field text-[13px] font-extrabold text-ink" @click="openAdjust('count')">
          <AppIcon name="check" :size="16" />Inventarizatsiya
        </button>
      </div>

      <div class="card px-4">
        <ListRow icon="warehouse" title="Ombor" :subtitle="wh?.address" :value="wh?.name ?? '—'" :chevron="false" />
        <ListRow icon="tag" title="Kategoriya" :value="cat?.name ?? '—'" to="/ombor/kategoriyalar" />
        <ListRow icon="box" title="O'lchov birligi" :value="product.unit" :chevron="false" />
        <ListRow icon="wallet" title="Qoldiq qiymati" :value="`${formatSom(product.cost * product.stock)} so'm`" :chevron="false" />
      </div>

      <SectionHead title="So'nggi harakatlar" />
      <div v-if="movements.length" class="card px-4">
        <component
          :is="m.to ? NuxtLink : 'div'" v-for="m in movements" :key="m.id" :to="m.to"
          class="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full" :class="m.delta >= 0 ? 'bg-soft text-brand' : 'bg-warn-soft text-warn'">
            <AppIcon :name="m.icon" :size="18" />
          </span>
          <span class="min-w-0 grow">
            <span class="block truncate text-sm font-bold" :class="m.struck && 'text-muted line-through'">{{ m.title }}</span>
            <span class="block truncate text-xs font-medium text-muted">{{ m.sub }}</span>
          </span>
          <span class="shrink-0 text-right">
            <span class="block text-sm font-extrabold" :class="m.struck ? 'text-muted line-through' : m.delta >= 0 ? 'text-brand' : 'text-ink'">
              {{ m.delta > 0 ? '+' : '' }}{{ m.delta }} {{ product.unit }}
            </span>
            <span class="block text-[11px] font-semibold text-muted">{{ formatDay(m.date) }}, {{ formatTime(m.date) }}</span>
          </span>
        </component>
      </div>
      <div v-else class="card"><EmptyState icon="history" title="Harakatlar yo'q" text="Sotuv va kirimlar shu yerda ko'rinadi" /></div>
    </div>

    <div class="pb-safe flex shrink-0 gap-3 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
      <PillButton variant="danger" icon="trash" @click="deleteOpen = true">O'chirish</PillButton>
      <PillButton block icon="edit" class="grow basis-0" @click="editOpen = true">Tahrirlash</PillButton>
    </div>

    <InvProductForm v-model="editOpen" :product="product" />
    <InvAdjustSheet v-model="adjustOpen" :product="product" :reason="adjustReason" />

    <BSheet v-model="deleteOpen" title="Mahsulotni o'chirish">
      <div class="flex flex-col items-center gap-2 py-2 text-center">
        <span class="flex size-16 items-center justify-center rounded-full bg-danger-soft text-[32px]">{{ product.emoji }}</span>
        <p class="text-[15px] font-extrabold">"{{ product.name }}" o'chirilsinmi?</p>
        <p class="text-[13px] font-medium text-muted">Mahsulot katalogdan olib tashlanadi. Tarixdagi cheklar saqlanib qoladi. Bu amalni qaytarib bo'lmaydi.</p>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <PillButton variant="field" class="grow basis-0" @click="deleteOpen = false">Bekor qilish</PillButton>
          <PillButton variant="danger" class="grow basis-0" icon="trash" @click="remove">O'chirish</PillButton>
        </div>
      </template>
    </BSheet>
  </template>
</template>
