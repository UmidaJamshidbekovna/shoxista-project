<script setup lang="ts">
// Tarix: Buyurtma tafsilotlari sheet (Stock and History.md §II.8)
import type { IconName } from '~/components/AppIcon.vue'
import type { OrderStatus } from '~/data/types'
import { channelIcon, methodLabel, statusLabel } from '~/data/labels'

const props = defineProps<{ txId?: string }>()
const open = defineModel<boolean>({ default: false })

const { txById, productById, chats } = useStore()
const { amount, money } = useMoney()
const { cancelOrder, returnOrder, describeReversal } = useLedger()
const party = useTxParty()
const { show } = useToast()
const { haptic } = useTelegram()

const tx = computed(() => props.txId ? txById(props.txId) : undefined)
const name = computed(() => tx.value ? party(tx.value) : '')
const isSale = computed(() => tx.value?.kind === 'sale')
const ch = computed(() => HIST_CHANNEL[tx.value?.channel ?? 'offline'])
const logo = computed(() => histSupplierColors(name.value))
const st = computed(() => HIST_STATUS[tx.value?.status ?? 'pending'])
const pay = computed(() => HIST_PAY[tx.value?.payStatus ?? 'paid'])
const remaining = computed(() => tx.value ? Math.max(0, tx.value.total - tx.value.paid) : 0)

/** Bog'langan chat (mijoz yoki tashkilot bilan) */
const chat = computed(() => {
  const ref = tx.value?.customerId ?? tx.value?.orgId
  return ref ? chats.value.find(c => c.refId === ref) : undefined
})

/** Holat oqimi: Kutilmoqda → Jarayonda → Yo'lda → Yetkazildi */
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus, label: string }>> = {
  pending: { to: 'processing', label: 'Qabul qilish' },
  processing: { to: 'shipping', label: 'Yo\'lga chiqarish' },
  shipping: { to: 'delivered', label: 'Yetkazildi' },
}
const primary = computed(() => tx.value ? NEXT[tx.value.status] : undefined)
const secondary = computed<'cancel' | 'return' | undefined>(() => {
  const s = tx.value?.status
  if (s === 'pending' || s === 'processing' || s === 'shipping') return 'cancel'
  if (s === 'delivered') return 'return'
  return undefined
})

const TINTS = ['#fde8e8', '#e8f0fb', '#e7f7ec', '#fff4e0', '#f1ebfe', '#e6f5fc', '#fdeaf2']
function tintOf(productId: string, label: string) {
  const p = productById(productId)
  if (p?.tint) return p.tint
  let h = 0
  for (const c of productId || label) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TINTS[h % TINTS.length]
}

function advance() {
  const t = tx.value
  const n = primary.value
  if (!t || !n) return
  t.status = n.to
  haptic('medium')
  show(`Holat: ${statusLabel[n.to]}`)
}

function openChat() {
  if (!chat.value) return
  haptic('light')
  open.value = false
  navigateTo(`/chat/${chat.value.id}`)
}

// --- Bekor qilish / Qaytarish (tasdiqlash bilan) ---
const confirmOpen = ref(false)
function ask() {
  haptic('light')
  confirmOpen.value = true
}
/** Tasdiqlash matni: qoldiq, qarz va to'langan summa bilan nima bo'lishi (ledger qoidalari bo'yicha) */
const reversalText = computed(() => tx.value ? describeReversal(tx.value) : '')
function confirmAction() {
  const t = tx.value
  const mode = secondary.value
  if (!t || !mode) return
  const restock = t.kind === 'sale' && !!t.stockApplied
  const ok = mode === 'cancel' ? cancelOrder(t) : returnOrder(t)
  confirmOpen.value = false
  if (!ok) return
  haptic('medium')
  show(mode === 'cancel' ? 'Buyurtma bekor qilindi' : restock ? 'Buyurtma qaytarildi, qoldiq tiklandi' : 'Buyurtma qaytarildi')
}
</script>

