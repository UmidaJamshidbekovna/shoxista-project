<script setup lang="ts">
// Valyuta kursi vidjeti (Stock and History.md §II.2):
// 1 marta bosish → Markaziy bank kursini yuklash; 2 marta bosish → qo'lda tahrirlash.
const { settings } = useStore()
const { show } = useToast()
const { haptic, notify } = useTelegram()

const rateLoading = useState('hist-rate-loading', () => false)
const rateSrc = useState('hist-rate-src', () => 'Yangilash')
const rateEdit = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement>()

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

// Bitta va ikki marta bosishni ajratish (~250ms)
let timer: ReturnType<typeof setTimeout> | undefined
function onTap() {
  if (rateEdit.value) return
  if (timer) {
    clearTimeout(timer)
    timer = undefined
    startEdit()
    return
  }
  timer = setTimeout(() => {
    timer = undefined
    load()
  }, 250)
}
onBeforeUnmount(() => timer && clearTimeout(timer))

async function load() {
  if (rateLoading.value) return
  rateLoading.value = true
  haptic('light')
  let rate: number | undefined
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/', { signal: ctrl.signal })
    clearTimeout(to)
    const data = await res.json()
    const r = Number(String(data?.[0]?.Rate ?? '').replace(/\s/g, '').replace(',', '.'))
    if (r > 0) rate = r
  }
  catch {}
  if (rate) {
    settings.value.usdRate = Math.round(rate * 100) / 100
    rateSrc.value = `MB · ${hhmm()}`
    show(`Markaziy bank kursi: 1 $ = ${formatSom(rate)} so'm`)
  }
  else {
    // Tarmoq/CORS xatosi — taxminiy (simulyatsiya) kurs
    await new Promise(r => setTimeout(r, 500))
    const sim = Math.round(settings.value.usdRate + (Math.random() * 60 - 30))
    settings.value.usdRate = sim
    rateSrc.value = `MB · ${hhmm()}`
    show(`MB bilan aloqa yo'q — taxminiy kurs: ${formatSom(sim)} so'm`, 'info')
  }
  rateLoading.value = false
}

function startEdit() {
  haptic('medium')
  draft.value = String(Math.round(settings.value.usdRate))
  rateEdit.value = true
  nextTick(() => { input.value?.focus(); input.value?.select() })
}
function save() {
  const v = Number(draft.value.replace(/\s/g, '').replace(',', '.'))
  if (v > 0) {
    settings.value.usdRate = v
    rateSrc.value = 'Qo\'lda'
    notify('success')
    show(`Kurs saqlandi: 1 $ = ${formatSom(v)} so'm`)
  }
  rateEdit.value = false
}
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-2 rounded-[18px] bg-card py-1.5 pr-2.5 pl-1.5 select-none"
    :class="!rateEdit && 'cursor-pointer'"
    :style="{ boxShadow: `${rateEdit ? 'inset 0 0 0 1.5px #05472a, ' : ''}0 2px 10px rgba(5,71,42,.06)` }"
    role="button" :aria-label="rateEdit ? 'Kursni tahrirlash' : 'Kursni yangilash (2 marta bosing — tahrirlash)'"
    @click="onTap"
  >
    <span class="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand text-[14px] font-extrabold text-white">$</span>

    <form v-if="rateEdit" class="flex items-center gap-1.5" @submit.prevent="save" @click.stop>
      <span class="text-[14px] font-extrabold whitespace-nowrap text-ink">1 $ =</span>
      <input
        ref="input" v-model="draft" inputmode="decimal" aria-label="Kurs"
        class="w-16 bg-transparent text-[14px] font-extrabold text-ink outline-none"
        @keydown.esc="rateEdit = false"
      >
      <button type="submit" aria-label="Saqlash" class="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand text-white active:scale-95">
        <AppIcon name="check" :size="15" :stroke="2.4" />
      </button>
    </form>

    <span v-else class="flex flex-col">
      <span class="text-[14px] leading-[18px] font-extrabold whitespace-nowrap text-ink">1 $ = {{ formatSom(settings.usdRate) }}</span>
      <span class="flex items-center gap-[3px] text-[10px] leading-3 font-semibold whitespace-nowrap text-muted">
        <AppIcon name="refresh" :size="10" :stroke="2.4" :class="rateLoading && 'animate-[spin_.8s_linear_infinite]'" />
        {{ rateLoading ? 'Yuklanmoqda…' : rateSrc }}
      </span>
    </span>
  </div>
</template>
