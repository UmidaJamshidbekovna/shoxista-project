<script setup lang="ts">
definePageMeta({ tab: true })

const { share, selection } = useTelegram()

type Period = 'Kun' | 'Hafta' | 'Oy' | 'Yil'
const periods: Period[] = ['Kun', 'Hafta', 'Oy', 'Yil']
const period = ref<Period>('Hafta')

// Har bir davr uchun hisobot ma'lumotlari (ustunlar ming so'mda)
const reports: Record<Period, {
  label: string, change: string, active: number
  bars: { l: string, v: number }[]
  stats: { label: string, value: string, note: string, bad?: boolean }[]
  top: { name: string, qty: string, sum: number }[]
}> = {
  Kun: {
    label: 'Kunlik tushum · 23 sentabr',
    change: 'Kechagidan +3.2%',
    active: 4,
    bars: [{ l: '09', v: 180 }, { l: '11', v: 420 }, { l: '13', v: 610 }, { l: '15', v: 380 }, { l: '17', v: 720 }, { l: '19', v: 540 }, { l: '21', v: 85 }],
    stats: [
      { label: 'Sof foyda', value: '640 000', note: '+2.8%' },
      { label: 'Cheklar', value: '51', note: "O'rtacha 57 500" },
      { label: 'Qarzga sotuv', value: '210 000', note: '3 ta mijoz', bad: true },
      { label: 'Qaytarishlar', value: '12 000', note: '1 ta', bad: true },
    ],
    top: [
      { name: 'Non, patir', qty: '58 dona', sum: 348000 },
      { name: 'Sut 2.5% 1 L', qty: '24 dona', sum: 300000 },
      { name: 'Guruch lazer 1 kg', qty: '14 kg', sum: 252000 },
      { name: "Ko'k choy 100 g", qty: '19 dona', sum: 171000 },
    ],
  },
  Hafta: {
    label: 'Haftalik tushum · 17–23 sentabr',
    change: "O'tgan haftadan +8.4%",
    active: 2,
    bars: [{ l: 'Du', v: 3120 }, { l: 'Se', v: 3745 }, { l: 'Ch', v: 2935 }, { l: 'Pa', v: 4120 }, { l: 'Ju', v: 4870 }, { l: 'Sh', v: 5120 }, { l: 'Ya', v: 3550 }],
    stats: [
      { label: 'Sof foyda', value: '5 870 000', note: '+6.1%' },
      { label: 'Cheklar', value: '468', note: "O'rtacha 58 700" },
      { label: 'Qarzga sotuv', value: '1 920 000', note: '18 ta mijoz', bad: true },
      { label: 'Qaytarishlar', value: '84 000', note: '5 ta', bad: true },
    ],
    top: [
      { name: 'Non, patir', qty: '412 dona', sum: 2472000 },
      { name: 'Guruch lazer 1 kg', qty: '186 kg', sum: 3348000 },
      { name: 'Sut 2.5% 1 L', qty: '171 dona', sum: 2137500 },
      { name: "Ko'k choy 100 g", qty: '128 dona', sum: 1152000 },
    ],
  },
  Oy: {
    label: 'Oylik tushum · sentabr',
    change: "O'tgan oydan +5.7%",
    active: 3,
    bars: [{ l: '1-h', v: 24800 }, { l: '2-h', v: 26150 }, { l: '3-h', v: 25330 }, { l: '4-h', v: 27460 }, { l: '5-h', v: 9800 }],
    stats: [
      { label: 'Sof foyda', value: '23 100 000', note: '+4.9%' },
      { label: 'Cheklar', value: '1 942', note: "O'rtacha 58 300" },
      { label: 'Qarzga sotuv', value: '7 450 000', note: '41 ta mijoz', bad: true },
      { label: 'Qaytarishlar', value: '318 000', note: '19 ta', bad: true },
    ],
    top: [
      { name: 'Guruch lazer 1 kg', qty: '764 kg', sum: 13752000 },
      { name: 'Non, patir', qty: '1 690 dona', sum: 10140000 },
      { name: 'Sut 2.5% 1 L', qty: '702 dona', sum: 8775000 },
      { name: "Ko'k choy 100 g", qty: '515 dona', sum: 4635000 },
    ],
  },
  Yil: {
    label: 'Yillik tushum · 2026',
    change: "O'tgan yildan +12.6%",
    active: 8,
    bars: [
      { l: 'Yan', v: 84 }, { l: 'Fev', v: 79 }, { l: 'Mar', v: 92 }, { l: 'Apr', v: 96 }, { l: 'May', v: 101 }, { l: 'Iyn', v: 98 },
      { l: 'Iyl', v: 104 }, { l: 'Avg', v: 107 }, { l: 'Sen', v: 113 }, { l: 'Okt', v: 0 }, { l: 'Noy', v: 0 }, { l: 'Dek', v: 0 },
    ],
    stats: [
      { label: 'Sof foyda', value: '178 400 000', note: '+11.2%' },
      { label: 'Cheklar', value: '15 380', note: "O'rtacha 56 900" },
      { label: 'Qarzga sotuv', value: '52 600 000', note: '96 ta mijoz', bad: true },
      { label: 'Qaytarishlar', value: '2 640 000', note: '137 ta', bad: true },
    ],
    top: [
      { name: 'Guruch lazer 1 kg', qty: '6 120 kg', sum: 110160000 },
      { name: 'Non, patir', qty: '14 300 dona', sum: 85800000 },
      { name: 'Sut 2.5% 1 L', qty: '5 840 dona', sum: 73000000 },
      { name: "Paxta yog'i 1 L", qty: '2 410 dona', sum: 57840000 },
    ],
  },
}

