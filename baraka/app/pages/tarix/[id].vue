<script setup lang="ts">
import type { PayMethod } from '~/data/types'
import type { IconName } from '~/components/AppIcon.vue'
import {
  channelIcon, channelLabel, methodIcon, methodLabel, payStatusLabel, payStatusTone, statusFlow, statusLabel, statusTone,
} from '~/data/labels'

const route = useRoute()
const { txById, customerById, orgById, productById, countsInTotal, business } = useStore()
const { show } = useToast()
const { haptic, share } = useTelegram()

const tx = computed(() => txById(String(route.params.id)))
const customer = computed(() => customerById(tx.value?.customerId))
const org = computed(() => orgById(tx.value?.orgId))

// Ushbu sessiyada qabul qilingan qo'shimcha to'lovlar
const payLog = useState<Record<string, { amount: number, method: PayMethod, date: string }[]>>('hist-payments', () => ({}))
const extra = computed(() => (tx.value && payLog.value[tx.value.id]) || [])
const payments = computed(() => {
  if (!tx.value) return []
  const extraSum = extra.value.reduce((s, p) => s + p.amount, 0)
  const first = tx.value.paid - extraSum
  return [
    ...(first > 0 ? [{ amount: first, method: tx.value.method, date: tx.value.date }] : []),
    ...extra.value,
  ]
})

const remaining = computed(() => tx.value ? Math.max(0, tx.value.total - tx.value.paid) : 0)
const flowIdx = computed(() => tx.value ? statusFlow.indexOf(tx.value.status) : -1)
const active = computed(() => !!tx.value && countsInTotal(tx.value))
const nextStatus = computed(() => flowIdx.value >= 0 && flowIdx.value < statusFlow.length - 1 ? statusFlow[flowIdx.value + 1] : undefined)
const canCancel = computed(() => active.value && tx.value!.status !== 'delivered')
const canReturn = computed(() => active.value && tx.value!.status === 'delivered')
const itemCount = computed(() => tx.value?.items.reduce((s, i) => s + i.qty, 0) ?? 0)

const dateLabel = computed(() => tx.value ? `${formatDay(tx.value.date)}, ${formatDate(tx.value.date)} · ${formatTime(tx.value.date)}` : '')

function advance() {
  if (!tx.value || !nextStatus.value) return
  tx.value.status = nextStatus.value
  haptic('medium')
  show(`Holat: ${statusLabel[nextStatus.value]}`)
}

// --- Bekor qilish / Qaytarish ---
const confirmOpen = ref(false)
const confirmMode = ref<'cancel' | 'return'>('cancel')
function ask(mode: 'cancel' | 'return') {
  confirmMode.value = mode
  confirmOpen.value = true
  haptic('light')
}
function confirmAction() {
  const t = tx.value
  if (!t) return
  // Qoldiqni tiklash: sotuvda mahsulot omborga qaytadi, xaridda chiqadi
  for (const i of t.items) {
    const p = productById(i.productId)
    if (p) p.stock = Math.max(0, p.stock + (t.kind === 'sale' ? i.qty : -i.qty))
  }
  // To'lanmagan qoldiq qarzdan olib tashlanadi
  const rem = Math.max(0, t.total - t.paid)
  if (rem) {
    if (t.kind === 'sale' && customer.value) customer.value.debt -= rem
    else if (t.kind === 'sale' && org.value) org.value.balance += rem
    else if (t.kind === 'purchase' && org.value) org.value.balance -= rem
  }
  t.status = confirmMode.value === 'cancel' ? 'cancelled' : 'returned'
  confirmOpen.value = false
  show(confirmMode.value === 'cancel' ? 'Buyurtma bekor qilindi' : 'Qaytarildi, qoldiq tiklandi')
}

// --- To'lov ---
const payOpen = ref(false)
function onPaid(amount: number, method: PayMethod) {
  const t = tx.value
  if (!t) return
  t.paid += amount
  t.payStatus = t.paid >= t.total ? 'paid' : t.paid > 0 ? 'partial' : 'unpaid'
  if (t.kind === 'sale' && customer.value) customer.value.debt -= amount
  else if (t.kind === 'sale' && org.value) org.value.balance += amount
  else if (t.kind === 'purchase' && org.value) org.value.balance -= amount
  payLog.value = { ...payLog.value, [t.id]: [...(payLog.value[t.id] ?? []), { amount, method, date: new Date().toISOString() }] }
  show(`${formatSom(amount)} so'm qabul qilindi`)
}

function shareReceipt() {
  const t = tx.value
  if (!t) return
  const lines = [
    `${business.value.name} — ${t.kind === 'sale' ? 'Chek' : 'Xarid'} ${t.no}`,
    dateLabel.value,
    '',
    ...t.items.map(i => `${i.name} × ${i.qty} = ${formatSom(i.qty * i.price)} so'm`),
    '',
    `Jami: ${formatSom(t.total)} so'm`,
    `To'langan: ${formatSom(t.paid)} so'm (${methodLabel[t.method]})`,
    ...(remaining.value ? [`Qoldiq: ${formatSom(remaining.value)} so'm`] : []),
  ]
  const text = lines.join('\n')
  share(text)
  navigator.clipboard?.writeText(text).catch(() => {})
  show('Chek ulashildi', 'info')
}
</script>

