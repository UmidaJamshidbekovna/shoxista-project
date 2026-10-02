<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

definePageMeta({ tab: true })

const {
  business, receivable, payable, activeOnlineOrders, supplierOrders, lowStock,
  unreadNotifications, unreadChats, customers, organizations, stockState,
} = useStore()
const { selection, haptic } = useTelegram()
const aiOpen = ref(false)

const owner = computed(() => business.value.owner.split(' ')[0])
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 5 ? 'Xayrli tun' : h < 11 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'
})

const debtorCount = computed(() => customers.value.filter(c => c.debt > 0).length + organizations.value.filter(o => o.balance < 0).length)
const creditorCount = computed(() => organizations.value.filter(o => o.balance > 0).length)

const services: { label: string, icon: IconName, to: string, color: string }[] = [
  { label: 'Sotish', icon: 'cart', to: '/sotish', color: '#05472a' },
  { label: 'Kirim', icon: 'download', to: '/ombor/kirim', color: '#1d5bd8' },
  { label: 'Mijozlar', icon: 'users', to: '/mijozlar', color: '#7c3aed' },
  { label: 'Ta\'minotchilar', icon: 'truck', to: '/taminotchilar', color: '#b54708' },
  { label: 'Chat', icon: 'chat', to: '/chat', color: '#0891b2' },
  { label: 'Hisobot', icon: 'chart', to: '/ombor/hisobot', color: '#0e8a5f' },
  { label: 'Kategoriyalar', icon: 'grid', to: '/ombor/kategoriyalar', color: '#db2777' },
  { label: 'Xodimlar', icon: 'user', to: '/profil/xodimlar', color: '#4a5a52' },
]

const recentSupplier = computed(() => supplierOrders.value.slice(0, 3))
const outCount = computed(() => lowStock.value.filter(p => stockState(p) === 'out').length)

function openAi() {
  haptic('medium')
  aiOpen.value = true
}
</script>

