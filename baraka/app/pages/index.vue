<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'
import type { OrderStatus } from '~/data/types'

definePageMeta({ tab: true })

const {
  business, branchById, currentBranchId, receivable, payable, transactions,
  unreadNotifications, unreadChats,
} = useStore()
const { filters, kind } = useHistFilters()
const { selection, haptic } = useTelegram()
const { show } = useToast()
const aiOpen = ref(false)

const owner = computed(() => business.value.owner.split(' ')[0])
const branch = computed(() => branchById(currentBranchId.value)?.name ?? '')

/** Aktiv buyurtmalar: hali yetkazilmagan (§5, §6) */
const ACTIVE: OrderStatus[] = ['pending', 'processing', 'shipping']
const customerOrders = computed(() => transactions.value.filter(t => t.kind === 'sale' && ACTIVE.includes(t.status)))
const supplierActive = computed(() => transactions.value.filter(t => t.kind === 'purchase' && ACTIVE.includes(t.status)))

/** Qarz kartasi → Tarix, qarzdorlik filtri bilan (§4) */
function openDebts(k: 'sale' | 'purchase') {
  kind.value = k
  filters.value = { ...emptyHistFilters(), payStatuses: ['unpaid', 'partial'] }
  haptic('light')
  navigateTo('/tarix')
}

const services: { label: string, icon: IconName, to?: string }[] = [
  { label: 'Mijozlar', icon: 'users', to: '/mijozlar' },
  { label: 'Tashkilotlar', icon: 'building', to: '/mijozlar?tab=org' },
  { label: 'Kategoriya', icon: 'grid', to: '/ombor/kategoriyalar' },
  { label: 'Hisobot', icon: 'chart', to: '/ombor/hisobot' },
  { label: 'Barchasi', icon: 'more' },
]

function openService(s: { to?: string }) {
  if (s.to) return selection()
  show('Barcha xizmatlar ro\'yxati tayyorlanmoqda', 'info')
}

// --- suzuvchi AI robot: vertikal sudrash, joyi localStorage'da (§8) ---
const ROBOT_KEY = 'sm_robotY'
const robot = ref<HTMLElement>()
const robotY = ref(420)
const dragging = ref(false)
let startY = 0
let startTop = 0
let moved = 0

function clampY(v: number) {
  const h = robot.value?.parentElement?.clientHeight ?? 844
  return Math.max(60, Math.min(Math.min(600, h - 170), v))
}

onMounted(() => {
  const saved = Number(localStorage.getItem(ROBOT_KEY))
  robotY.value = clampY(saved || 520)
})

function onDown(e: PointerEvent) {
  dragging.value = true
  startY = e.clientY
  startTop = robotY.value
  moved = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!dragging.value) return
  const dy = e.clientY - startY
  moved = Math.max(moved, Math.abs(dy))
  robotY.value = clampY(startTop + dy)
}

function onUp() {
  if (!dragging.value) return
  dragging.value = false
  try { localStorage.setItem(ROBOT_KEY, String(robotY.value)) }
  catch {}
  // 5px dan kam siljigan bo'lsa — bosish deb hisoblanadi
  if (moved < 5) {
    haptic('medium')
    aiOpen.value = true
  }
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
        <RoundButton icon="bell" label="Bildirishnomalar" to="/bildirishnomalar" :dot="unreadNotifications > 0" />
        <RoundButton icon="chat" label="Chat" to="/chat" :badge="unreadChats || undefined" badge-tone="brand" />
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
        <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft text-brand"><AppIcon name="arrow-down" :size="18" :stroke="2.4" /></span>
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
        <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f4f1] text-[#0f766e]"><AppIcon name="arrow-up" :size="18" :stroke="2.4" /></span>
        <span class="min-w-0">
          <span class="block truncate text-[14px] font-bold text-muted">Bizning qarz</span>
          <span class="block truncate text-[16px] font-extrabold text-[#0f766e]">{{ formatSom(payable) }}</span>
        </span>
      </button>
    </div>

    <!-- 4. Mijoz buyurtmalari -->
    <HomeOrderRail
      title="Mijoz buyurtmalari" :items="customerOrders" all-to="/tarix"
      empty-icon="cart" empty-title="Hozircha aktiv buyurtma yo'q"
      empty-text="Yangi buyurtma kelganda shu yerda ko'rinadi"
    />

    <!-- 5. Ta'minotchilarga buyurtmalar -->
    <HomeOrderRail
      title="Ta'minotchilarga buyurtmalar" :items="supplierActive" all-to="/tarix" new-card
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
          <span class="flex size-[60px] items-center justify-center rounded-full bg-card text-brand shadow-card transition-transform group-active:scale-[0.94]">
            <AppIcon :name="s.icon" :size="22" />
          </span>
          <span class="w-full truncate text-center text-[11.5px] font-semibold text-muted-2">{{ s.label }}</span>
        </component>
      </div>
    </section>
  </div>

  <!-- suzuvchi AI robot (vertikal sudraladi) -->
  <button
    ref="robot" type="button" aria-label="AI yordamchi"
    class="absolute right-5 z-30 flex size-[62px] touch-none items-center justify-center rounded-full bg-[linear-gradient(145deg,#14a36f,#05472a)] text-white shadow-[0_12px_28px_rgba(5,71,42,0.4)]"
    :class="dragging ? 'scale-105 cursor-grabbing' : 'ai-fab cursor-grab transition-transform active:scale-90'"
    :style="{ top: `${robotY}px` }"
    @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
  >
    <span v-if="!dragging" class="ai-ring absolute inset-0 rounded-full border-2 border-[#22c483]" />
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