<template>
  <template v-if="tx">
    <PageHeader :title="tx.no" :subtitle="dateLabel" back="/tarix">
      <RoundButton icon="share" label="Chekni ulashish" @click="shareReceipt" />
    </PageHeader>

    <div class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
      <!-- Summa va holat -->
      <div class="card p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[13px] font-semibold text-muted">{{ tx.kind === 'sale' ? 'Sotuv' : 'Xarid' }} · {{ tx.segment }}</p>
            <p class="text-[30px] leading-tight font-extrabold" :class="!active && 'text-muted line-through decoration-2'">
              {{ formatSom(tx.total) }} <span class="text-base font-bold text-muted">so'm</span>
            </p>
          </div>
          <span class="flex items-center gap-1.5 rounded-full bg-field px-2.5 py-1 text-xs font-bold text-muted-2">
            <AppIcon :name="channelIcon[tx.channel] as IconName" :size="14" />{{ channelLabel[tx.channel] }}
          </span>
        </div>
        <div class="mt-2 flex gap-1.5">
          <Badge :tone="statusTone[tx.status]">{{ statusLabel[tx.status] }}</Badge>
          <Badge :tone="payStatusTone[tx.payStatus]">{{ payStatusLabel[tx.payStatus] }}</Badge>
        </div>

        <div class="mt-4 border-t border-line pt-4">
          <HistStatusStepper :status="tx.status" />
          <div v-if="!active" class="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-bold" :class="tx.status === 'cancelled' ? 'bg-danger-soft text-danger' : 'bg-field text-muted-2'">
            <AppIcon :name="tx.status === 'cancelled' ? 'x' : 'undo'" :size="16" />
            {{ statusLabel[tx.status] }} — jamiga kirmaydi
          </div>
          <PillButton v-else-if="nextStatus" block size="sm" class="mt-3.5 !h-11" icon="arrow-right" @click="advance">
            «{{ statusLabel[nextStatus] }}» ga o'tkazish
          </PillButton>
        </div>
      </div>

      <!-- Tomon -->
      <NuxtLink v-if="customer" :to="`/mijozlar/${customer.id}`" class="card flex items-center gap-3 p-4">
        <Avatar :name="customer.name" />
        <span class="min-w-0 grow">
          <span class="block truncate text-[15px] font-bold">{{ customer.name }}</span>
          <span class="block truncate text-xs font-medium text-muted">{{ customer.phone }}</span>
        </span>
        <span v-if="customer.debt > 0" class="text-right text-xs font-bold text-danger">Qarz<br>{{ formatSom(customer.debt) }}</span>
        <span v-else-if="customer.debt < 0" class="text-right text-xs font-bold text-brand">Balans<br>{{ formatSom(-customer.debt) }}</span>
        <AppIcon name="chevron-right" :size="18" class="shrink-0 text-muted" />
      </NuxtLink>
      <NuxtLink v-else-if="org" :to="`/tashkilotlar/${org.id}`" class="card flex items-center gap-3 p-4">
        <Avatar :name="org.name" :color="org.logoColor" square />
        <span class="min-w-0 grow">
          <span class="block truncate text-[15px] font-bold">{{ org.name }}</span>
          <span class="block truncate text-xs font-medium text-muted">{{ org.type === 'supplier' ? 'Ta\'minotchi' : 'Mijoz tashkilot' }} · STIR {{ org.inn }}</span>
        </span>
        <AppIcon name="chevron-right" :size="18" class="shrink-0 text-muted" />
      </NuxtLink>
      <div v-else class="card flex items-center gap-3 p-4">
        <Avatar icon="user" color="#8b9099" />
        <span class="text-[15px] font-bold text-muted-2">Umumiy mijoz</span>
      </div>

      <!-- Mahsulotlar -->
      <div class="card p-4">
        <SectionHead :title="`Mahsulotlar · ${itemCount}`" />
        <div class="mt-2 divide-y divide-line">
          <div v-for="(i, k) in tx.items" :key="k" class="flex items-center gap-3 py-2.5">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-field text-xl">{{ productById(i.productId)?.emoji ?? '📦' }}</span>
            <span class="min-w-0 grow">
              <span class="block truncate text-sm font-bold">{{ i.name }}</span>
              <span class="block text-xs font-medium text-muted">{{ i.qty }} × {{ formatSom(i.price) }}</span>
            </span>
            <span class="text-sm font-extrabold whitespace-nowrap">{{ formatSom(i.qty * i.price) }}</span>
          </div>
        </div>
      </div>

      <!-- To'lovlar -->
      <div class="card p-4">
        <SectionHead title="To'lov" />
        <dl class="mt-2 flex flex-col gap-2 text-sm">
          <div class="flex justify-between"><dt class="font-medium text-muted">Jami</dt><dd class="font-extrabold">{{ formatSom(tx.total) }} so'm</dd></div>
          <div class="flex justify-between"><dt class="font-medium text-muted">To'langan</dt><dd class="font-extrabold text-brand">{{ formatSom(tx.paid) }} so'm</dd></div>
          <div class="flex justify-between"><dt class="font-medium text-muted">Qoldiq</dt><dd class="font-extrabold" :class="remaining ? 'text-danger' : 'text-ink'">{{ formatSom(remaining) }} so'm</dd></div>
          <div class="flex justify-between"><dt class="font-medium text-muted">Kassir</dt><dd class="font-bold">{{ tx.cashier }}</dd></div>
        </dl>
        <div v-if="tx.total" class="mt-3 h-2 overflow-hidden rounded-full bg-field">
          <div class="h-full rounded-full bg-brand transition-all" :style="{ width: `${Math.min(100, (tx.paid / tx.total) * 100)}%` }" />
        </div>
        <div v-if="payments.length" class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <div v-for="(p, k) in payments" :key="k" class="flex items-center gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="methodIcon[p.method] as IconName" :size="17" /></span>
            <span class="min-w-0 grow">
              <span class="block text-sm font-bold">{{ methodLabel[p.method] }}</span>
              <span class="block text-xs font-medium text-muted">{{ formatDay(p.date) }} · {{ formatTime(p.date) }}</span>
            </span>
            <span class="text-sm font-extrabold text-brand">+{{ formatSom(p.amount) }}</span>
          </div>
        </div>
        <p v-else class="mt-3 border-t border-line pt-3 text-[13px] font-medium text-muted">Hali to'lov qilinmagan · {{ methodLabel[tx.method] }}</p>
      </div>

      <!-- Amallar -->
      <div v-if="canCancel || canReturn" class="flex">
        <PillButton v-if="canCancel" variant="danger" block icon="x" @click="ask('cancel')">Bekor qilish</PillButton>
        <PillButton v-if="canReturn" variant="outline" block icon="undo" @click="ask('return')">Qaytarish</PillButton>
      </div>
    </div>

    <div v-if="active && remaining > 0" class="pb-safe shrink-0 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
      <PillButton block icon="wallet" @click="payOpen = true">
        {{ tx.kind === 'sale' ? 'To\'lov qabul qilish' : 'To\'lov qilish' }} · {{ formatSom(remaining) }}
      </PillButton>
    </div>

    <HistPaySheet v-model="payOpen" :tx="tx" @paid="onPaid" />

    <BSheet v-model="confirmOpen" :title="confirmMode === 'cancel' ? 'Buyurtmani bekor qilish' : 'Qaytarishni tasdiqlang'">
      <div class="flex flex-col items-center gap-3 py-2 text-center">
        <span class="flex size-16 items-center justify-center rounded-full" :class="confirmMode === 'cancel' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'">
          <AppIcon :name="confirmMode === 'cancel' ? 'alert' : 'undo'" :size="30" />
        </span>
        <p class="text-[15px] font-bold">{{ tx.no }} · {{ formatSom(tx.total) }} so'm</p>
        <ul class="flex w-full flex-col gap-2 rounded-2xl bg-card p-3.5 text-left text-[13px] font-medium text-muted-2 shadow-card">
          <li class="flex gap-2"><AppIcon name="box" :size="16" class="mt-0.5 shrink-0 text-brand" />{{ itemCount }} ta mahsulot {{ tx.kind === 'sale' ? 'omborga qaytariladi' : 'ombordan chiqariladi' }}</li>
          <li v-if="remaining" class="flex gap-2"><AppIcon name="wallet" :size="16" class="mt-0.5 shrink-0 text-brand" />{{ formatSom(remaining) }} so'm qarz yopiladi</li>
          <li v-if="tx.paid" class="flex gap-2"><AppIcon name="cash" :size="16" class="mt-0.5 shrink-0 text-brand" />{{ formatSom(tx.paid) }} so'm {{ tx.kind === 'sale' ? 'mijozga qaytariladi' : 'tashkilotdan qaytariladi' }}</li>
          <li class="flex gap-2"><AppIcon name="info" :size="16" class="mt-0.5 shrink-0 text-brand" />Summa hisobotlar jamiga kirmaydi</li>
        </ul>
      </div>
      <template #footer>
        <div class="grid grid-cols-2 gap-2.5">
          <PillButton variant="field" block @click="confirmOpen = false">Yo'q</PillButton>
          <PillButton :variant="confirmMode === 'cancel' ? 'danger' : 'primary'" block @click="confirmAction">
            {{ confirmMode === 'cancel' ? 'Bekor qilish' : 'Qaytarish' }}
          </PillButton>
        </div>
      </template>
    </BSheet>
  </template>

  <template v-else>
    <PageHeader title="Topilmadi" back="/tarix" />
    <EmptyState icon="history" title="Tranzaksiya topilmadi" text="U o'chirilgan yoki mavjud emas">
      <PillButton size="sm" variant="soft" to="/tarix" class="mt-2">Tarixga qaytish</PillButton>
    </EmptyState>
  </template>
</template>
