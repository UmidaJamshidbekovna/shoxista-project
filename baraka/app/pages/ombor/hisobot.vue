<script setup lang="ts">
import type { Channel, PayMethod, Transaction } from '~/data/types'
import { channelIcon, channelLabel, methodLabel } from '~/data/labels'

const store = useStore()
const { show } = useToast()
const { haptic } = useTelegram()

const PERIODS = [
  { value: 'day', label: 'Kun' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Oy' },
  { value: 'custom', label: 'Custom' },
]
const period = ref<'day' | 'week' | 'month' | 'custom'>('week')
const iso = (d: Date) => dayKey(d.toISOString())
const today = new Date()
const customFrom = ref(iso(new Date(today.getTime() - 6 * 86400000)))
const customTo = ref(iso(today))

// Bosh sahifadagi savdo kartasidan kelgan davr (?period=...&from&to)
const q = useRoute().query
if (typeof q.period === 'string' && PERIODS.some(p => p.value === q.period)) period.value = q.period as typeof period.value
if (typeof q.from === 'string') customFrom.value = q.from
if (typeof q.to === 'string') customTo.value = q.to

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const range = computed(() => {
  const end = new Date(startOfDay(new Date()).getTime() + 86400000)
  if (period.value === 'day') return { from: startOfDay(new Date()), to: end }
  if (period.value === 'week') return { from: new Date(end.getTime() - 7 * 86400000), to: end }
  if (period.value === 'month') return { from: new Date(end.getTime() - 30 * 86400000), to: end }
  const f = new Date(`${customFrom.value}T00:00:00`)
  const t = new Date(`${customTo.value}T00:00:00`)
  return { from: f, to: new Date(t.getTime() + 86400000) }
})
const customError = computed(() => period.value === 'custom' && range.value.from >= range.value.to ? 'Boshlanish sanasi tugashdan oldin bo\'lsin' : '')
const rangeLabel = computed(() => {
  const { from, to } = range.value
  const last = new Date(to.getTime() - 86400000)
  return dayKey(from.toISOString()) === dayKey(last.toISOString()) ? formatDate(from.toISOString()) : `${formatDate(from.toISOString())} — ${formatDate(last.toISOString())}`
})

const inRange = (t: Transaction, from: Date, to: Date) => {
  const d = new Date(t.date)
  return d >= from && d < to
}
const salesIn = (from: Date, to: Date) => store.transactions.value.filter(t => t.kind === 'sale' && store.countsInTotal(t) && inRange(t, from, to))
const sales = computed(() => customError.value ? [] : salesIn(range.value.from, range.value.to))
const prevSales = computed(() => {
  const len = range.value.to.getTime() - range.value.from.getTime()
  return salesIn(new Date(range.value.from.getTime() - len), range.value.from)
})
const excluded = computed(() => store.transactions.value.filter(t => t.kind === 'sale' && !store.countsInTotal(t) && inRange(t, range.value.from, range.value.to)).length)

const costOf = (productId: string) => store.productById(productId)?.cost ?? 0
const kpi = computed(() => {
  const revenue = sales.value.reduce((s, t) => s + t.total, 0)
  const profit = sales.value.reduce((s, t) => s + t.items.reduce((x, i) => x + (i.price - costOf(i.productId)) * i.qty, 0), 0)
  const count = sales.value.length
  const prev = prevSales.value.reduce((s, t) => s + t.total, 0)
  const purchases = store.transactions.value.filter(t => t.kind === 'purchase' && store.countsInTotal(t) && inRange(t, range.value.from, range.value.to)).reduce((s, t) => s + t.total, 0)
  return {
    revenue, profit, count, avg: count ? revenue / count : 0, purchases,
    margin: revenue ? Math.round((profit / revenue) * 100) : 0,
    change: prev ? Math.round(((revenue - prev) / prev) * 1000) / 10 : null,
  }
})

const CHANNELS: Channel[] = ['offline', 'telegram', 'instagram', 'app']
const byChannel = computed(() => {
  const rows = CHANNELS.map(c => ({ key: c, sum: sales.value.filter(t => t.channel === c).reduce((s, t) => s + t.total, 0), n: sales.value.filter(t => t.channel === c).length }))
  const max = Math.max(1, ...rows.map(r => r.sum))
  return rows.map(r => ({ ...r, pct: (r.sum / max) * 100, share: kpi.value.revenue ? Math.round((r.sum / kpi.value.revenue) * 100) : 0 }))
})

// Kategorik ranglar (validatsiyadan o'tgan tartib)
const METHOD_COLOR: Record<PayMethod, string> = {
  cash: '#0e8a5f', card: '#2a78d6', click: '#eb6834', payme: '#7c3aed', transfer: '#eda100', balance: '#e87ba4',
}
const METHODS = Object.keys(METHOD_COLOR) as PayMethod[]
const byMethod = computed(() => {
  const total = kpi.value.revenue
  let acc = 0
  return METHODS.map((m) => {
    const sum = sales.value.filter(t => t.method === m).reduce((s, t) => s + t.total, 0)
    const pct = total ? (sum / total) * 100 : 0
    const seg = { key: m, sum, pct, offset: acc }
    acc += pct
    return seg
  }).filter(s => s.sum > 0)
})
const hoverMethod = ref<PayMethod | null>(null)
const hovered = computed(() => byMethod.value.find(m => m.key === hoverMethod.value))

const topProducts = computed(() => {
  const map = new Map<string, { id: string, name: string, qty: number, sum: number }>()
  for (const t of sales.value) {
    for (const i of t.items) {
      const r = map.get(i.productId) ?? { id: i.productId, name: i.name, qty: 0, sum: 0 }
      r.qty += i.qty
      r.sum += i.qty * i.price
      map.set(i.productId, r)
    }
  }
  return [...map.values()].sort((a, b) => b.sum - a.sum).slice(0, 5)
})

function printPdf() {
  haptic('light')
  show('PDF tayyorlanmoqda…', 'info')
  setTimeout(() => {
    document.body.classList.add('inv-printing')
    try { window.print() }
    catch { show('Chop etish bu qurilmada mavjud emas', 'error') }
    finally { document.body.classList.remove('inv-printing') }
  }, 300)
}
</script>

<template>
  <PageHeader title="Hisobot" :subtitle="rangeLabel" back="/ombor">
    <RoundButton icon="printer" label="PDF yuklab olish" @click="printPdf" />
  </PageHeader>
  <div class="shrink-0 px-5 pb-3">
    <Segmented v-model="period" :options="PERIODS" />
    <div v-if="period === 'custom'" class="mt-2.5 grid animate-fade-in grid-cols-2 gap-2">
      <label class="flex flex-col gap-1">
        <span class="text-[11px] font-bold text-muted">Dan</span>
        <input v-model="customFrom" type="date" :max="customTo" class="h-11 rounded-2xl bg-card px-3 text-sm font-bold shadow-card outline-none">
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-[11px] font-bold text-muted">Gacha</span>
        <input v-model="customTo" type="date" :min="customFrom" class="h-11 rounded-2xl bg-card px-3 text-sm font-bold shadow-card outline-none">
      </label>
      <p v-if="customError" class="col-span-2 text-xs font-semibold text-danger">{{ customError }}</p>
    </div>
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
    <div class="relative overflow-hidden rounded-[24px] bg-brand p-5 text-white shadow-float">
      <div class="absolute -top-12 -right-10 size-40 rounded-full bg-white/8" />
      <p class="text-[13px] font-bold text-white/70">Tushum</p>
      <p class="mt-1 text-[30px] leading-tight font-extrabold tracking-tight">{{ formatSom(kpi.revenue) }} <span class="text-base font-bold text-white/70">so'm</span></p>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
        <span v-if="kpi.change !== null" class="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
          <AppIcon :name="kpi.change >= 0 ? 'arrow-up' : 'arrow-down'" :size="12" :stroke="3" />{{ Math.abs(kpi.change) }}%
        </span>
        <span class="text-white/70">{{ kpi.change !== null ? 'oldingi davrga nisbatan' : 'Oldingi davrda savdo yo\'q' }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div class="card p-3.5">
        <p class="flex items-center gap-1.5 text-xs font-bold text-muted"><AppIcon name="trend" :size="14" class="text-brand" />Foyda</p>
        <p class="mt-1 text-lg font-extrabold">{{ formatSom(kpi.profit) }}</p>
        <p class="text-[11px] font-semibold text-muted">marja {{ kpi.margin }}%</p>
      </div>
      <div class="card p-3.5">
        <p class="flex items-center gap-1.5 text-xs font-bold text-muted"><AppIcon name="file" :size="14" class="text-brand" />Cheklar soni</p>
        <p class="mt-1 text-lg font-extrabold">{{ kpi.count }}</p>
        <p class="text-[11px] font-semibold text-muted">{{ excluded ? `${excluded} ta qaytarilgan/bekor` : 'hammasi hisobda' }}</p>
      </div>
      <div class="card p-3.5">
        <p class="flex items-center gap-1.5 text-xs font-bold text-muted"><AppIcon name="cart" :size="14" class="text-brand" />O'rtacha chek</p>
        <p class="mt-1 text-lg font-extrabold">{{ formatSom(kpi.avg) }}</p>
        <p class="text-[11px] font-semibold text-muted">so'm</p>
      </div>
      <div class="card p-3.5">
        <p class="flex items-center gap-1.5 text-xs font-bold text-muted"><AppIcon name="truck" :size="14" class="text-brand" />Kirim (xarid)</p>
        <p class="mt-1 text-lg font-extrabold">{{ formatSom(kpi.purchases) }}</p>
        <p class="text-[11px] font-semibold text-muted">so'm</p>
      </div>
    </div>

    <template v-if="sales.length">
      <SectionHead title="Savdo kanallari" />
      <div class="card flex flex-col gap-3.5 p-4">
        <div v-for="c in byChannel" :key="c.key" class="flex flex-col gap-1.5" :title="`${channelLabel[c.key]}: ${formatSom(c.sum)} so'm, ${c.n} ta chek`">
          <div class="flex items-center gap-2 text-[13px]">
            <span class="flex size-7 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="channelIcon[c.key] as any" :size="14" /></span>
            <span class="grow font-bold">{{ channelLabel[c.key] }}</span>
            <span class="font-extrabold">{{ formatSom(c.sum) }}</span>
            <span class="w-9 text-right text-xs font-bold text-muted">{{ c.share }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-field">
            <div class="h-full rounded-full bg-brand transition-all duration-500" :style="{ width: `${c.pct}%` }" />
          </div>
        </div>
      </div>

      <SectionHead title="To'lov turlari" />
      <div class="card flex items-center gap-4 p-4">
        <div class="relative size-[132px] shrink-0">
          <svg viewBox="0 0 42 42" class="size-full -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--color-field)" stroke-width="6" />
            <circle
              v-for="m in byMethod" :key="m.key" cx="21" cy="21" r="15.915" fill="none"
              :stroke="METHOD_COLOR[m.key]" :stroke-width="hoverMethod === m.key ? 7.5 : 6"
              :stroke-dasharray="`${Math.max(0, m.pct - (byMethod.length > 1 ? 0.8 : 0))} ${100 - m.pct + (byMethod.length > 1 ? 0.8 : 0)}`"
              :stroke-dashoffset="-m.offset"
              class="cursor-pointer transition-all"
              :opacity="hoverMethod && hoverMethod !== m.key ? 0.35 : 1"
              @pointerenter="hoverMethod = m.key" @pointerleave="hoverMethod = null" @click="hoverMethod = hoverMethod === m.key ? null : m.key"
            />
          </svg>
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span class="text-[11px] font-bold text-muted">{{ hovered ? methodLabel[hovered.key] : 'Jami' }}</span>
            <span class="text-sm font-extrabold">{{ hovered ? `${Math.round(hovered.pct)}%` : kpi.count }}</span>
            <span v-if="!hovered" class="text-[10px] font-semibold text-muted">chek</span>
          </div>
        </div>
        <div class="flex min-w-0 grow flex-col gap-2">
          <button
            v-for="m in byMethod" :key="m.key" type="button"
            class="flex items-center gap-2 rounded-lg text-left text-[13px] transition-opacity"
            :class="hoverMethod && hoverMethod !== m.key && 'opacity-45'"
            @click="hoverMethod = hoverMethod === m.key ? null : m.key"
          >
            <span class="size-2.5 shrink-0 rounded-full" :style="{ background: METHOD_COLOR[m.key] }" />
            <span class="grow truncate font-bold">{{ methodLabel[m.key] }}</span>
            <span class="text-xs font-extrabold">{{ Math.round(m.pct) }}%</span>
          </button>
        </div>
      </div>

      <SectionHead title="Top mahsulotlar" />
      <div class="card px-4">
        <NuxtLink v-for="(p, i) in topProducts" :key="p.id" :to="`/ombor/${p.id}`" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
          <span class="w-4 text-center text-sm font-extrabold" :class="i === 0 ? 'text-brand' : 'text-muted'">{{ i + 1 }}</span>
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-field text-xl">{{ store.productById(p.id)?.emoji ?? '📦' }}</span>
          <span class="min-w-0 grow">
            <span class="block truncate text-sm font-bold">{{ p.name }}</span>
            <span class="block text-xs font-semibold text-muted">{{ p.qty }} {{ store.productById(p.id)?.unit ?? 'dona' }} sotildi</span>
          </span>
          <span class="shrink-0 text-sm font-extrabold">{{ formatSom(p.sum) }}</span>
        </NuxtLink>
      </div>
    </template>
    <div v-else class="card"><EmptyState icon="chart" title="Bu davrda savdo yo'q" text="Boshqa davrni tanlab ko'ring" /></div>

    <PillButton block variant="outline" icon="download" @click="printPdf">PDF hisobot</PillButton>
  </div>

  <!-- Chop etish uchun versiya -->
  <Teleport to="body">
    <div id="inv-print-report">
      <h1>{{ store.business.value.name }} — savdo hisoboti</h1>
      <p class="meta">Davr: {{ rangeLabel }} · Tayyorlandi: {{ formatDate(new Date().toISOString()) }} {{ formatTime(new Date().toISOString()) }}</p>
      <table>
        <tbody>
          <tr><td>Tushum</td><td>{{ formatSom(kpi.revenue) }} so'm</td></tr>
          <tr><td>Foyda</td><td>{{ formatSom(kpi.profit) }} so'm ({{ kpi.margin }}%)</td></tr>
          <tr><td>Cheklar soni</td><td>{{ kpi.count }}</td></tr>
          <tr><td>O'rtacha chek</td><td>{{ formatSom(kpi.avg) }} so'm</td></tr>
          <tr><td>Kirim (xarid)</td><td>{{ formatSom(kpi.purchases) }} so'm</td></tr>
        </tbody>
      </table>
      <h2>Savdo kanallari</h2>
      <table>
        <thead><tr><th>Kanal</th><th>Cheklar</th><th>Summa</th><th>Ulush</th></tr></thead>
        <tbody><tr v-for="c in byChannel" :key="c.key"><td>{{ channelLabel[c.key] }}</td><td>{{ c.n }}</td><td>{{ formatSom(c.sum) }}</td><td>{{ c.share }}%</td></tr></tbody>
      </table>
      <h2>To'lov turlari</h2>
      <table>
        <thead><tr><th>Usul</th><th>Summa</th><th>Ulush</th></tr></thead>
        <tbody><tr v-for="m in byMethod" :key="m.key"><td>{{ methodLabel[m.key] }}</td><td>{{ formatSom(m.sum) }}</td><td>{{ Math.round(m.pct) }}%</td></tr></tbody>
      </table>
      <h2>Top mahsulotlar</h2>
      <table>
        <thead><tr><th>#</th><th>Mahsulot</th><th>Miqdor</th><th>Summa</th></tr></thead>
        <tbody><tr v-for="(p, i) in topProducts" :key="p.id"><td>{{ i + 1 }}</td><td>{{ p.name }}</td><td>{{ p.qty }}</td><td>{{ formatSom(p.sum) }}</td></tr></tbody>
      </table>
      <p class="meta">Qaytarilgan va bekor qilingan buyurtmalar jamiga kiritilmagan.</p>
    </div>
  </Teleport>
</template>

<style>
#inv-print-report { display: none; }
@media print {
  body.inv-printing > *:not(#inv-print-report) { display: none !important; }
  body.inv-printing { background: #fff !important; }
  body.inv-printing #inv-print-report { display: block; padding: 24px; color: #121212; font-family: Manrope, system-ui, sans-serif; }
  #inv-print-report h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; color: #05472a; }
  #inv-print-report h2 { font-size: 15px; font-weight: 800; margin: 20px 0 8px; }
  #inv-print-report .meta { font-size: 12px; color: #4a5a52; margin: 0 0 12px; }
  #inv-print-report table { width: 100%; border-collapse: collapse; font-size: 13px; }
  #inv-print-report th, #inv-print-report td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e9ecf1; }
  #inv-print-report th { background: #e6efe9; font-weight: 800; }
}
</style>
