<script setup lang="ts">
import type { PayMethod } from '~/data/types'
import { methodLabel, payStatusLabel, payStatusTone, statusLabel, statusTone } from '~/data/labels'

const route = useRoute()
const router = useRouter()
const { organizations, transactions, chats, orgById, productById, countsInTotal } = useStore()
const { payments, addPayment } = useContactPayments()
const { show } = useToast()
const { selection } = useTelegram()

const id = computed(() => String(route.params.id))
const org = computed(() => orgById(id.value))
const thread = computed(() => chats.value.find(t => t.refId === id.value))
const isSupplier = computed(() => org.value?.type === 'supplier')

type Tab = 'products' | 'orders' | 'payments' | 'info'
const tabs = computed(() => {
  const all = [
    { value: 'products', label: 'Mahsulotlar' },
    { value: 'orders', label: 'Buyurtmalar tarixi' },
    { value: 'payments', label: 'To\'lov tarixi' },
    { value: 'info', label: 'Ma\'lumot' },
  ]
  // README: o'zimiz yaratgan tashkilotda faqat buyurtma va to'lov tarixi
  return org.value?.ownCreated ? all.filter(t => t.value === 'orders' || t.value === 'payments') : all
})
const tab = ref<Tab>(org.value?.ownCreated ? 'orders' : 'products')
watch(tabs, (t) => {
  if (!t.some(x => x.value === tab.value)) tab.value = t[0]!.value as Tab
}, { immediate: true })

const orders = computed(() => transactions.value
  .filter(t => t.orgId === id.value)
  .sort((a, b) => b.date.localeCompare(a.date)))
const turnover = computed(() => orders.value.filter(countsInTotal).reduce((s, t) => s + t.total, 0))

const products = computed(() => {
  const kind = isSupplier.value ? 'purchase' : 'sale'
  const m = new Map<string, { productId: string, name: string, emoji: string, lastPrice: number, lastDate: string, qty: number, orders: number }>()
  for (const t of orders.value) {
    if (t.kind !== kind || !countsInTotal(t)) continue
    for (const i of t.items) {
      const cur = m.get(i.productId)
      if (cur) {
        cur.qty += i.qty
        cur.orders++
      }
      else {
        // orders date bo'yicha kamayish tartibida — birinchi uchragani eng oxirgi narx
        m.set(i.productId, { productId: i.productId, name: i.name, emoji: productById(i.productId)?.emoji ?? '📦', lastPrice: i.price, lastDate: t.date, qty: i.qty, orders: 1 })
      }
    }
  }
  return [...m.values()]
})

interface PayRow { id: string, date: string, amount: number, method: PayMethod, dir: 'in' | 'out', title: string, txId?: string }
const payRows = computed<PayRow[]>(() => {
  const derived: PayRow[] = orders.value.filter(t => t.paid > 0 && t.status !== 'cancelled').map(t => ({
    id: `tx-${t.id}`, date: t.date, amount: t.paid, method: t.method, dir: t.kind === 'purchase' ? 'out' : 'in', title: `#${t.no} buyurtma uchun`, txId: t.id,
  }))
  const manual: PayRow[] = payments.value.filter(p => p.refId === id.value).map(p => ({
    id: p.id, date: p.date, amount: p.amount, method: p.method, dir: p.dir, title: p.note ?? 'To\'lov',
  }))
  return [...manual, ...derived].sort((a, b) => b.date.localeCompare(a.date))
})
const paidOut = computed(() => payRows.value.filter(p => p.dir === 'out').reduce((s, p) => s + p.amount, 0))
const paidIn = computed(() => payRows.value.filter(p => p.dir === 'in').reduce((s, p) => s + p.amount, 0))

const payOpen = ref(false)
const editOpen = ref(false)
const delOpen = ref(false)

const payTitle = computed(() => isSupplier.value ? 'To\'lov qilish' : 'To\'lov qabul qilish')
const payMax = computed(() => {
  if (!org.value) return undefined
  if (isSupplier.value) return org.value.balance > 0 ? org.value.balance : undefined
  return org.value.balance < 0 ? -org.value.balance : undefined
})

function pay(amount: number, method: PayMethod) {
  const o = org.value
  if (!o) return
  if (isSupplier.value) {
    o.balance -= amount
    addPayment({ refId: o.id, amount, method, dir: 'out', note: 'To\'lov qilindi' })
  }
  else {
    o.balance += amount
    addPayment({ refId: o.id, amount, method, dir: 'in', note: 'To\'lov qabul qilindi' })
  }
  show(o.balance === 0 ? 'Hisob to\'liq yopildi' : `${formatSom(amount)} so'm to'lov saqlandi`)
}

function remove() {
  const name = org.value?.name
  organizations.value = organizations.value.filter(o => o.id !== id.value)
  show(`${name} o'chirildi`)
  router.replace('/mijozlar?tab=org')
}

