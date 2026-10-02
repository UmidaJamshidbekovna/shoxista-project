<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'
import type { Notification } from '~/data/types'

const { notifications, unreadNotifications } = useStore()
const { selection } = useTelegram()
const { show } = useToast()

const TONES: Record<string, string> = {
  alert: 'bg-warn-soft text-warn',
  cart: 'bg-soft text-brand',
  wallet: 'bg-danger-soft text-danger',
  truck: 'bg-info-soft text-info',
  chat: 'bg-info-soft text-info',
}

const sorted = computed(() => [...notifications.value].sort((a, b) => b.time.localeCompare(a.time)))
const groups = computed(() => [
  { title: 'Yangi', items: sorted.value.filter(n => !n.read) },
  { title: 'Avvalgi', items: sorted.value.filter(n => n.read) },
].filter(g => g.items.length))

function open(n: Notification) {
  selection()
  n.read = true
  if (n.to) navigateTo(n.to)
}

function readAll() {
  if (!unreadNotifications.value) return
  notifications.value.forEach((n) => { n.read = true })
  show('Hammasi o\'qilgan qilindi')
}
</script>

<template>
  <PageHeader
    title="Bildirishnomalar" back="/"
    :subtitle="unreadNotifications ? `${unreadNotifications} ta o'qilmagan` : 'Barchasi o\'qilgan'"
  />

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-6">
    <button
      v-if="unreadNotifications" type="button"
      class="mb-4 flex h-10 items-center gap-1.5 rounded-full bg-card px-4 text-[13px] font-extrabold text-brand shadow-card active:scale-95 transition-transform"
      @click="readAll"
    >
      <AppIcon name="check" :size="16" :stroke="2.6" /> Hammasini o'qilgan qilish
    </button>

    <EmptyState v-if="!groups.length" icon="bell" title="Bildirishnomalar yo'q" text="Yangi buyurtma, qarz va ombor ogohlantirishlari shu yerda chiqadi" />

    <section v-for="g in groups" :key="g.title" class="mb-5">
      <div class="mb-2.5 flex items-center gap-2">
        <h2 class="text-base font-extrabold text-ink">{{ g.title }}</h2>
        <span v-if="g.title === 'Yangi'" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">{{ g.items.length }}</span>
      </div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="n in g.items" :key="n.id" type="button"
          class="card relative flex w-full items-start gap-3 p-4 text-left transition-transform active:scale-[0.99]"
          :class="!n.read && 'ring-1 ring-soft'"
          @click="open(n)"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-full" :class="TONES[n.icon] ?? 'bg-soft text-brand'">
            <AppIcon :name="n.icon as IconName" :size="20" />
          </span>
          <span class="min-w-0 grow">
            <span class="flex items-start gap-2">
              <span class="grow text-[15px] leading-snug" :class="n.read ? 'font-bold text-ink' : 'font-extrabold text-ink'">{{ n.title }}</span>
              <span class="shrink-0 pt-0.5 text-[11px] font-bold text-muted">{{ formatDay(n.time) === 'Bugun' ? formatTime(n.time) : formatDay(n.time) }}</span>
            </span>
            <span class="mt-0.5 block text-[13px] leading-snug font-medium" :class="n.read ? 'text-muted' : 'text-muted-2'">{{ n.text }}</span>
            <span v-if="n.to" class="mt-2 inline-flex items-center gap-0.5 text-[12px] font-extrabold text-brand">
              Ochish <AppIcon name="chevron-right" :size="14" :stroke="2.6" />
            </span>
          </span>
          <span v-if="!n.read" class="absolute top-4 left-4 size-2.5 rounded-full border-2 border-card bg-danger" />
        </button>
      </div>
    </section>
  </div>
</template>
