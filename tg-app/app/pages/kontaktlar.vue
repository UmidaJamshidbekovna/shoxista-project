<script setup lang="ts">
definePageMeta({ tab: true })

const { selection } = useTelegram()
const NuxtLink = resolveComponent('NuxtLink')

type Kind = 'Mijoz' | 'Firma' | 'Tashkilot'
interface Contact {
  initials: string
  name: string
  kind: Kind
  note?: string
  /** >0 — bizga qarz, <0 — bizning qarz */
  debt: number
  tile: { bg: string, fg: string }
  to?: string
}

const contacts: Contact[] = [
  { initials: 'DK', name: 'Dilnoza Karimova', kind: 'Mijoz', note: '+998 90 *** 12 34', debt: 120000, tile: { bg: '#E6EBFA', fg: '#2849A8' } },
  { initials: 'BS', name: 'Baraka Savdo MChJ', kind: 'Firma', note: 'Oziq-ovqat', debt: -4200000, tile: { bg: '#F1E6D2', fg: '#7A4E12' }, to: '/firma' },
  { initials: 'AR', name: 'Akmal Rahimov', kind: 'Mijoz', note: 'Doimiy', debt: 450000, tile: { bg: '#E6EBFA', fg: '#2849A8' } },
  { initials: 'OS', name: 'Oq Suv Sut MChJ', kind: 'Firma', note: 'Sut mahsulotlari', debt: -877000, tile: { bg: '#E4ECF7', fg: '#274C85' }, to: '/firma' },
  { initials: '47', name: '47-maktab oshxonasi', kind: 'Tashkilot', note: 'Shartnoma', debt: 1350000, tile: { bg: '#E2F0EA', fg: '#0E6A4E' } },
  { initials: 'SM', name: 'Sardor Mahmudov', kind: 'Mijoz', debt: 0, tile: { bg: '#E6EBFA', fg: '#2849A8' } },
]

const tabs = ['Hammasi', 'Mijozlar', 'Firmalar', 'Tashkilotlar']
const tabKind: Record<string, Kind | undefined> = { Mijozlar: 'Mijoz', Firmalar: 'Firma', Tashkilotlar: 'Tashkilot' }
const tab = ref(tabs[0])
const query = ref('')

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  const kind = tabKind[tab.value!]
  return contacts
    .filter(c => !kind || c.kind === kind)
    .filter(c => !q || [c.name, c.note ?? '', c.kind].some(s => s.toLowerCase().includes(q)))
})
</script>

<template>
  <ScreenHeader title="Kontaktlar">
    <IconButton icon="plus" label="Kontakt qo'shish" />
  </ScreenHeader>

  <div class="flex shrink-0 gap-2.5 px-5 pb-3">
    <div class="grow basis-0 rounded-[18px] bg-brand p-3.5 text-white">
      <div class="text-xs opacity-85">Bizga qarzdorlar</div>
      <div class="mt-1 font-display text-xl font-bold">1 920 000</div>
      <div class="text-xs opacity-85">18 ta mijoz</div>
    </div>
    <div class="grow basis-0 rounded-[18px] border border-line bg-surface p-3.5">
      <div class="text-xs text-muted">Bizning qarzimiz</div>
      <div class="mt-1 font-display text-xl font-bold text-danger">5 077 000</div>
      <div class="text-xs text-muted">4 ta firma</div>
    </div>
  </div>

  <div class="mx-5 mb-3 flex shrink-0 gap-1 rounded-[14px] bg-[#E8E5DC] p-1">
    <button
      v-for="t in tabs" :key="t" type="button"
      class="h-9 min-w-0 grow basis-0 rounded-[10px] text-sm font-semibold"
      :class="tab === t ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(23,25,30,0.12)]' : 'bg-transparent text-muted'"
      @click="tab = t; selection()"
    >
      {{ t }}
    </button>
  </div>

  <div class="flex shrink-0 gap-2.5 px-5 pb-3">
    <SearchField v-model="query" placeholder="Ism, telefon yoki firma" />
  </div>

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-5">
    <div class="rounded-[18px] border border-line bg-surface px-3.5">
      <component
        :is="c.to ? NuxtLink : 'div'" v-for="c in visible" :key="c.name" :to="c.to"
        class="flex items-center gap-3 border-b border-line py-3 text-ink last:border-b-0"
      >
        <LetterTile :text="c.initials" :bg="c.tile.bg" :fg="c.tile.fg" :radius="22" :font-size="14" />
        <div class="min-w-0 grow">
          <div class="truncate text-[15px] font-semibold">{{ c.name }}</div>
          <div class="mt-0.5 text-xs text-muted">{{ c.kind }}<template v-if="c.note"> · {{ c.note }}</template></div>
        </div>
        <span v-if="c.debt" class="flex flex-col items-end">
          <span class="text-[15px] font-bold" :class="c.debt > 0 ? 'text-brand' : 'text-danger'">{{ formatSom(Math.abs(c.debt)) }}</span>
          <span class="text-[11px] text-muted">{{ c.debt > 0 ? 'bizga qarz' : 'bizning qarz' }}</span>
        </span>
        <span v-else class="text-[13px] text-muted">Qarz yo'q</span>
      </component>
      <p v-if="!visible.length" class="py-8 text-center text-sm text-muted">Hech narsa topilmadi</p>
    </div>
  </div>
</template>