const NuxtLink = resolveComponent('NuxtLink')
const toneText = { brand: 'text-brand', warn: 'text-warn', danger: 'text-danger' } as const
const cleanName = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, '')
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
    <PageHeader :title="org ? 'Tashkilot' : 'Topilmadi'" back="/mijozlar?tab=org">
      <template v-if="org">
        <RoundButton v-if="thread" icon="chat" label="Chat" :to="`/chat/${thread.id}`" />
        <RoundButton icon="edit" label="Tahrirlash" @click="editOpen = true" />
      </template>
    </PageHeader>

    <EmptyState v-if="!org" icon="building" title="Tashkilot topilmadi" text="U o'chirilgan yoki havola noto'g'ri">
      <PillButton size="sm" variant="soft" to="/mijozlar?tab=org" class="mt-2">Tashkilotlar</PillButton>
    </EmptyState>

    <div v-else class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
      <!-- Sarlavha -->
      <section class="card flex items-center gap-3.5 p-4">
        <Avatar :name="cleanName(org.name)" :color="org.logoColor" :size="60" square />
        <div class="min-w-0 grow">
          <h2 class="text-lg leading-tight font-extrabold">{{ org.name }}</h2>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge :tone="isSupplier ? 'info' : 'neutral'">{{ isSupplier ? 'Ta\'minotchi' : 'Mijoz (B2B)' }}</Badge>
            <Badge v-if="org.ownCreated" tone="warn">O'zim yaratgan</Badge>
            <Badge v-else tone="brand"><AppIcon name="check" :size="12" />Platformada</Badge>
          </div>
          <p class="mt-1 truncate text-xs font-medium text-muted">INN {{ org.inn }} · {{ org.phone }}</p>
        </div>
        <a :href="telHref(org.phone)" aria-label="Qo'ng'iroq" class="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-brand" @click="selection()">
          <AppIcon name="phone" :size="19" />
        </a>
      </section>

      <!-- Balans -->
      <section
        class="relative overflow-hidden rounded-[24px] p-5 text-white shadow-float"
        :class="org.balance > 0 ? 'bg-gradient-to-br from-[#12211a] to-[#2b3a33]' : 'bg-gradient-to-br from-brand to-[#0a6b41]'"
      >
        <span class="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-white/10" />
        <p class="text-[13px] font-bold text-white/80">{{ org.balance > 0 ? 'Biz qarzmiz' : org.balance < 0 ? 'Bizga qarz' : 'Balans' }}</p>
        <p class="mt-1 text-[30px] leading-tight font-extrabold">{{ formatSom(Math.abs(org.balance)) }} <span class="text-base font-bold text-white/80">so'm</span></p>
        <div class="mt-1 flex gap-4 text-xs font-medium text-white/70">
          <span>{{ orders.length }} ta buyurtma</span>
          <span>Aylanma: {{ formatSom(turnover) }} so'm</span>
        </div>
        <div class="mt-4 flex gap-2.5">
          <button type="button" class="flex h-11 grow items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-extrabold text-ink" @click="payOpen = true">
            <AppIcon :name="isSupplier ? 'arrow-up' : 'arrow-down'" :size="17" />{{ payTitle }}
          </button>
          <NuxtLink
            v-if="isSupplier" :to="`/ombor/kirim?org=${org.id}`"
            class="flex h-11 grow items-center justify-center gap-1.5 rounded-full bg-white/15 text-[13px] font-extrabold text-white"
          >
            <AppIcon name="truck" :size="17" />Buyurtma berish
          </NuxtLink>
        </div>
      </section>

      <Chips v-model="tab" :options="tabs" />

      <!-- Mahsulotlar -->
      <section v-if="tab === 'products'" class="flex flex-col gap-2.5">
        <div v-if="products.length" class="card px-4">
          <div v-for="p in products" :key="p.productId" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-field text-2xl">{{ p.emoji }}</span>
            <div class="min-w-0 grow">
              <p class="truncate text-sm font-bold">{{ p.name }}</p>
              <p class="truncate text-xs font-medium text-muted">Jami {{ p.qty }} dona · oxirgi: {{ formatDay(p.lastDate) }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-extrabold">{{ formatSom(p.lastPrice) }}</p>
              <p class="text-[11px] font-bold text-muted">oxirgi narx</p>
            </div>
          </div>
        </div>
        <div v-else class="card"><EmptyState icon="box" title="Mahsulotlar yo'q" text="Bu tashkilot bilan hali savdo bo'lmagan" /></div>
        <PillButton v-if="isSupplier" block icon="truck" :to="`/ombor/kirim?org=${org.id}`">Buyurtma berish</PillButton>
      </section>

      <!-- Buyurtmalar tarixi -->
      <section v-else-if="tab === 'orders'">
        <div v-if="orders.length" class="card px-4">
          <NuxtLink v-for="t in orders" :key="t.id" :to="`/tarix/${t.id}`" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-full"
              :class="t.kind === 'purchase' ? 'bg-info-soft text-info' : 'bg-soft text-brand'"
            >
              <AppIcon :name="t.kind === 'purchase' ? 'truck' : 'cart'" :size="18" />
            </span>
            <div class="min-w-0 grow">
              <p class="flex items-center gap-1.5 text-sm font-bold">#{{ t.no }} <Badge :tone="statusTone[t.status]">{{ statusLabel[t.status] }}</Badge></p>
              <p class="truncate text-xs font-medium text-muted">{{ formatDate(t.date) }}, {{ formatTime(t.date) }} · {{ t.items.length }} xil mahsulot</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-extrabold">{{ formatSom(t.total) }}</p>
              <p class="text-[11px] font-bold" :class="toneText[payStatusTone[t.payStatus]]">{{ payStatusLabel[t.payStatus] }}</p>
            </div>
          </NuxtLink>
        </div>
        <div v-else class="card"><EmptyState icon="history" title="Buyurtmalar yo'q" text="Bu tashkilot bilan hali buyurtma bo'lmagan" /></div>
      </section>

      <!-- To'lov tarixi -->
      <section v-else-if="tab === 'payments'" class="flex flex-col gap-2.5">
        <div class="grid grid-cols-2 gap-2.5">
          <div class="card p-3.5">
            <p class="text-[11px] font-bold text-muted">Biz to'ladik</p>
            <p class="text-base font-extrabold">{{ formatSom(paidOut) }} <span class="text-xs text-muted">so'm</span></p>
          </div>
          <div class="card p-3.5">
            <p class="text-[11px] font-bold text-muted">Bizga to'landi</p>
            <p class="text-base font-extrabold text-brand">{{ formatSom(paidIn) }} <span class="text-xs text-muted">so'm</span></p>
          </div>
        </div>
        <div v-if="payRows.length" class="card px-4">
          <component
            :is="p.txId ? NuxtLink : 'div'" v-for="p in payRows" :key="p.id" :to="p.txId ? `/tarix/${p.txId}` : undefined"
            class="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full" :class="p.dir === 'out' ? 'bg-danger-soft text-danger' : 'bg-soft text-brand'">
              <AppIcon :name="p.dir === 'out' ? 'arrow-up' : 'arrow-down'" :size="18" />
            </span>
            <div class="min-w-0 grow">
              <p class="truncate text-sm font-bold">{{ p.title }}</p>
              <p class="truncate text-xs font-medium text-muted">{{ formatDate(p.date) }}, {{ formatTime(p.date) }} · {{ methodLabel[p.method] }}</p>
            </div>
            <span class="shrink-0 text-sm font-extrabold" :class="p.dir === 'out' ? 'text-danger' : 'text-brand'">{{ p.dir === 'out' ? '−' : '+' }}{{ formatSom(p.amount) }}</span>
          </component>
        </div>
        <div v-else class="card"><EmptyState icon="wallet" title="To'lovlar yo'q" text="Hali hech qanday to'lov qayd etilmagan" /></div>
        <PillButton block :icon="isSupplier ? 'arrow-up' : 'arrow-down'" @click="payOpen = true">{{ payTitle }}</PillButton>
      </section>

      <!-- Ma'lumot -->
      <section v-else class="flex flex-col gap-2.5">
        <div class="card px-4">
          <ListRow icon="file" title="INN (STIR)" :subtitle="org.inn" :chevron="false" />
          <ListRow icon="map-pin" title="Manzil" :subtitle="org.address || 'Kiritilmagan'" :chevron="false" />
          <ListRow icon="user" title="Mas'ul shaxs" :subtitle="org.contact || 'Kiritilmagan'" :chevron="false" />
          <a :href="telHref(org.phone)" class="flex items-center gap-3 py-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="phone" /></span>
            <span class="min-w-0 grow">
              <span class="block text-[15px] font-bold">Telefon</span>
              <span class="block text-xs font-medium text-muted">{{ org.phone }}</span>
            </span>
            <span class="text-[13px] font-bold text-brand">Qo'ng'iroq</span>
          </a>
        </div>
        <div v-if="org.categories.length" class="card flex flex-wrap gap-1.5 p-4">
          <p class="w-full text-xs font-bold text-muted">Yo'nalishlar</p>
          <Badge v-for="cat in org.categories" :key="cat" tone="brand">{{ cat }}</Badge>
        </div>
        <PillButton block variant="soft" icon="edit" @click="editOpen = true">Ma'lumotlarni tahrirlash</PillButton>
      </section>

      <button v-if="org.ownCreated" type="button" class="mt-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-bold text-danger" @click="delOpen = true">
        <AppIcon name="trash" :size="16" />Tashkilotni o'chirish
      </button>
    </div>

    <template v-if="org">
      <ContactAmountSheet
        v-model="payOpen" :title="payTitle" :confirm="isSupplier ? 'To\'lash' : 'Qabul qilish'" :max="payMax" max-label="Butun qarz"
        :info="org.balance === 0 ? 'Hozir qarz yo\'q — to\'lov oldindan to\'lov (avans) sifatida yoziladi' : `${org.balance > 0 ? 'Biz qarzmiz' : 'Bizga qarz'}: ${formatSom(Math.abs(org.balance))} so'm`"
        @submit="pay"
      />
      <ContactOrgSheet v-model="editOpen" :org="org" />
      <ContactConfirmSheet
        v-model="delOpen" title="Tashkilotni o'chirasizmi?" text="Buyurtmalar tarixi saqlanib qoladi." @confirm="remove"
      />
    </template>
  </div>
</template>
