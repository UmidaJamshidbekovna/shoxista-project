<script setup lang="ts">
import { debtTermLabel, methodLabel, payStatusLabel, payStatusTone } from '~/data/labels'
import type { PosPayment } from '~/composables/usePos'

const route = useRoute()
const { txById, business, branchById, customerById } = useStore()
const { receipts } = usePos()
const { share, tg } = useTelegram()
const { show } = useToast()

const tx = computed(() => txById(String(route.params.id)))
const extra = computed(() => tx.value ? receipts.value[tx.value.id] : undefined)
const branch = computed(() => tx.value ? branchById(tx.value.branchId) : undefined)
const customer = computed(() => customerById(tx.value?.customerId))
const subtotal = computed(() => extra.value?.subtotal ?? tx.value?.items.reduce((s, i) => s + i.qty * i.price, 0) ?? 0)
const discount = computed(() => extra.value?.discount ?? 0)
const payments = computed<PosPayment[]>(() => extra.value?.payments ?? (tx.value && tx.value.paid ? [{ method: tx.value.method, amount: tx.value.paid }] : []))
const debt = computed(() => extra.value?.debt ?? Math.max(0, (tx.value?.total ?? 0) - (tx.value?.paid ?? 0)))
const isNew = computed(() => !!extra.value)

function printReceipt() { window.print() }
const fmtQty = (n: number) => String(Math.round(n * 1000) / 1000)

