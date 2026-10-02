<script setup lang="ts">
import { revenue } from '~/data/sample'

type Period = 'day' | 'week' | 'month'
const period = ref<Period>('day')
const options = [{ value: 'day', label: 'Kun' }, { value: 'week', label: 'Hafta' }, { value: 'month', label: 'Oy' }]

const data = computed(() => revenue[period.value])
const unit = computed(() => period.value === 'day' ? 'ming' : 'mln')
const active = ref<number | null>(null)
watch(period, () => { active.value = null })

const W = 300
const H = 112
const PAD_T = 14
const PAD_B = 6

const pts = computed(() => {
  const p = data.value.points
  const max = Math.max(...p) * 1.08
  const min = Math.min(0, ...p)
  const step = W / (p.length - 1)
  return p.map((v, i) => ({ x: i * step, y: PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B), v }))
})

// silliq egri chiziq (cubic bezier, o'rta nuqtalar bilan)
const line = computed(() => {
  const p = pts.value
  let d = `M${p[0]!.x},${p[0]!.y}`
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!
    const b = p[i]!
    const cx = (a.x + b.x) / 2
    d += ` C${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}`
  }
  return d
})
const area = computed(() => `${line.value} L${W},${H} L0,${H} Z`)

const sel = computed(() => pts.value[active.value ?? pts.value.length - 1]!)
const selLabel = computed(() => data.value.labels[active.value ?? pts.value.length - 1])
const fmtPoint = (v: number) => `${String(v).replace('.', ',')} ${unit.value}`
const titles: Record<Period, string> = { day: 'Bugungi tushum', week: 'Haftalik tushum', month: 'Oylik tushum' }

function pick(e: PointerEvent) {
  const el = e.currentTarget as SVGElement
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * W
  const step = W / (pts.value.length - 1)
  active.value = Math.min(pts.value.length - 1, Math.max(0, Math.round(x / step)))
}
</script>

<template>
  <section class="relative overflow-hidden rounded-[24px] bg-brand p-5 text-white shadow-float">
    <div class="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-[radial-gradient(circle,rgba(110,231,165,0.28)_0%,transparent_70%)]" />
    <div class="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />

    <div class="relative">
      <Segmented v-model="period" :options="options" dark />

      <div class="mt-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[13px] font-semibold text-white/70">{{ titles[period] }} · {{ data.label }}</p>
          <p class="mt-1 text-[30px] leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap">
            {{ formatSom(data.total) }} <span class="text-base font-bold text-white/70">so'm</span>
          </p>
        </div>
        <span
          class="mt-1 inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-extrabold"
          :class="data.change >= 0 ? 'bg-[#6ee7a5]/20 text-[#8ff0b9]' : 'bg-[#ff8a80]/20 text-[#ffb4ab]'"
        >
          <AppIcon :name="data.change >= 0 ? 'arrow-up' : 'arrow-down'" :size="13" :stroke="2.8" />
          {{ Math.abs(data.change).toString().replace('.', ',') }}%
        </span>
      </div>
      <p class="text-[12px] font-medium text-white/55">{{ data.change >= 0 ? 'oldingi davrga nisbatan o\'sish' : 'oldingi davrga nisbatan pasayish' }}</p>

      <div class="relative mt-3">
        <svg
          :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="block h-[112px] w-full touch-none overflow-visible"
          role="img" :aria-label="`${titles[period]} grafigi`"
          @pointerdown="pick" @pointermove="(e) => e.buttons && pick(e)"
        >
          <defs>
            <linearGradient id="home-rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#8ff0b9" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#8ff0b9" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line v-for="g in 3" :key="g" x1="0" :x2="W" :y1="(H / 4) * g" :y2="(H / 4) * g" stroke="white" stroke-opacity="0.08" stroke-dasharray="3 5" vector-effect="non-scaling-stroke" />
          <path :d="area" fill="url(#home-rev-fill)" class="transition-all duration-500" />
          <path :d="line" fill="none" stroke="#8ff0b9" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" class="transition-all duration-500" />
          <line :x1="sel.x" :x2="sel.x" :y1="sel.y" :y2="H" stroke="white" stroke-opacity="0.35" stroke-dasharray="3 4" vector-effect="non-scaling-stroke" />
        </svg>
        <!-- tanlangan nuqta (HTML'da, cho'zilmasligi uchun) -->
        <span
          class="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#22c483] shadow-[0_0_0_6px_rgba(143,240,185,0.25)] transition-all duration-300"
          :style="{ left: `${(sel.x / W) * 100}%`, top: `${(sel.y / H) * 112}px` }"
        />
        <span
          class="pointer-events-none absolute rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap text-brand shadow-card transition-all duration-300"
          :style="{
            left: `${(sel.x / W) * 100}%`, top: `${(sel.y / H) * 112}px`,
            transform: `translate(${sel.x < 40 ? '-10%' : sel.x > W - 40 ? '-90%' : '-50%'}, calc(-100% - 12px))`,
          }"
        >{{ selLabel }} · {{ fmtPoint(sel.v) }}</span>
      </div>
      <div class="mt-2 flex justify-between text-[11px] font-bold text-white/55">
        <button
          v-for="(l, i) in data.labels" :key="l" type="button" class="min-w-0 transition-colors"
          :class="(active ?? data.labels.length - 1) === i && 'text-white'" @click="active = i"
        >{{ l }}</button>
      </div>
    </div>
  </section>
</template>
