<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'
import type { OrderStatus } from '~/data/types'

definePageMeta({ tab: true })

const {
  business, branchById, currentBranchId, receivable, payable, transactions,
  unreadNotifications, unreadChats,
} = useStore()
const { dir: histDir, hf, hfDraft } = useHistFilters()
const { selection, haptic } = useTelegram()
const { show } = useToast()

const owner = computed(() => business.value.owner.split(' ')[0])
const branch = computed(() => branchById(currentBranchId.value)?.name ?? '')

/** Aktiv buyurtmalar: hali yetkazilmagan (§5, §6) */
const ACTIVE: OrderStatus[] = ['pending', 'processing', 'shipping']
const customerOrders = computed(() => transactions.value.filter(t => t.kind === 'sale' && ACTIVE.includes(t.status)))
const supplierActive = computed(() => transactions.value.filter(t => t.kind === 'purchase' && ACTIVE.includes(t.status)))

/** Qarz kartasi → Tarix: "Mijoz qarzi" → Sotuvlar, "Bizning qarz" → Xaridlar; to'lov holati "Qarz" (Stock and History.md §III) */
function openDebts(k: 'sale' | 'purchase') {
  histDir.value = k === 'sale' ? 'out' : 'in'
  hf.value = { ...emptyHistFilters(), pay: 'Qarz' }
  hfDraft.value = { ...hf.value }
  haptic('light')
  navigateTo('/tarix')
}

const services: { label: string, icon: IconName, to?: string }[] = [
  { label: 'Mijozlar', icon: 'users', to: '/mijozlar' },
  { label: 'Tashkilotlar', icon: 'building', to: '/mijozlar?tab=org' },
  { label: 'Kategoriya', icon: 'grid', to: '/ombor/kategoriyalar' },
  { label: 'Hisobot', icon: 'chart', to: '/ombor/hisobot' },
  { label: 'Barchasi', icon: 'apps' },
]

function openService(s: { to?: string }) {
  if (s.to) return selection()
  show('Barcha xizmatlar ro\'yxati tayyorlanmoqda', 'info')
}
</script>

<template>
  <div class="no-scrollbar grid min-h-0 grow auto-rows-min content-start grid-cols-[minmax(0,1fr)] gap-[22px] overflow-y-auto px-5 pt-4 pb-[124px]">
    <!-- 1. Sarlavha -->
    <header class="flex items-center gap-3">
      <div class="min-w-0 grow">
        <h1 class="truncate text-[25px] leading-tight font-extrabold tracking-[-0.02em] text-ink">Salom, {{ owner }}!</h1>
        <p class="mt-[3px] truncate text-[13px] font-semibold text-muted">{{ business.name }} · {{ branch }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <RoundButton icon="bell" label="Bildirishnomalar" to="/bildirishnomalar" :stroke="1.8" :dot="unreadNotifications > 0" />
        <RoundButton icon="chat" label="Chat" to="/chat" :stroke="1.8" :badge="unreadChats || undefined" badge-tone="brand" />
      </div>
    </header>

    <!-- 2. Savdo kartasi -->
    <HomeRevenueCard />

    <!-- 3. Qarz kartalari -->
    <div class="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-[18px] bg-card py-2.5 pr-2 pl-2.5 text-left shadow-card transition-transform active:scale-[0.98]"
        @click="openDebts('sale')"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft text-brand"><AppIcon name="coins" :size="18" :stroke="2" /></span>
        <span class="min-w-0">
          <span class="block truncate text-[14px] font-bold text-muted">Mijoz qarzi</span>
          <span class="block truncate text-[16px] font-extrabold text-brand">{{ formatSom(receivable) }}</span>
        </span>
      </button>
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-[18px] bg-card py-2.5 pr-2 pl-2.5 text-left shadow-card transition-transform active:scale-[0.98]"
        @click="openDebts('purchase')"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f4f1] text-[#0f766e]"><AppIcon name="undo" :size="18" :stroke="2" /></span>
        <span class="min-w-0">
          <span class="block truncate text-[14px] font-bold text-muted">Bizning qarz</span>
          <span class="block truncate text-[16px] font-extrabold text-[#0f766e]">{{ formatSom(payable) }}</span>
        </span>
      </button>
    </div>

    <!-- 4. Mijoz buyurtmalari (bo'sh bo'lsa ko'rsatilmaydi) -->
    <HomeOrderRail
      v-if="customerOrders.length"
      title="Mijoz buyurtmalari" :items="customerOrders" all-to="/tarix?dir=out"
      empty-icon="cart" empty-title="Hozircha aktiv buyurtma yo'q"
      empty-text="Yangi buyurtma kelganda shu yerda ko'rinadi"
    />

    <!-- 5. Ta'minotchilarga buyurtmalar (bo'sh bo'lsa ko'rsatilmaydi) -->
    <HomeOrderRail
      v-if="supplierActive.length"
      title="Ta'minotchilarga buyurtmalar" :items="supplierActive" all-to="/tarix?dir=in" new-card
      empty-icon="truck" empty-title="Ta'minotchilarga aktiv buyurtma yo'q"
      empty-text="Coca-Cola, non yoki sut ta'minotchisiga ilovadan buyurtma bering"
      @new="navigateTo('/taminotchilar')"
    />

    <!-- 6. Xizmatlar -->
    <section class="flex flex-col gap-3">
      <h2 class="text-base font-extrabold text-ink">Xizmatlar</h2>
      <div class="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5">
        <component
          :is="s.to ? 'NuxtLink' : 'button'"
          v-for="s in services" :key="s.label" :to="s.to" :type="s.to ? undefined : 'button'"
          class="group flex w-[68px] shrink-0 flex-col items-center gap-1.5"
          @click="openService(s)"
        >
          <span class="flex size-[60px] items-center justify-center rounded-full bg-card text-brand shadow-card transition-transform duration-150 group-active:scale-[0.94]">
            <AppIcon :name="s.icon" :size="22" :stroke="1.8" />
          </span>
          <span class="w-full truncate text-center text-[11.5px] font-semibold text-muted-2">{{ s.label }}</span>
        </component>
      </div>
    </section>
  </div>

  <!-- AI robot: chetdan mo'ralaydi, bosilganda mini oyna -->
  <HomeAiRobot />
</template>
