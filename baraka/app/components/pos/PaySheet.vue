<script setup lang="ts">
import type { DebtTerm, PayMethod } from '~/data/types'
import { debtTermDays, debtTermLabel, methodIcon, methodLabel } from '~/data/labels'
import type { IconName } from '~/components/AppIcon.vue'

// To'lov: bir nechta usul (qisman/aralash), qaytim, qarzga sotish
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ 'need-customer': [] }>()
const pos = usePos()
const { cart, lines, total, subtotal, customer, store } = pos
const { show } = useToast()
const { notify } = useTelegram()
const { sell } = useLedger()

const METHODS: PayMethod[] = ['cash', 'card', 'click', 'payme', 'transfer', 'balance']
const rows = ref<{ method: PayMethod, value: string }[]>([])
const pristine = ref(true)
const debtOn = ref(false)
const term = ref<DebtTerm>('1w')
const termOptions = (Object.keys(debtTermLabel) as DebtTerm[]).map(k => ({ value: k, label: debtTermLabel[k] }))
const busy = ref(false)

watch(open, (v) => {
  if (!v) return
  rows.value = [{ method: 'cash', value: String(total.value) }]
  pristine.value = true
  debtOn.value = false
  term.value = '1w'
  busy.value = false
})

const balance = computed(() => Math.max(0, -(customer.value?.debt ?? 0)))
const num = (s: string) => parseNum(s, { decimalComma: false }) || 0
const amountOf = (m: PayMethod) => rows.value.filter(r => r.method === m).reduce((s, r) => s + num(r.value), 0)
const paidSum = computed(() => rows.value.reduce((s, r) => s + num(r.value), 0))
const nonCash = computed(() => paidSum.value - amountOf('cash'))
const remaining = computed(() => Math.max(0, total.value - paidSum.value))
const change = computed(() => Math.max(0, paidSum.value - total.value))
const received = computed(() => Math.min(paidSum.value, total.value))

const rowError = (r: { method: PayMethod, value: string }) => {
  const s = String(r.value).trim()
  if (!s) return ''
  const n = Number(s.replace(/\s/g, ''))
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return 'Butun musbat son kiriting'
  if (r.method === 'balance' && n > balance.value) return `Balansda ${formatSom(balance.value)} so'm bor`
  return ''
}

const errors = computed(() => {
  const e: string[] = []
  if (!lines.value.length) e.push('Savat bo\'sh')
  if (rows.value.some(r => rowError(r))) e.push('To\'lov summalarini tekshiring')
  if (nonCash.value > total.value) e.push('Naqddan boshqa to\'lovlar jami summadan oshmasin (qaytim faqat naqdda)')
  if (remaining.value > 0 && !debtOn.value) e.push(`Yana ${formatSom(remaining.value)} so'm kerak yoki qarzga yozing`)
  if (debtOn.value && remaining.value > 0 && !customer.value) e.push('Qarzga sotish uchun mijoz tanlang')
  return e
})

function toggle(m: PayMethod) {
  if (m === 'balance' && !balance.value) return
  const has = rows.value.some(r => r.method === m)
  if (has) {
    rows.value = rows.value.filter(r => r.method !== m)
    return
  }
  const fill = (cap: number) => String(Math.min(cap, Math.max(0, total.value - paidSum.value)))
  // bitta usul to'liq summani qoplasa — almashtiramiz, aks holda qo'shamiz (aralash to'lov)
  if (pristine.value && rows.value.length === 1 && num(rows.value[0]!.value) >= total.value) {
    rows.value = [{ method: m, value: m === 'balance' ? String(Math.min(balance.value, total.value)) : String(total.value) }]
    return
  }
  pristine.value = false
  rows.value.push({ method: m, value: fill(m === 'balance' ? balance.value : Infinity) })
}
function fillRest(i: number) {
  const r = rows.value[i]!
  const others = paidSum.value - num(r.value)
  let v = Math.max(0, total.value - others)
  if (r.method === 'balance') v = Math.min(v, balance.value)
  r.value = String(v)
  pristine.value = false
}
const cashQuick = computed(() => {
  const t = total.value
  const set = new Set<number>([t])
  for (const step of [5000, 10000, 50000, 100000]) set.add(Math.ceil(t / step) * step)
  return [...set].filter(v => v >= t).sort((a, b) => a - b).slice(0, 4)
})

const dueDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + debtTermDays[term.value])
  return d.toISOString()
})

function finish() {
  if (errors.value.length || busy.value) return
  busy.value = true
  const debt = debtOn.value ? remaining.value : 0
  // naqd qaytim chiqarilgan holda to'lovlar
  const payments = rows.value
    .map(r => ({ method: r.method, amount: num(r.value) }))
    .filter(p => p.amount > 0)
  const cashP = payments.find(p => p.method === 'cash')
  if (cashP) cashP.amount -= change.value
  const clean = payments.filter(p => p.amount > 0)

  // Ledger: barcha qatorlar qoldig'i qayta tekshiriladi (boshqa savatlar sotib yuborgan bo'lishi mumkin),
  // qoldiq, mijoz qarzi/balansi, statistikasi va to'lovlar jurnali birgalikda yangilanadi
  const tx = sell({
    customerId: customer.value?.id,
    items: lines.value.map(l => ({ productId: l.productId, name: l.product.name, qty: l.qty, price: l.price })),
    total: total.value, payments: clean, debt,
    cashier: store.role.value === 'owner' ? (store.business.value.owner.split(' ')[0] ?? 'Aziz') : 'Kamola',
    branchId: store.currentBranchId.value,
  })
  if (!tx) {
    busy.value = false
    notify('error')
    return
  }

  pos.receipts.value[tx.id] = {
    subtotal: subtotal.value, discount: cart.value.discount, payments: clean, change: change.value,
    debt, term: debt ? term.value : undefined, dueDate: debt ? dueDate.value : undefined,
  }
  pos.resetActive()
  notify('success')
  show(`Sotuv ${tx.no} yakunlandi`)
  open.value = false
  navigateTo(`/sotish/chek/${tx.id}`)
}
</script>