<template>
  <BSheet v-model="open" tone="card">
    <template v-if="tx">
      <!-- Header -->
      <div class="flex items-center gap-3 pt-2 pb-4">
        <span
          v-if="isSale"
          class="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]"
          :style="{ background: ch.bg, color: ch.c }"
        >
          <AppIcon :name="channelIcon[tx.channel] as IconName" :size="20" :stroke="1.9" />
        </span>
        <span
          v-else
          class="flex size-[46px] shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold"
          :style="{ background: logo.bg, color: logo.c }"
        >{{ histInitials(name) }}</span>
        <span class="min-w-0 grow">
          <span class="block truncate text-[17px] leading-[22px] font-extrabold text-ink">{{ name }}</span>
          <span class="block truncate text-[12px] font-medium text-muted">#{{ tx.no }} · {{ formatDay(tx.date) }}, {{ formatTime(tx.date) }}</span>
        </span>
        <span
          class="shrink-0 rounded-[10px] px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap"
          :style="{ background: st.bg, color: st.c }"
        >{{ statusLabel[tx.status] }}</span>
      </div>

      <!-- Info bloklar -->
      <div class="grid grid-cols-3 gap-2">
        <div class="min-w-0 rounded-[14px] bg-[#f6f7f9] px-3 py-2.5">
          <p class="text-[11px] font-semibold text-muted">Kanal</p>
          <p class="mt-0.5 truncate text-[13px] font-extrabold text-ink">{{ histChannelLabel(tx.channel) }}</p>
        </div>
        <div class="min-w-0 rounded-[14px] bg-[#f6f7f9] px-3 py-2.5">
          <p class="text-[11px] font-semibold text-muted">Turi</p>
          <p class="mt-0.5 text-[13px] leading-[17px] font-extrabold text-ink">
            {{ tx.segment === 'B2B' ? 'Korxona' : 'Shaxs' }} · {{ isSale ? 'Sotuv' : 'Xarid' }}
          </p>
        </div>
        <div class="min-w-0 rounded-[14px] bg-[#f6f7f9] px-3 py-2.5">
          <p class="text-[11px] font-semibold text-muted">To'lov</p>
          <p class="mt-0.5 truncate text-[13px] font-extrabold text-ink">{{ methodLabel[tx.method] }}</p>
        </div>
      </div>

      <!-- Tarkibi -->
      <h3 class="mt-5 mb-1 text-[14px] font-extrabold text-ink">Tarkibi · {{ tx.items.length }} ta mahsulot</h3>
      <div class="flex flex-col">
        <div v-for="(i, k) in tx.items" :key="k" class="flex items-center gap-3 py-2">
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold text-black/45"
            :style="{ background: tintOf(i.productId, i.name) }"
          >{{ histInitials(i.name) }}</span>
          <span class="min-w-0 grow">
            <span class="block truncate text-[14px] font-bold text-ink">{{ i.name }}</span>
            <span class="block text-[12px] font-medium text-muted">{{ i.qty }} × {{ amount(i.price) }}</span>
          </span>
          <span class="shrink-0 text-[14px] font-extrabold whitespace-nowrap text-ink">{{ amount(i.qty * i.price) }}</span>
        </div>
      </div>

      <!-- Yakun -->
      <div class="mt-2 flex flex-col gap-2 border-t border-dashed border-[#dde1e6] pt-3.5">
        <div class="flex items-center justify-between text-[13px]">
          <span class="font-semibold text-muted">To'lov holati</span>
          <span class="font-extrabold" :style="{ color: pay.c }">
            {{ pay.label }}<template v-if="tx.payStatus === 'partial'"> · {{ amount(remaining) }} qoldi</template>
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[15px] font-extrabold text-ink">Jami</span>
          <span
            class="text-[17px] font-extrabold"
            :class="tx.status === 'cancelled' || tx.status === 'returned' ? 'text-[#a3a8b0] line-through' : 'text-ink'"
          >{{ money(tx.total) }}</span>
        </div>
      </div>
    </template>

    <template v-if="tx && (chat || secondary || primary)" #footer>
      <div class="flex gap-2">
        <button
          v-if="chat" type="button" aria-label="Chat"
          class="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-field text-ink transition active:scale-95"
          @click="openChat"
        >
          <AppIcon name="chat" :size="21" :stroke="1.8" />
        </button>
        <button
          v-if="secondary" type="button"
          class="h-[54px] shrink-0 rounded-full bg-[#fdecec] px-5 text-[14px] font-extrabold whitespace-nowrap text-[#d93036] transition active:scale-[0.98]"
          :class="!primary && 'grow'"
          @click="ask"
        >
          {{ secondary === 'cancel' ? 'Bekor qilish' : 'Qaytarish' }}
        </button>
        <button
          v-if="primary" type="button"
          class="h-[54px] min-w-0 flex-1 rounded-full bg-brand px-4 text-[15px] font-extrabold whitespace-nowrap text-white transition active:scale-[0.98]"
          @click="advance"
        >
          {{ primary.label }}
        </button>
      </div>
    </template>
  </BSheet>

  <!-- Tasdiqlash -->
  <BSheet v-model="confirmOpen" tone="card">
    <div v-if="tx" class="flex flex-col items-center gap-2 pt-4 pb-2 text-center">
      <span class="flex size-16 items-center justify-center rounded-full bg-[#fdecec] text-[#d93036]">
        <AppIcon :name="secondary === 'return' ? 'undo' : 'x'" :size="28" />
      </span>
      <h2 class="mt-2 text-[19px] font-extrabold">{{ secondary === 'return' ? 'Buyurtmani qaytarish?' : 'Buyurtmani bekor qilish?' }}</h2>
      <p class="text-[13px] font-medium text-muted">
        #{{ tx.no }} · {{ money(tx.total) }}. {{ reversalText }}
      </p>
    </div>
    <template #footer>
      <div class="flex gap-2">
        <button type="button" class="h-[54px] grow basis-0 rounded-full bg-field text-[15px] font-extrabold text-ink" @click="confirmOpen = false">Yo'q</button>
        <button type="button" class="h-[54px] grow basis-0 rounded-full bg-[#d93036] text-[15px] font-extrabold text-white" @click="confirmAction">
          {{ secondary === 'return' ? 'Qaytarish' : 'Bekor qilish' }}
        </button>
      </div>
    </template>
  </BSheet>
</template>
