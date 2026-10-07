<script setup lang="ts">
import type { PayMethod } from '~/data/types'
import { channelIcon, channelLabel, methodLabel, payStatusLabel, payStatusTone, statusLabel, statusTone } from '~/data/labels'
import type { IconName } from '~/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const { transactions, payments, chats, customerById } = useStore()
const { amount, isUsd } = useMoney()
const { receivePayment, deleteCustomer, customerDeleteBlock } = useLedger()
const { show } = useToast()
const { selection } = useTelegram()
const toneText = { brand: 'text-brand', warn: 'text-warn', danger: 'text-danger' } as const

const id = computed(() => String(route.params.id))
const c = computed(() => customerById(id.value))
const thread = computed(() => chats.value.find(t => t.refId === id.value))

const txs = computed(() => transactions.value
  .filter(t => t.customerId === id.value)
  .sort((a, b) => b.date.localeCompare(a.date)))
// Qo'lda qabul qilingan to'lovlar (qarz to'lovi / balansga qo'shish). Sotuv va qaytarish yozuvlari (txId) — Xaridlar'da
const myPayments = computed(() => payments.value.filter(p => p.refId === id.value && !p.txId))
const avg = computed(() => c.value && c.value.purchases ? Math.round(c.value.totalSpent / c.value.purchases) : 0)

const payOpen = ref(false)
const topupOpen = ref(false)
const editOpen = ref(false)
const delOpen = ref(false)
const noteOpen = ref(false)
const noteDraft = ref('')