<template>
  <BSheet v-model="open" title="To'lov" full>
    <div class="flex flex-col gap-4">
      <div class="rounded-[24px] bg-brand px-5 py-4 text-white">
        <p class="text-[13px] font-semibold text-white/70">To'lanadigan summa</p>
        <p class="text-[30px] leading-tight font-extrabold">{{ formatSom(total) }} <span class="text-lg">so'm</span></p>
        <p v-if="cart.discount" class="text-xs font-semibold text-white/70">Chegirma −{{ formatSom(cart.discount) }} so'm hisobga olingan</p>
        <button type="button" class="mt-3 flex w-full items-center gap-2 rounded-2xl bg-white/12 px-3 py-2 text-left" @click="emit('need-customer')">
          <AppIcon name="user" :size="16" />
          <span class="grow truncate text-[13px] font-bold">{{ customer ? customer.name : 'Mijoz tanlanmagan' }}</span>
          <span v-if="customer && customer.debt > 0" class="text-xs font-bold text-[#fca5a5]">Qarz {{ formatSom(customer.debt) }}</span>
          <span v-else-if="balance" class="text-xs font-bold text-[#86efac]">Balans {{ formatSom(balance) }}</span>
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>

      <div>
        <SectionHead title="To'lov usuli" />
        <p class="mt-0.5 text-xs font-medium text-muted">Bir nechta usulni tanlab, summani bo'lib to'lash mumkin</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="m in METHODS" :key="m" type="button"
          class="flex h-[66px] flex-col items-center justify-center gap-1 rounded-[18px] text-[13px] font-bold transition active:scale-95 disabled:opacity-40"
          :class="rows.some(r => r.method === m) ? 'bg-brand text-white shadow-float' : 'bg-card text-ink shadow-card'"
          :disabled="m === 'balance' && !balance"
          @click="toggle(m)"
        >
          <AppIcon :name="methodIcon[m] as IconName" :size="20" />
          {{ methodLabel[m] }}
        </button>
      </div>
      <p v-if="!balance" class="-mt-2 text-[11px] font-medium text-muted">Balansdan to'lov — mijozda oldindan to'lov bo'lsa faollashadi</p>

      <div v-if="rows.length" class="flex flex-col gap-2.5">
        <div v-for="(r, i) in rows" :key="r.method" class="rounded-[18px] bg-card p-3 shadow-card">
          <div class="mb-2 flex items-center gap-2">
            <span class="flex size-8 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="methodIcon[r.method] as IconName" :size="16" /></span>
            <span class="grow text-[14px] font-extrabold">{{ methodLabel[r.method] }}</span>
            <button type="button" class="h-8 rounded-full bg-field px-3 text-xs font-bold text-brand" @click="fillRest(i)">Qolganini</button>
            <button type="button" aria-label="Olib tashlash" class="flex size-8 items-center justify-center rounded-full bg-field text-muted" @click="rows.splice(i, 1); pristine = false">
              <AppIcon name="x" :size="14" />
            </button>
          </div>
          <BInput v-model="r.value" inputmode="numeric" suffix="so'm" placeholder="0" :error="rowError(r)" @update:model-value="pristine = false" />
          <div v-if="r.method === 'cash'" class="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            <button
              v-for="v in cashQuick" :key="v" type="button" class="h-8 shrink-0 rounded-full px-3 text-xs font-bold"
              :class="num(r.value) === v ? 'bg-brand text-white' : 'bg-field text-muted-2'"
              @click="r.value = String(v); pristine = false"
            >
              {{ v === total ? 'Aniq' : formatSom(v) }}
            </button>
          </div>
        </div>
      </div>
      <EmptyState v-else icon="wallet" title="To'lov usuli tanlanmagan" text="To'liq qarzga sotish uchun qarz bo'limini yoqing" />

      <div class="card flex flex-col gap-2 p-4">
        <div class="flex justify-between text-[14px] font-semibold text-muted-2"><span>To'landi</span><span class="font-extrabold text-ink">{{ formatSom(received) }} so'm</span></div>
        <div class="flex justify-between text-[14px] font-semibold text-muted-2">
          <span>Qolgan</span><span class="font-extrabold" :class="remaining ? 'text-danger' : 'text-brand'">{{ formatSom(remaining) }} so'm</span>
        </div>
        <div v-if="change" class="flex items-center justify-between rounded-2xl bg-soft-2 px-3 py-2.5">
          <span class="text-[14px] font-bold text-brand">Qaytim</span>
          <span class="text-xl font-extrabold text-brand">{{ formatSom(change) }} so'm</span>
        </div>
      </div>

      <div v-if="remaining > 0" class="card flex flex-col gap-3 p-4">
        <div class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-full bg-warn-soft text-warn"><AppIcon name="clock" /></span>
          <span class="grow">
            <span class="block text-[15px] font-extrabold">Qarzga sotish</span>
            <span class="block text-xs font-medium text-muted">{{ formatSom(remaining) }} so'm mijoz qarziga yoziladi</span>
          </span>
          <Toggle v-model="debtOn" label="Qarzga sotish" />
        </div>
        <template v-if="debtOn">
          <div v-if="!customer" class="flex items-center gap-2 rounded-2xl bg-danger-soft px-3 py-2.5">
            <AppIcon name="alert" :size="16" class="text-danger" />
            <span class="grow text-xs font-bold text-danger">Qarz uchun mijoz majburiy</span>
            <PillButton size="sm" @click="emit('need-customer')">Tanlash</PillButton>
          </div>
          <span class="text-[13px] font-bold text-muted-2">Qaytarish muddati</span>
          <Segmented v-model="term" :options="termOptions" />
          <p class="flex items-center gap-1.5 text-xs font-semibold text-muted-2">
            <AppIcon name="calendar" :size="14" /> Muddat: {{ formatDate(dueDate) }}
            <template v-if="customer && customer.debt > 0"> · Jami qarz {{ formatSom(customer.debt + remaining) }} so'm bo'ladi</template>
          </p>
        </template>
      </div>
    </div>

    <template #footer>
      <p v-if="errors.length" class="mb-2 flex items-center gap-1.5 text-xs font-bold text-danger">
        <AppIcon name="alert" :size="14" />{{ errors[0] }}
      </p>
      <PillButton block icon="check" :disabled="!!errors.length || busy" @click="finish">
        Sotuvni yakunlash · {{ formatSom(total) }}
      </PillButton>
    </template>
  </BSheet>
</template>
