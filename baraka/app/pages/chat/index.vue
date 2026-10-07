<script setup lang="ts">
import { channelLabel } from '~/data/labels'

const { chats, unreadChats } = useStore()
const filter = useState('chat-filter', () => 'all')
const query = ref('')
const aiId = computed(() => chats.value.find(c => c.kind === 'ai')?.id ?? '')

const kindLabel = { customer: 'Mijoz', org: 'Firma', ai: 'AI yordamchi', support: 'Tizim yordami' } as const
const opts = computed(() => {
  const n = (k?: string) => chats.value.filter(c => !k || c.kind === k).reduce((s, c) => s + c.unread, 0)
  const lbl = (l: string, k?: string) => (n(k) ? `${l} · ${n(k)}` : l)
  return [
    { value: 'all', label: lbl('Hammasi') },
    { value: 'customer', label: lbl('Mijozlar', 'customer') },
    { value: 'org', label: lbl('Firmalar', 'org') },
    { value: 'ai', label: 'AI yordamchi' },
    { value: 'support', label: lbl('Tizim yordami', 'support') },
  ]
})

const lastOf = (c: (typeof chats.value)[number]) => c.messages[c.messages.length - 1]
/** "Baraka AI yordamchi" — ro'yxat tepasida alohida yashil karta */
const aiThread = computed(() => chats.value.find(c => c.kind === 'ai'))
const showAiCard = computed(() => !!aiThread.value && !query.value.trim() && (filter.value === 'all' || filter.value === 'ai'))
const list = computed(() => {
  const q = query.value.trim().toLowerCase()
  return chats.value
    .filter(c => !(showAiCard.value && c.kind === 'ai'))
    .filter(c => filter.value === 'all' || c.kind === filter.value)
    .filter(c => !q || c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q)))
    .sort((a, b) => (lastOf(b)?.time ?? '').localeCompare(lastOf(a)?.time ?? ''))
})

function timeLabel(iso?: string) {
  if (!iso) return ''
  const d = formatDay(iso)
  return d === 'Bugun' ? formatTime(iso) : d
}
function preview(c: (typeof chats.value)[number]) {
  const m = lastOf(c)
  if (!m) return ''
  return (m.from === 'me' ? 'Siz: ' : '') + m.text
}
</script>

<template>
  <PageHeader title="Chat" :subtitle="unreadChats ? `${unreadChats} ta o'qilmagan xabar` : 'Yagona inbox'" back>
    <RoundButton icon="robot" label="AI yordamchi" :to="`/chat/${aiId}`" />
  </PageHeader>

  <div class="flex shrink-0 flex-col gap-3 pb-3">
    <div class="px-5">
      <BInput v-model="query" icon="search" inputmode="search" placeholder="Ism yoki xabar bo'yicha qidirish" />
    </div>
    <div class="px-5"><Chips v-model="filter" :options="opts" /></div>
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-6">
    <NuxtLink
      v-if="showAiCard && aiThread" :to="`/chat/${aiThread.id}`"
      class="flex items-center gap-3 rounded-[20px] bg-brand px-4 py-3.5 text-white shadow-float transition-transform active:scale-[0.99]"
    >
      <img src="/assets/ai-robot-head.png" alt="" class="h-10 w-[52px] shrink-0 object-contain">
      <span class="min-w-0 grow">
        <span class="flex items-center gap-2">
          <span class="truncate text-[15px] font-extrabold">{{ aiThread.title }}</span>
          <span class="ml-auto shrink-0 text-[11px] font-semibold text-white/70">{{ timeLabel(lastOf(aiThread)?.time) }}</span>
        </span>
        <span class="mt-0.5 block truncate text-[13px] font-medium text-white/80">{{ preview(aiThread) }}</span>
      </span>
    </NuxtLink>
    <EmptyState v-if="!list.length && !showAiCard" icon="chat" title="Suhbat topilmadi" text="Boshqa filtr yoki so'zni sinab ko'ring" />
    <div v-else-if="list.length" class="card divide-y divide-line overflow-hidden">
      <NuxtLink v-for="c in list" :key="c.id" :to="`/chat/${c.id}`" class="flex items-center gap-3 px-4 py-3.5 active:bg-field">
        <ChatThreadAvatar :thread="c" />
        <span class="min-w-0 grow">
          <span class="flex items-center gap-2">
            <span class="truncate text-[15px] font-bold" :class="c.unread ? 'text-ink' : 'text-ink-2'">{{ c.title }}</span>
            <span class="ml-auto shrink-0 text-[11px] font-semibold" :class="c.unread ? 'text-brand' : 'text-muted'">{{ timeLabel(lastOf(c)?.time) }}</span>
          </span>
          <span class="mt-0.5 flex items-center gap-2">
            <span class="truncate text-[13px]" :class="c.unread ? 'font-bold text-muted-2' : 'font-medium text-muted'">{{ preview(c) }}</span>
            <span v-if="c.unread" class="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-extrabold text-white">{{ c.unread }}</span>
          </span>
          <span class="mt-1 block text-[11px] font-bold text-muted">
            {{ kindLabel[c.kind] }}<template v-if="c.kind === 'customer' || c.kind === 'org'"> · {{ channelLabel[c.channel] }}</template>
          </span>
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
