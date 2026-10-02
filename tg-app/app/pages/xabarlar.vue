<script setup lang="ts">
definePageMeta({ tab: true })

const { selection } = useTelegram()

const tabs = ['Hammasi', 'Firmalar', 'Mijozlar'] as const
const tab = ref<typeof tabs[number]>('Hammasi')
const query = ref('')

const chats = ref([
  { id: 1, initials: 'BS', bg: '#F1E6D2', fg: '#7A4E12', name: 'Baraka Savdo MChJ', time: '14:05', text: 'Buyurtmangiz ertaga 10:00 da yetkaziladi', unread: 2, firm: true },
  { id: 2, initials: 'OS', bg: '#E4ECF7', fg: '#274C85', name: 'Oq Suv Sut MChJ', time: '12:40', text: 'Nakladnoy №1182 yuborildi', unread: 1, firm: true },
  { id: 3, initials: 'DK', bg: '#E6EBFA', fg: '#2849A8', name: 'Dilnoza Karimova', time: '11:12', text: "Qarzni shanba kuni to'layman", unread: 0, firm: false },
  { id: 4, initials: '47', bg: '#E2F0EA', fg: '#0E6A4E', name: '47-maktab oshxonasi', time: 'Kecha', text: "Oktabr uchun ro'yxatni jo'natdik", unread: 0, firm: false },
  { id: 5, initials: 'AR', bg: '#E6EBFA', fg: '#2849A8', name: 'Akmal Rahimov', time: 'Du', text: 'Rahmat!', unread: 0, firm: false },
])

const unread = computed(() => chats.value.reduce((s, c) => s + c.unread, 0))
const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return chats.value
    .filter(c => tab.value === 'Hammasi' || c.firm === (tab.value === 'Firmalar'))
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.text.toLowerCase().includes(q))
})

function open(c: { unread: number }) {
  c.unread = 0
  selection()
}
</script>

<template>
  <ScreenHeader title="Xabarlar" :subtitle="`${unread} ta o'qilmagan`" back="/profil" />

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

  <div class="flex shrink-0 gap-2.5 px-5 pb-3">
    <SearchField v-model="query" placeholder="Suhbatlarni qidirish" />
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-5">
    <NuxtLink to="/onlayn" class="flex items-center gap-3 rounded-2xl bg-info-soft px-3.5 py-3 text-info">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
        <AppIcon name="globe" />
      </span>
      <span class="grow">
        <span class="block text-sm font-bold">2 ta yangi onlayn buyurtma</span>
        <span class="block text-xs">Qabul qilishni kutmoqda</span>
      </span>
      <AppIcon name="chevron-right" :size="18" />
    </NuxtLink>

    <div class="rounded-[18px] border border-line bg-surface px-3.5">
      <button
        v-for="c in visible" :key="c.id" type="button"
        class="flex w-full items-center gap-3 border-b border-line py-3 text-left text-ink last:border-b-0"
        @click="open(c)"
      >
        <LetterTile :text="c.initials" :bg="c.bg" :fg="c.fg" :size="48" :radius="24" :font-size="15" />
        <div class="min-w-0 grow">
          <div class="flex justify-between gap-2">
            <span class="text-[15px]" :class="c.unread ? 'font-bold' : 'font-semibold'">{{ c.name }}</span>
            <span class="text-xs" :class="c.unread ? 'text-brand' : 'text-muted'">{{ c.time }}</span>
          </div>
          <div class="mt-[3px] flex justify-between gap-2">
            <span class="truncate text-[13px]" :class="c.unread ? 'text-ink' : 'text-muted'">{{ c.text }}</span>
            <span
              v-if="c.unread"
              class="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[10px] bg-brand px-1.5 text-[11px] font-bold text-white"
            >{{ c.unread }}</span>
          </div>
        </div>
      </button>
      <p v-if="!visible.length" class="py-8 text-center text-sm text-muted">Hech narsa topilmadi</p>
    </div>
  </div>
</template>