function shareReceipt() {
  const t = tx.value
  if (!t) return
  const lines = [
    `${business.value.name} · ${branch.value?.name ?? ''}`,
    `Chek ${t.no} · ${formatDate(t.date)} ${formatTime(t.date)}`,
    '',
    ...t.items.map(i => `${i.name} — ${fmtQty(i.qty)} × ${formatSom(i.price)} = ${formatSom(i.qty * i.price)}`),
    '',
    ...(discount.value ? [`Chegirma: −${formatSom(discount.value)} so'm`] : []),
    `Jami: ${formatSom(t.total)} so'm`,
    ...payments.value.map(p => `${methodLabel[p.method]}: ${formatSom(p.amount)} so'm`),
    ...(debt.value ? [`Qarz: ${formatSom(debt.value)} so'm${extra.value?.dueDate ? ` (muddat ${formatDate(extra.value.dueDate)})` : ''}`] : []),
    '',
    'Xaridingiz uchun rahmat!',
  ]
  share(lines.join('\n'))
  if (!navigator.share && !tg) {
    navigator.clipboard?.writeText(lines.join('\n')).then(() => show('Chek matni nusxalandi'), () => {})
  }
}
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
    <div class="print:hidden">
      <PageHeader title="Chek" :subtitle="tx ? tx.no : ''" back="/sotish" />
    </div>

    <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-6">
      <EmptyState v-if="!tx" icon="file" title="Chek topilmadi" text="Bu sotuv mavjud emas yoki o'chirilgan">
        <PillButton size="sm" to="/sotish">Sotishga qaytish</PillButton>
      </EmptyState>

      <template v-else>
        <div v-if="isNew" class="animate-fade-in flex flex-col items-center gap-2 pt-1 pb-5 text-center print:hidden">
          <span class="relative flex size-[72px] items-center justify-center rounded-full bg-brand text-white shadow-float">
            <span class="absolute inset-0 animate-ping rounded-full bg-brand/25 [animation-iteration-count:2]" />
            <AppIcon name="check" :size="36" :stroke="3" class="relative" />
          </span>
          <h2 class="mt-1 text-[22px] font-extrabold">Sotuv yakunlandi</h2>
          <p class="text-[13px] font-semibold text-muted">
            {{ formatSom(tx.total) }} so'm
            <template v-if="extra?.change"> · Qaytim <b class="text-brand">{{ formatSom(extra.change) }} so'm</b></template>
          </p>
        </div>

        <article id="pos-receipt" class="card relative overflow-hidden px-5 pt-5 pb-6">
          <header class="flex flex-col items-center gap-1 border-b border-dashed border-line pb-4 text-center">
            <Avatar :name="business.name" :color="business.logoColor" :size="48" square />
            <h3 class="mt-1 text-[17px] font-extrabold">{{ business.name }}</h3>
            <p class="text-xs font-semibold text-muted">{{ branch?.name }} · {{ branch?.address }}</p>
            <p class="text-xs font-semibold text-muted">{{ business.phone }} · STIR {{ business.inn }}</p>
          </header>

          <dl class="grid grid-cols-2 gap-y-1.5 border-b border-dashed border-line py-3 text-[13px]">
            <dt class="font-semibold text-muted">Chek №</dt><dd class="text-right font-extrabold">{{ tx.no }}</dd>
            <dt class="font-semibold text-muted">Sana</dt><dd class="text-right font-bold">{{ formatDate(tx.date) }} {{ formatTime(tx.date) }}</dd>
            <dt class="font-semibold text-muted">Kassir</dt><dd class="text-right font-bold">{{ tx.cashier }}</dd>
            <template v-if="customer">
              <dt class="font-semibold text-muted">Mijoz</dt><dd class="truncate text-right font-bold">{{ customer.name }}</dd>
              <dt class="font-semibold text-muted">Telefon</dt><dd class="text-right font-bold">{{ customer.phone }}</dd>
            </template>
          </dl>

          <ul class="flex flex-col gap-2.5 border-b border-dashed border-line py-3">
            <li v-for="(i, idx) in tx.items" :key="idx" class="flex items-start gap-3 text-[13px]">
              <span class="min-w-0 grow">
                <span class="block font-bold">{{ i.name }}</span>
                <span class="block font-semibold text-muted">{{ fmtQty(i.qty) }} × {{ formatSom(i.price) }}</span>
              </span>
              <span class="shrink-0 font-extrabold">{{ formatSom(i.qty * i.price) }}</span>
            </li>
          </ul>

          <div class="flex flex-col gap-1.5 border-b border-dashed border-line py-3 text-[13px]">
            <div class="flex justify-between font-semibold text-muted-2"><span>Oraliq summa</span><span>{{ formatSom(subtotal) }}</span></div>
            <div v-if="discount" class="flex justify-between font-semibold text-brand"><span>Chegirma</span><span>−{{ formatSom(discount) }}</span></div>
            <div class="mt-1 flex items-end justify-between">
              <span class="text-[15px] font-extrabold">Jami</span>
              <span class="text-[26px] leading-none font-extrabold">{{ formatSom(tx.total) }} <span class="text-sm">so'm</span></span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5 pt-3 text-[13px]">
            <div v-for="p in payments" :key="p.method" class="flex justify-between font-semibold text-muted-2">
              <span>{{ methodLabel[p.method] }}</span><span class="font-bold text-ink">{{ formatSom(p.amount) }}</span>
            </div>
            <div v-if="extra?.change" class="flex justify-between font-semibold text-muted-2"><span>Qaytim</span><span class="font-bold text-ink">{{ formatSom(extra.change) }}</span></div>
            <div class="flex items-center justify-between pt-1">
              <span class="font-semibold text-muted-2">Holat</span>
              <Badge :tone="payStatusTone[tx.payStatus]">{{ payStatusLabel[tx.payStatus] }}</Badge>
            </div>
          </div>

          <div v-if="debt" class="mt-3 flex items-center gap-3 rounded-2xl bg-warn-soft px-3 py-2.5 text-warn">
            <AppIcon name="clock" :size="20" class="shrink-0" />
            <span class="grow text-xs font-bold">
              Qarzga: {{ formatSom(debt) }} so'm
              <template v-if="extra?.term"> · {{ debtTermLabel[extra.term] }}</template>
              <template v-if="extra?.dueDate"><br>To'lash muddati: {{ formatDate(extra.dueDate) }}</template>
              <template v-if="customer && customer.debt > 0"><br>Mijozning umumiy qarzi: {{ formatSom(customer.debt) }} so'm</template>
            </span>
          </div>
          <div v-else-if="customer && customer.debt < 0" class="mt-3 rounded-2xl bg-soft-2 px-3 py-2.5 text-xs font-bold text-brand">
            Mijoz balansi: {{ formatSom(-customer.debt) }} so'm
          </div>

          <p class="mt-4 text-center text-xs font-semibold text-muted">Xaridingiz uchun rahmat! · baraka.app/@{{ business.username }}</p>
          <div class="absolute inset-x-0 -bottom-2 flex justify-around" aria-hidden="true">
            <span v-for="n in 14" :key="n" class="size-4 rounded-full bg-app" />
          </div>
        </article>

        <NuxtLink v-if="!isNew" :to="`/tarix/${tx.id}`" class="mt-3 flex items-center justify-center gap-1 text-[13px] font-bold text-brand print:hidden">
          Tranzaksiya tafsilotlari <AppIcon name="chevron-right" :size="16" />
        </NuxtLink>
      </template>
    </div>

    <div v-if="tx" class="pb-safe flex shrink-0 flex-col gap-2 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)] print:hidden">
      <div class="flex gap-2">
        <PillButton variant="field" icon="printer" class="grow basis-0" @click="printReceipt">Chop etish</PillButton>
        <PillButton variant="soft" icon="share" class="grow basis-0" @click="shareReceipt">Ulashish</PillButton>
      </div>
      <PillButton block icon="plus" to="/sotish">Yangi sotuv</PillButton>
    </div>
  </div>
</template>

<style>
@media print {
  body * { visibility: hidden; }
  #pos-receipt, #pos-receipt * { visibility: visible; }
  #pos-receipt { position: fixed; top: 0; left: 0; width: 100%; box-shadow: none; }
}
</style>
