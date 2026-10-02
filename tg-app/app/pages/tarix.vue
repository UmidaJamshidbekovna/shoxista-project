<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

definePageMeta({ tab: true })

const { selection } = useTelegram()

const tabs = ['Sotuvlar', 'Kirimlar', 'Qaytarishlar'] as const
const tab = ref<typeof tabs[number]>('Sotuvlar')
const period = ref('Bugun')
const periods = ['Bugun', 'Kecha', 'Hafta', 'Oy', 'Kassir: hammasi']

type Kind = 'sale' | 'kirim' | 'return'
type Row = { id: string, kind: Kind, title: string, meta: string, amount: number, icon: IconName, tone: 'brand' | 'danger' | 'warn' | 'info' }

const groups: { title: string, summary: string, rows: Row[] }[] = [
  {
    title: 'Bugun · 23 sentabr',
    summary: '64 chek · 3 842 500',
    rows: [
      { id: '004817', kind: 'sale', title: 'Chek №004817', meta: '14:32 · Aralash · Dilnoza K.', amount: 86500, icon: 'percent', tone: 'brand' },
      { id: '004816', kind: 'sale', title: 'Chek №004816', meta: '14:18 · Naqd', amount: 23000, icon: 'cash', tone: 'brand' },
      { id: 'R-0091', kind: 'return', title: 'Qaytarish №R-0091', meta: '13:55 · Tuxum, 10 dona · Chek №004802', amount: -16000, icon: 'undo', tone: 'danger' },
      { id: '004815', kind: 'sale', title: 'Chek №004815', meta: '13:47 · Karta', amount: 142000, icon: 'card', tone: 'brand' },
      { id: '004814', kind: 'sale', title: 'Chek №004814', meta: '13:30 · Qarzga · Akmal R.', amount: 58500, icon: 'dollar', tone: 'warn' },
    ],
  },
  {
    title: 'Kecha · 22 sentabr',
    summary: '71 chek · 4 115 000',
    rows: [
      { id: '004753', kind: 'sale', title: 'Chek №004753', meta: '21:04 · Naqd', amount: 37500, icon: 'cash', tone: 'brand' },
      { id: '1174', kind: 'kirim', title: 'Kirim №1174', meta: '18:20 · Baraka Savdo MChJ', amount: 2850000, icon: 'truck', tone: 'info' },
    ],
  },
]

const tileClass = { brand: 'bg-brand-soft text-brand', danger: 'bg-danger-soft text-danger', warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info' }
const amountClass = { brand: 'text-ink', danger: 'text-danger', warn: 'text-warn', info: 'text-info' }

// "Sotuvlar" — umumiy lenta (dizayndagidek), qolganlari turi bo'yicha filtr
const visible = computed(() => groups
  .map(g => ({ ...g, rows: g.rows.filter(r => tab.value === 'Sotuvlar' || r.kind === (tab.value === 'Kirimlar' ? 'kirim' : 'return')) }))
  .filter(g => g.rows.length))

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <ScreenHeader title="Tarix" back="/profil">
    <IconButton icon="clock" label="Sana tanlash" @click="selection()" />
  </ScreenHeader>

  <div class="mx-5 mb-3 flex shrink-0 gap-1 rounded-[14px] bg-[#E8E5DC] p-1">
    <button
      v-for="t in tabs" :key="t" type="button"
      class="h-9 grow basis-0 rounded-[10px] text-sm font-semibold"
      :class="tab === t ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(23,25,30,0.12)]' : 'bg-transparent text-muted'"
      @click="tab = t; selection()"
    >
      {{ t }}
    </button>
  </div>

  <FilterChips v-model="period" :options="periods" class="pb-3" />

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-2.5 overflow-y-auto px-5 pb-5">
    <template v-for="g in visible" :key="g.title">
      <SectionTitle>
        {{ g.title }}
        <template #action><span class="text-[13px] font-bold">{{ g.summary }}</span></template>
      </SectionTitle>
      <div class="rounded-[18px] border border-line bg-surface px-3.5">
        <component
          :is="r.kind === 'sale' ? NuxtLink : 'div'"
          v-for="r in g.rows" :key="r.id" :to="r.kind === 'sale' ? '/chek' : undefined"
          class="flex items-center gap-3 border-b border-line py-[11px] text-ink last:border-b-0"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="tileClass[r.tone]">
            <AppIcon :name="r.icon" :size="18" />
          </span>
          <div class="min-w-0 grow">
            <div class="text-[15px] font-semibold">{{ r.title }}</div>
            <div class="mt-0.5 truncate text-xs text-muted">{{ r.meta }}</div>
          </div>
          <div class="text-[15px] font-bold" :class="amountClass[r.tone]">
            {{ r.amount < 0 ? '−' : '' }}{{ formatSom(Math.abs(r.amount)) }}
          </div>
        </component>
      </div>
    </template>
    <p v-if="!visible.length" class="py-8 text-center text-sm text-muted">Hech narsa topilmadi</p>
  </div>
</template>
