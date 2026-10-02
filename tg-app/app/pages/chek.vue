<script setup lang="ts">
const { lastReceipt } = useCart()
const { share } = useTelegram()

// To'g'ridan-to'g'ri ochilganda dizayndagi namunaviy chek
const r = computed(() => lastReceipt.value ?? {
  no: '004817',
  date: new Date('2026-09-23T14:32:00'),
  lines: [
    { name: 'Guruch lazer 1 kg', qty: 2, sum: 36000 },
    { name: 'Sut 2.5% 1 L', qty: 1, sum: 12500 },
    { name: 'Paxta yog\'i 1 L', qty: 1, sum: 24000 },
    { name: 'Ko\'k choy 100 g', qty: 2, sum: 18000 },
  ],
  discount: 4000,
  total: 86500,
  method: 'aralash' as const,
  cash: 50000,
  customer: 'Dilnoza Karimova',
})

const dateText = computed(() => {
  const d = r.value.date
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`
})
const card = computed(() => r.value.total - r.value.cash)
const shortName = computed(() => {
  const [first, last] = (r.value.customer ?? '').split(' ')
  return last ? `${first} ${last[0]}.` : first
})

function onShare() {
  const body = r.value.lines.map(l => `${l.name} ${l.qty}× — ${formatSom(l.sum)}`).join('\n')
  share(`Chek №${r.value.no}\n${body}\nJAMI: ${formatSom(r.value.total)} so'm`)
}
</script>

<template>
  <div class="no-scrollbar flex min-h-0 grow flex-col items-center gap-3.5 overflow-y-auto px-5 pt-7">
    <div class="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-white">
      <AppIcon name="check" :size="34" :stroke="2.5" />
    </div>
    <div class="text-center">
      <h1 class="m-0 font-display text-[26px] font-bold">Sotuv yakunlandi</h1>
      <div class="mt-1 text-sm text-muted">Chek №{{ r.no }} · {{ dateText }}</div>
    </div>

    <div class="flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface px-[18px] py-5 font-mono">
      <div class="text-center text-[15px] font-bold">[DO'KON NOMI]</div>
      <div class="text-center text-xs text-muted">Chilonzor filiali · STIR [000000000]</div>
      <div class="my-1.5 border-t border-dashed border-line" />
      <div v-for="l in r.lines" :key="l.name" class="flex justify-between gap-2 text-[13px]">
        <span>{{ l.name }}&nbsp; <span class="text-muted">{{ l.qty }}×</span></span><span>{{ formatSom(l.sum) }}</span>
      </div>
      <div v-if="r.discount" class="flex justify-between text-[13px] text-muted">
        <span>Chegirma</span><span>−{{ formatSom(r.discount) }}</span>
      </div>
      <div class="my-1.5 border-t border-dashed border-line" />
      <div class="flex justify-between text-base font-bold"><span>JAMI</span><span>{{ formatSom(r.total) }} so'm</span></div>
      <div v-if="r.cash" class="flex justify-between text-[13px]"><span>Naqd</span><span>{{ formatSom(r.cash) }}</span></div>
      <div v-if="card > 0" class="flex justify-between text-[13px]"><span>{{ r.method === 'qarz' ? 'Qarzga' : 'Karta' }}</span><span>{{ formatSom(card) }}</span></div>
      <div v-if="r.customer" class="flex justify-between text-[13px]"><span>Mijoz</span><span>{{ shortName }}</span></div>
      <div class="mt-2 text-center text-xs text-muted">Xaridingiz uchun rahmat!</div>
    </div>
  </div>

  <div class="pb-safe flex shrink-0 flex-col gap-2.5 px-5 pt-4 pb-6">
    <div class="flex gap-2.5">
      <AppButton variant="secondary" icon="printer">Chop etish</AppButton>
      <AppButton variant="secondary" icon="share" @click="onShare">Ulashish</AppButton>
    </div>
    <div class="flex">
      <AppButton to="/" icon="plus">Yangi sotuv</AppButton>
    </div>
  </div>
</template>
