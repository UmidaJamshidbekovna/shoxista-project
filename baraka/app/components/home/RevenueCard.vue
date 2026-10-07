<script setup lang="ts">
// Bosh sahifadagi savdo kartasi (Home Page spetsifikatsiyasi §3)
import { revenue } from '~/data/sample'

type Period = 'day' | 'week' | 'custom'

const { transactions, countsInTotal, settings } = useStore()
const { selection, haptic } = useTelegram()

const BARS = 7
const period = ref<Period>('day')
const calOpen = ref(false)

const iso = (d: Date) => dayKey(d.toISOString())
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 6 * 86400000)))
const to = ref(iso(today))
const draft = reactive({ from: from.value, to: to.value })

/** Custom davr: haqiqiy tranzaksiyalardan 7 ta ustun va oldingi davr bilan solishtirish */
const customSeries = computed(() => {
  const start = new Date(`${from.value}T00:00:00`).getTime()
  const end = new Date(`${to.value}T00:00:00`).getTime() + 86400000
  const span = Math.max(86400000, end - start)
  const step = span / BARS
  const points = Array.from({ length: BARS }, () => 0)
  let total = 0
  let prev = 0
  for (const t of transactions.value) {
    if (t.kind !== 'sale' || !countsInTotal(t)) continue
    const ts = new Date(t.date).getTime()
    if (ts >= start && ts < end) {
      points[Math.min(BARS - 1, Math.floor((ts - start) / step))]! += t.total
      total += t.total
    }
    else if (ts >= start - span && ts < start) { prev += t.total }
  }
  const labels = Array.from({ length: BARS }, (_, i) => {
    const d = new Date(start + i * step)
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  return { total, change: prev ? Math.round(((total - prev) / prev) * 1000) / 10 : 0, points, labels }
})

const data = computed(() => period.value === 'custom' ? customSeries.value : revenue[period.value])
const title = computed(() => period.value === 'day'
  ? 'Bugungi savdo'
  : period.value === 'week' ? 'Haftalik savdo' : `${formatDate(from.value)} — ${formatDate(to.value)}`)

/** Summa Do'kon sozlamalaridagi valyutada (§3.2) */
const { amount } = useMoney()
const money = computed(() => amount(data.value.total))
const currency = computed(() => settings.value.currency === 'USD' ? '' : 'so\'m')

const peak = computed(() => Math.max(...data.value.points, 1))

function pick(p: Period) {
  period.value = p
  selection()
}

function openCalendar() {
  draft.from = from.value
  draft.to = to.value
  calOpen.value = true
  selection()
}

function applyRange() {
  if (draft.from > draft.to) [draft.from, draft.to] = [draft.to, draft.from]
  from.value = draft.from
  to.value = draft.to
  period.value = 'custom'
  calOpen.value = false
  haptic('light')
}

/** Karta bosilganda — Hisobot sahifasi, tanlangan davr bilan */
function openReport() {
  haptic('light')
  navigateTo({
    path: '/ombor/hisobot',
    query: period.value === 'custom' ? { period: 'custom', from: from.value, to: to.value } : { period: period.value },
  })
}
</script>

<template>
  <section
    class="relative cursor-pointer overflow-clip rounded-[24px] bg-brand p-[18px] text-white shadow-float transition-transform active:scale-[0.99]"
    role="button" tabindex="0" aria-label="Savdo hisoboti"
    @click="openReport" @keydown.enter="openReport"
  >
    <div class="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-[radial-gradient(circle,rgba(110,231,165,0.28)_0%,transparent_70%)]" />

    <div class="relative flex flex-col gap-3.5">
      <!-- yuqori qator: davr nomi + tanlagich -->
      <div class="flex items-center justify-between gap-2">
        <p class="min-w-0 truncate text-[11px] font-bold tracking-[0.08em] text-[#b9d3c4] uppercase">{{ title }}</p>
        <div class="flex shrink-0 items-center rounded-[20px] bg-white/12 p-[3px]" @click.stop>
          <button
            v-for="o in [{ v: 'day', l: 'Bugun' }, { v: 'week', l: 'Hafta' }]" :key="o.v"
            type="button" class="rounded-2xl px-[11px] py-1.5 text-[12px] font-bold transition-colors"
            :class="period === o.v ? 'bg-white text-brand' : 'text-[#d5e5dc]'"
            @click="pick(o.v as Period)"
          >{{ o.l }}</button>
          <button
            type="button" aria-label="Sana oralig'ini tanlash"
            class="flex h-7 w-[30px] items-center justify-center rounded-2xl transition-colors"
            :class="period === 'custom' ? 'bg-white text-brand' : 'text-[#d5e5dc]'"
            @click="openCalendar"
          >
            <AppIcon name="calendar" :size="14" :stroke="2.2" />
          </button>
        </div>
      </div>

      <!-- summa -->
      <div class="flex items-end justify-between gap-3">
        <p class="min-w-0 truncate text-[30px] leading-none font-extrabold tracking-[-0.03em]">
          {{ money }} <span v-if="currency" class="text-base font-bold text-white/70">{{ currency }}</span>
        </p>
        <span
          v-if="data.change"
          class="shrink-0 rounded-[10px] px-[9px] py-1 text-[12px] font-extrabold"
          :class="data.change >= 0 ? 'bg-[#4ade80]/[0.18] text-[#4ade80]' : 'bg-[#ff8a80]/[0.18] text-[#ffb4ab]'"
        >{{ data.change >= 0 ? '+' : '−' }}{{ Math.abs(data.change).toString().replace('.', ',') }}%</span>
      </div>

      <!-- mini grafik: 7 ta ustun -->
      <div>
        <div class="flex h-[76px] items-end gap-2">
          <div
            v-for="(v, i) in data.points" :key="i"
            class="grow basis-0 rounded-lg transition-[height] duration-[350ms]"
            :style="{ height: `${Math.max(4, (v / peak) * 100)}%`, background: v === peak ? '#4ade80' : 'rgba(255,255,255,.16)' }"
          />
        </div>
        <div class="mt-2 flex gap-2">
          <span v-for="(l, i) in data.labels" :key="i" class="grow basis-0 truncate text-center text-[10px] font-semibold text-[#b9d3c4]">{{ l }}</span>
        </div>
      </div>
    </div>
  </section>

  <BSheet v-model="calOpen" title="Davrni tanlang">
    <div class="flex flex-col gap-3">
      <BInput v-model="draft.from" label="Boshlanishi" type="date" />
      <BInput v-model="draft.to" label="Tugashi" type="date" />
    </div>
    <template #footer>
      <PillButton block @click="applyRange">Qo'llash</PillButton>
    </template>
  </BSheet>
</template>