const r = computed(() => reports[period.value])
// Yil uchun ustunlar mln so'mda, qolganlari ming so'mda
const total = computed(() => r.value.bars.reduce((s, b) => s + b.v, 0) * (period.value === 'Yil' ? 1_000_000 : 1000))
const max = computed(() => Math.max(...r.value.bars.map(b => b.v)))
const height = (v: number) => `${Math.max(2, (v / max.value) * 82)}%`

function pick(p: Period) {
  period.value = p
  selection()
}
function onShare() {
  const top = r.value.top.map((t, i) => `${i + 1}. ${t.name} — ${formatSom(t.sum)}`).join('\n')
  const stats = r.value.stats.map(s => `${s.label}: ${s.value}`).join('\n')
  share(`Hisobot · Chilonzor filiali\n${r.value.label}: ${formatSom(total.value)} so'm\n${stats}\n\nEng ko'p sotilganlar:\n${top}`)
}
</script>

<template>
  <ScreenHeader title="Hisobot" subtitle="Chilonzor filiali" back="/profil">
    <IconButton icon="share" label="Hisobotni ulashish" @click="onShare" />
  </ScreenHeader>

  <div class="mx-5 mb-3 flex shrink-0 gap-1 rounded-[14px] bg-[#E8E5DC] p-1">
    <button
      v-for="p in periods" :key="p" type="button"
      class="h-9 grow basis-0 rounded-[10px] text-sm font-semibold"
      :class="period === p ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(23,25,30,0.12)]' : 'text-muted'"
      @click="pick(p)"
    >
      {{ p }}
    </button>
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-5">
    <div class="rounded-[20px] bg-ink p-4 text-white">
      <div class="text-[13px] opacity-85">{{ r.label }}</div>
      <div class="font-display text-[32px] font-bold">{{ formatSom(total) }} <span class="text-base font-medium">so'm</span></div>
      <div class="text-[13px] opacity-85">{{ r.change }}</div>
      <div class="mt-3 flex h-[110px] items-end rounded-[14px] bg-surface p-2.5" :class="r.bars.length > 7 ? 'gap-1' : 'gap-2'">
        <div v-for="(b, i) in r.bars" :key="b.l" class="flex h-full grow basis-0 flex-col items-center justify-end gap-1.5">
          <div
            class="w-full max-w-7 rounded-[6px_6px_2px_2px] transition-[height] duration-300"
            :class="i === r.active ? 'bg-brand' : 'bg-[#BFD9CE]'"
            :style="{ height: height(b.v) }"
          />
          <span class="text-[11px]" :class="i === r.active ? 'font-bold text-ink' : 'font-medium text-muted'">{{ b.l }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div v-for="s in r.stats" :key="s.label" class="rounded-2xl border border-line bg-surface px-3.5 py-3">
        <div class="text-xs font-semibold text-muted">{{ s.label }}</div>
        <div class="mt-0.5 font-display text-xl font-bold">{{ s.value }}</div>
        <div class="text-xs font-semibold" :class="s.bad ? 'text-danger' : 'text-brand'">{{ s.note }}</div>
      </div>
    </div>

    <SectionTitle>Eng ko'p sotilganlar</SectionTitle>
    <div class="rounded-[18px] border border-line bg-surface px-3.5">
      <div v-for="(t, i) in r.top" :key="t.name" class="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
        <span class="w-6 text-sm font-bold text-muted">{{ i + 1 }}</span>
        <span class="grow text-sm font-semibold">{{ t.name }}<span class="block text-xs font-medium text-muted">{{ t.qty }}</span></span>
        <span class="text-sm font-bold">{{ formatSom(t.sum) }}</span>
      </div>
    </div>
  </div>
</template>