<template>
  <!-- sarlavha -->
  <header class="flex shrink-0 items-center gap-3 px-5 pt-4 pb-3">
    <NuxtLink to="/profil" class="relative shrink-0" aria-label="Profil">
      <Avatar :name="business.owner" :size="46" />
      <span class="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-app bg-[#22c483]" />
    </NuxtLink>
    <div class="min-w-0 grow">
      <p class="truncate text-[13px] font-semibold text-muted">{{ greeting }},</p>
      <h1 class="truncate text-[22px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{{ owner }} 👋</h1>
    </div>
    <RoundButton icon="chat" label="Chat" to="/chat" :badge="unreadChats || undefined" />
    <RoundButton icon="bell" label="Bildirishnomalar" to="/bildirishnomalar" :badge="unreadNotifications || undefined" />
  </header>

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-28">
    <NuxtLink to="/profil/filiallar" class="mb-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-card/80 px-3 text-[12px] font-bold text-muted-2 shadow-card">
      <AppIcon name="store" :size="14" class="text-brand" />
      {{ business.name }} · Chilonzor filiali
      <AppIcon name="chevron-down" :size="14" />
    </NuxtLink>

    <HomeRevenueCard />

    <!-- qarzlar -->
    <div class="mt-3.5 grid grid-cols-2 gap-3">
      <NuxtLink to="/mijozlar" class="card flex flex-col gap-2.5 p-4 active:scale-[0.98] transition-transform" @click="selection()">
        <div class="flex items-center justify-between">
          <span class="flex size-9 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="arrow-down" :size="18" :stroke="2.4" /></span>
          <AppIcon name="chevron-right" :size="16" class="text-muted" />
        </div>
        <div>
          <p class="text-[12px] font-bold text-muted">Mijozlar qarzi</p>
          <p class="mt-0.5 text-[17px] leading-tight font-extrabold tracking-[-0.01em] text-ink">{{ formatSom(receivable) }}</p>
          <p class="text-[11px] font-semibold text-muted">so'm · {{ debtorCount }} ta qarzdor</p>
        </div>
      </NuxtLink>
      <NuxtLink to="/mijozlar?tab=org" class="card flex flex-col gap-2.5 p-4 active:scale-[0.98] transition-transform" @click="selection()">
        <div class="flex items-center justify-between">
          <span class="flex size-9 items-center justify-center rounded-full bg-warn-soft text-warn"><AppIcon name="arrow-up" :size="18" :stroke="2.4" /></span>
          <AppIcon name="chevron-right" :size="16" class="text-muted" />
        </div>
        <div>
          <p class="text-[12px] font-bold text-muted">Bizning qarzimiz</p>
          <p class="mt-0.5 text-[17px] leading-tight font-extrabold tracking-[-0.01em] text-ink">{{ formatSom(payable) }}</p>
          <p class="text-[11px] font-semibold text-muted">so'm · {{ creditorCount }} ta tashkilot</p>
        </div>
      </NuxtLink>
    </div>

    <!-- xizmatlar -->
    <section class="mt-5">
      <SectionHead title="Xizmatlar" />
      <div class="card mt-3 grid grid-cols-4 gap-y-4 px-2 py-4">
        <NuxtLink
          v-for="s in services" :key="s.to" :to="s.to"
          class="group flex min-w-0 flex-col items-center gap-1.5 px-1"
          @click="selection()"
        >
          <span
            class="flex size-[50px] items-center justify-center rounded-[17px] transition-transform group-active:scale-90"
            :style="{ background: `${s.color}14`, color: s.color }"
          >
            <AppIcon :name="s.icon" :size="23" />
          </span>
          <span class="w-full truncate text-center text-[10.5px] font-bold tracking-[-0.01em] text-muted-2">{{ s.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- kam qolgan mahsulotlar -->
    <NuxtLink
      v-if="lowStock.length" to="/ombor"
      class="mt-3.5 flex items-center gap-3 rounded-[20px] border border-[#f9dcb4] bg-warn-soft p-4 transition-transform active:scale-[0.99]"
    >
      <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-warn shadow-card"><AppIcon name="alert" :size="21" /></span>
      <span class="min-w-0 grow">
        <span class="block truncate text-[14px] font-extrabold text-ink">{{ lowStock.length }} ta mahsulot kam qoldi</span>
        <span class="block truncate text-xs font-semibold text-warn">
          {{ outCount ? `${outCount} tasi tugagan · ` : '' }}{{ lowStock.map(p => p.name).join(', ') }}
        </span>
      </span>
      <span class="flex shrink-0 -space-x-2">
        <span v-for="p in lowStock.slice(0, 3)" :key="p.id" class="flex size-7 items-center justify-center rounded-full border-2 border-warn-soft bg-white text-[13px]">{{ p.emoji }}</span>
      </span>
    </NuxtLink>

    <!-- faol online buyurtmalar -->
    <section class="mt-5">
      <SectionHead title="Faol online buyurtmalar" to="/tarix" />
      <div class="card mt-3 px-4 py-1">
        <template v-if="activeOnlineOrders.length">
          <HomeTxRow v-for="t in activeOnlineOrders" :key="t.id" :tx="t" />
        </template>
        <EmptyState v-else icon="cart" title="Faol buyurtma yo'q" text="Yangi online buyurtmalar shu yerda ko'rinadi" />
      </div>
    </section>

    <!-- ta'minotchilarga buyurtmalar -->
    <section class="mt-5">
      <SectionHead title="Ta'minotchilarga buyurtmalar" to="/taminotchilar" action="Ta'minotchilar" />
      <div class="card mt-3 px-4 py-1">
        <template v-if="recentSupplier.length">
          <HomeTxRow v-for="t in recentSupplier" :key="t.id" :tx="t" supplier />
        </template>
        <EmptyState v-else icon="truck" title="Buyurtmalar yo'q" text="Ta'minotchiga buyurtma bering — kirim avtomatik qayd etiladi" />
      </div>
    </section>
  </div>

  <!-- suzuvchi AI robot -->
  <button
    type="button" aria-label="AI yordamchi"
    class="ai-fab absolute right-5 bottom-5 z-30 flex size-[62px] items-center justify-center rounded-full bg-[linear-gradient(145deg,#14a36f,#05472a)] text-white shadow-[0_12px_28px_rgba(5,71,42,0.4)] transition-transform active:scale-90"
    @click="openAi"
  >
    <span class="ai-ring absolute inset-0 rounded-full border-2 border-[#22c483]" />
    <AppIcon name="robot" :size="30" :stroke="1.8" />
    <span class="absolute -top-1 -right-1 flex h-5 items-center rounded-full border-2 border-white bg-[#22c483] px-1.5 text-[9px] font-extrabold">AI</span>
  </button>

  <HomeAiSheet v-model="aiOpen" />
</template>

<style scoped>
.ai-fab { animation: bob 3.2s ease-in-out infinite; }
.ai-ring { animation: ring 2.4s ease-out infinite; }
@keyframes bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
@keyframes ring { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.45); opacity: 0; } }
</style>