function receive(amount: number, method: PayMethod) {
  if (!c.value || !receivePayment(id.value, amount, method, 'debt')) return
  show(c.value.debt > 0 ? `To'lov qabul qilindi. Qoldiq qarz: ${formatSom(c.value.debt)} so'm` : 'Qarz to\'liq yopildi')
}
function topup(amount: number, method: PayMethod) {
  if (!c.value || !receivePayment(id.value, amount, method, 'topup')) return
  show(`Balansga ${formatSom(amount)} so'm qo'shildi`)
}
function openNote() {
  noteDraft.value = c.value?.note ?? ''
  noteOpen.value = true
}
function saveNote() {
  if (!c.value) return
  c.value.note = noteDraft.value.trim() || undefined
  noteOpen.value = false
  show('Izoh saqlandi')
}
/** Qarz/balans yoki xaridlar bo'lsa o'chirish bloklanadi (pul va tarix yo'qolmasligi uchun) */
function askRemove() {
  const block = customerDeleteBlock(id.value)
  if (block) return show(block, 'error')
  delOpen.value = true
}
function remove() {
  const name = c.value?.name
  if (!deleteCustomer(id.value)) return
  show(`${name} o'chirildi`)
  router.replace('/mijozlar')
}
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
    <PageHeader :title="c ? 'Mijoz' : 'Topilmadi'" back="/mijozlar">
      <template v-if="c">
        <RoundButton icon="edit" label="Tahrirlash" @click="editOpen = true" />
        <RoundButton icon="trash" label="O'chirish" @click="askRemove" />
      </template>
    </PageHeader>

    <EmptyState v-if="!c" icon="users" title="Mijoz topilmadi" text="U o'chirilgan yoki havola noto'g'ri">
      <PillButton size="sm" variant="soft" to="/mijozlar" class="mt-2">Mijozlar ro'yxati</PillButton>
    </EmptyState>

    <div v-else class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
      <!-- Profil -->
      <section class="card flex flex-col items-center gap-2 p-5 text-center">
        <Avatar :name="c.name" :size="76" :color="c.debt > 0 ? '#d92d20' : '#05472a'" />
        <h2 class="mt-1 text-xl font-extrabold">{{ c.name }}</h2>
        <p class="text-sm font-semibold text-muted">{{ c.phone }}</p>
        <div class="flex flex-wrap justify-center gap-1.5">
          <Badge tone="neutral"><AppIcon :name="channelIcon[c.channel] as IconName" :size="12" />{{ channelLabel[c.channel] }}</Badge>
          <Badge tone="info"><AppIcon name="clock" :size="12" />{{ formatDay(c.lastVisit) }}, {{ formatTime(c.lastVisit) }}</Badge>
        </div>
        <div class="mt-2 grid w-full grid-cols-2 gap-2.5">
          <a :href="telHref(c.phone)" class="flex h-11 items-center justify-center gap-2 rounded-full bg-soft text-sm font-extrabold text-brand" @click="selection()">
            <AppIcon name="phone" :size="18" />Qo'ng'iroq
          </a>
          <PillButton v-if="thread" size="sm" variant="field" icon="chat" class="!h-11" :to="`/chat/${thread.id}`">Chat</PillButton>
          <PillButton v-else size="sm" variant="field" icon="chat" class="!h-11" disabled>Chat yo'q</PillButton>
        </div>
      </section>

      <!-- Statistika -->
      <section class="grid grid-cols-3 gap-2.5">
        <div class="card flex flex-col gap-0.5 p-3">
          <span class="text-[11px] font-bold text-muted">Jami xarid</span>
          <span class="text-[15px] leading-tight font-extrabold">{{ amount(c.totalSpent) }}</span>
          <span v-if="!isUsd" class="text-[10px] font-semibold text-muted">so'm</span>
        </div>
        <div class="card flex flex-col gap-0.5 p-3">
          <span class="text-[11px] font-bold text-muted">Xaridlar soni</span>
          <span class="text-[15px] leading-tight font-extrabold">{{ c.purchases }}</span>
          <span class="text-[10px] font-semibold text-muted">marta</span>
        </div>
        <div class="card flex flex-col gap-0.5 p-3">
          <span class="text-[11px] font-bold text-muted">O'rtacha chek</span>
          <span class="text-[15px] leading-tight font-extrabold">{{ amount(avg) }}</span>
          <span v-if="!isUsd" class="text-[10px] font-semibold text-muted">so'm</span>
        </div>
      </section>

      <!-- Qarz / balans -->
      <section
        class="relative overflow-hidden rounded-[24px] p-5 text-white shadow-float"
        :class="c.debt > 0 ? 'bg-gradient-to-br from-[#b42318] to-[#d92d20]' : 'bg-gradient-to-br from-brand to-[#0a6b41]'"
      >
        <span class="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-white/10" />
        <p class="text-[13px] font-bold text-white/80">
          {{ c.debt > 0 ? 'Mijoz qarzi' : c.debt < 0 ? 'Mijoz balansi (oldindan to\'lov)' : 'Hisob holati' }}
        </p>
        <p class="mt-1 text-[30px] leading-tight font-extrabold">
          {{ amount(Math.abs(c.debt)) }} <span v-if="!isUsd" class="text-base font-bold text-white/80">so'm</span>
        </p>
        <p class="text-xs font-medium text-white/70">
          {{ c.debt > 0 ? 'Mijoz sizga qarzdor' : c.debt < 0 ? 'Keyingi xaridlarda balansdan yechiladi' : 'Qarz ham, balans ham yo\'q' }}
        </p>
        <div class="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button" class="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-extrabold text-ink disabled:opacity-50"
            :disabled="c.debt <= 0" @click="payOpen = true"
          >
            <AppIcon name="cash" :size="17" />To'lov qabul qilish
          </button>
          <button type="button" class="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/15 text-[13px] font-extrabold text-white" @click="topupOpen = true">
            <AppIcon name="plus" :size="17" />Balansga qo'shish
          </button>
        </div>
      </section>

      <!-- Izoh -->
      <section class="card flex items-start gap-3 p-4">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="file" /></span>
        <div class="min-w-0 grow">
          <p class="text-xs font-bold text-muted">Izoh</p>
          <p class="text-sm font-semibold" :class="!c.note && 'text-muted'">{{ c.note || 'Izoh qo\'shilmagan' }}</p>
        </div>
        <button type="button" class="text-[13px] font-bold text-brand" @click="openNote">{{ c.note ? 'O\'zgartirish' : 'Qo\'shish' }}</button>
      </section>

      <!-- To'lovlar (shu sessiyada qabul qilinganlar) -->
      <section v-if="myPayments.length" class="flex flex-col gap-2.5">
        <SectionHead title="To'lovlar" />
        <div class="card px-4">
          <div v-for="p in myPayments" :key="p.id" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="arrow-down" :size="18" /></span>
            <div class="min-w-0 grow">
              <p class="text-sm font-bold">{{ p.note }}</p>
              <p class="text-xs font-medium text-muted">{{ formatDay(p.date) }}, {{ formatTime(p.date) }} · {{ methodLabel[p.method] }}</p>
            </div>
            <span class="text-sm font-extrabold text-brand">+{{ amount(p.amount) }}</span>
          </div>
        </div>
      </section>

      <!-- Xaridlar -->
      <section class="flex flex-col gap-2.5">
        <SectionHead title="Xaridlar" :action="txs.length ? `${txs.length} ta` : undefined" />
        <div v-if="txs.length" class="card px-4">
          <NuxtLink v-for="t in txs" :key="t.id" :to="`/tarix/${t.id}`" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-field text-muted-2"><AppIcon :name="channelIcon[t.channel] as IconName" :size="18" /></span>
            <div class="min-w-0 grow">
              <p class="flex items-center gap-1.5 text-sm font-bold">#{{ t.no }} <Badge :tone="statusTone[t.status]">{{ statusLabel[t.status] }}</Badge></p>
              <p class="truncate text-xs font-medium text-muted">{{ formatDay(t.date) }}, {{ formatTime(t.date) }} · {{ t.items.length }} ta mahsulot</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-extrabold" :class="(t.status === 'returned' || t.status === 'cancelled') && 'text-muted line-through'">{{ amount(t.total) }}</p>
              <p class="text-[11px] font-bold" :class="toneText[payStatusTone[t.payStatus]]">{{ payStatusLabel[t.payStatus] }}</p>
            </div>
          </NuxtLink>
        </div>
        <div v-else class="card"><EmptyState icon="cart" title="Xaridlar yo'q" text="Bu mijoz hali xarid qilmagan" /></div>
      </section>
    </div>

    <template v-if="c">
      <ContactAmountSheet
        v-model="payOpen" title="To'lov qabul qilish" confirm="Qabul qilish" :max="c.debt" max-label="Butun qarz"
        :info="`${c.name} qarzi: ${formatSom(c.debt)} so'm`" @submit="receive"
      />
      <ContactAmountSheet
        v-model="topupOpen" title="Balansga qo'shish" confirm="Qo'shish"
        :info="c.debt > 0 ? `Avval ${formatSom(c.debt)} so'm qarz yopiladi, qolgani balansga tushadi` : 'Oldindan to\'lov keyingi xaridlarda ishlatiladi'"
        @submit="topup"
      />
      <ContactCustomerSheet v-model="editOpen" :customer="c" />
      <ContactConfirmSheet
        v-model="delOpen" title="Mijozni o'chirasizmi?"
        :text="c.debt !== 0 ? `Diqqat: mijozda ${formatSom(Math.abs(c.debt))} so'm ${c.debt > 0 ? 'qarz' : 'balans'} bor. Xaridlar tarixi saqlanib qoladi.` : 'Xaridlar tarixi saqlanib qoladi.'"
        @confirm="remove"
      />
      <BSheet v-model="noteOpen" title="Izoh">
        <BInput v-model="noteDraft" placeholder="Mijoz haqida eslatma" multiline :maxlength="200" :hint="`${noteDraft.length}/200`" />
        <template #footer>
          <PillButton block icon="check" @click="saveNote">Saqlash</PillButton>
        </template>
      </BSheet>
    </template>
  </div>
</template>
