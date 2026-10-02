<script setup lang="ts">
definePageMeta({ tab: true })

const { share, selection, haptic, notify } = useTelegram()

type Status = 'new' | 'progress' | 'done' | 'rejected'
type Tab = 'new' | 'progress' | 'done'

const storeOpen = ref(true)

const orders = ref<{ no: string, who: string, items: string, total: number, status: Status, outOfStock?: boolean }[]>([
  { no: 'O-2231', who: 'Malika T. · Yetkazib berish · 15:30 gacha', items: 'Sut 2.5% 1 L × 2, Non patir × 4, Tuxum 10 dona × 1', total: 65000, status: 'new', outOfStock: true },
  { no: 'O-2230', who: 'Jasur N. · Olib ketish', items: "Guruch lazer 1 kg × 5, Paxta yog'i 1 L × 2", total: 138000, status: 'new' },
  { no: 'O-2229', who: 'Dilnoza K. · Yetkazib berish · 14:00 gacha', items: "Ko'k choy 100 g × 2, Shakar 1 kg × 3", total: 57000, status: 'progress' },
  { no: 'O-2228', who: 'Bekzod A. · Olib ketish', items: 'Non patir × 6, Sut 2.5% 1 L × 3', total: 73500, status: 'progress' },
  { no: 'O-2227', who: 'Nodira S. · Yetkazib berish · 13:30 gacha', items: 'Guruch lazer 1 kg × 2, Tuxum 10 dona × 2', total: 68000, status: 'progress' },
  { no: 'O-2226', who: 'Sardor M. · Olib ketish', items: "Paxta yog'i 1 L × 1, Non patir × 2", total: 36000, status: 'done' },
])

const tab = ref<Tab>('new')
const count = (s: Status) => orders.value.filter(o => o.status === s).length
const tabs = computed(() => [
  { key: 'new' as const, label: `Yangi · ${count('new')}` },
  { key: 'progress' as const, label: `Jarayonda · ${count('progress')}` },
  { key: 'done' as const, label: 'Yakunlangan' },
])
const visible = computed(() => orders.value.filter(o =>
  tab.value === 'done' ? o.status === 'done' || o.status === 'rejected' : o.status === tab.value))

const statusTag = {
  new: { tone: 'info', text: 'Yangi' },
  progress: { tone: 'warn', text: 'Jarayonda' },
  done: { tone: 'brand', text: 'Yakunlangan' },
  rejected: { tone: 'danger', text: 'Rad etilgan' },
} as const

function setStatus(o: (typeof orders.value)[number], s: Status) {
  o.status = s
  if (s === 'rejected') notify('warning')
  else notify('success')
}
function pick(t: Tab) {
  tab.value = t
  selection()
}
function onToggle() {
  haptic('medium')
}
</script>

<template>
  <ScreenHeader title="Onlayn do'kon" back="/profil">
    <IconButton icon="share" label="Do'kon havolasini ulashish" @click="share(`[DO'KON NOMI] — onlayn do'kon`)" />
  </ScreenHeader>

  <div class="flex shrink-0 flex-col gap-3 px-5 pb-3">
    <label class="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft text-brand">
        <AppIcon name="store" :size="22" />
      </span>
      <span class="grow">
        <span class="block text-[15px] font-bold">{{ storeOpen ? "Do'kon ochiq" : "Do'kon yopiq" }}</span>
        <span class="block text-xs text-muted">236 / 248 mahsulot mijoz ilovasida · qoldiq avtomatik</span>
      </span>
      <input v-model="storeOpen" type="checkbox" aria-label="Onlayn do'kon yoqilgan" class="size-[22px] shrink-0 accent-brand" @change="onToggle">
    </label>

    <div class="flex gap-1 rounded-[14px] bg-[#E8E5DC] p-1">
      <button
        v-for="t in tabs" :key="t.key" type="button"
        class="h-9 grow basis-0 rounded-[10px] text-sm font-semibold"
        :class="tab === t.key ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(23,25,30,0.12)]' : 'text-muted'"
        @click="pick(t.key)"
      >
        {{ t.label }}
      </button>
    </div>
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-5">
    <div v-for="o in visible" :key="o.no" class="rounded-[18px] border border-line bg-surface p-3.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[15px] font-bold">Buyurtma №{{ o.no }}</span>
        <Tag :tone="statusTag[o.status].tone">{{ statusTag[o.status].text }}</Tag>
      </div>
      <div class="mt-1 text-[13px] text-muted">{{ o.who }}</div>
      <div class="mt-2 text-[13px] leading-[1.4]">{{ o.items }}</div>
      <div class="mt-2 flex justify-between text-sm">
        <span class="text-muted">Jami</span><span class="font-bold">{{ formatSom(o.total) }} so'm</span>
      </div>
      <div v-if="o.status === 'new'" class="mt-3 flex gap-2">
        <button type="button" class="h-11 grow basis-0 rounded-xl border border-line bg-surface text-sm font-semibold text-danger" @click="setStatus(o, 'rejected')">
          Rad etish
        </button>
        <button type="button" class="h-11 grow-[2] basis-0 rounded-xl bg-brand text-sm font-bold text-white" @click="setStatus(o, 'progress')">
          Qabul qilish
        </button>
      </div>
      <div v-else-if="o.status === 'progress'" class="mt-3 flex">
        <button type="button" class="h-11 grow rounded-xl bg-brand text-sm font-bold text-white" @click="setStatus(o, 'done')">
          Yakunlash
        </button>
      </div>
    </div>

    <p v-if="!visible.length" class="py-10 text-center text-sm text-muted">Buyurtmalar yo'q</p>

    <div
      v-if="tab === 'new' && visible.some(o => o.outOfStock)"
      class="flex items-center gap-2.5 rounded-[14px] bg-warn-soft px-3.5 py-3 text-[13px] leading-[1.4] text-warn"
    >
      <AppIcon name="alert" class="shrink-0" />
      <span>Tuxum omborda tugagan — buyurtmani qisman qabul qilish mumkin.</span>
    </div>
  </div>
</template>
