<script setup lang="ts">
import { planLimits } from '~/data/labels'
import type { ProfPlan } from '~/composables/useProfHelpers'

const { business, employees, branches, products } = useStore()
const { show } = useToast()
const { selection, haptic } = useTelegram()

const period = ref<'1' | '12'>('1')
const priceFor = (p: number) => period.value === '12' ? Math.round(p * 12 * 0.8) : p
const current = computed(() => profPlans.find(p => p.id === business.value.plan)!)
const rows = (id: ProfPlan) => {
  const l = planLimits[id]
  return [
    { icon: 'users', label: 'Xodim', value: profLimitText(l.employees) },
    { icon: 'store', label: 'Filial', value: profLimitText(l.branches) },
    { icon: 'box', label: 'Mahsulot', value: profLimitText(l.products) },
    { icon: 'sparkle', label: 'AI so\'rov / oy', value: profLimitText(l.ai) },
  ] as const
}
const order = (id: ProfPlan) => profPlans.findIndex(p => p.id === id)

const selected = ref<ProfPlan | null>(null)
const sel = computed(() => profPlans.find(p => p.id === selected.value))
const isDowngrade = computed(() => !!selected.value && order(selected.value) < order(business.value.plan))
const overLimits = computed(() => {
  if (!selected.value) return []
  const l = planLimits[selected.value]
  const out: string[] = []
  if (employees.value.length > l.employees) out.push(`xodimlar ${employees.value.length} > ${l.employees}`)
  if (branches.value.length > l.branches) out.push(`filiallar ${branches.value.length} > ${l.branches}`)
  if (products.value.length > l.products) out.push(`mahsulotlar ${products.value.length} > ${l.products}`)
  return out
})
const paying = ref(false)

function choose(id: ProfPlan) {
  selection()
  if (id === business.value.plan) return show('Bu sizning joriy tarifingiz', 'info')
  selected.value = id
}
function confirm() {
  if (!selected.value || overLimits.value.length) return
  paying.value = true
  haptic('medium')
  setTimeout(() => {
    const until = new Date()
    until.setMonth(until.getMonth() + Number(period.value))
    business.value = { ...business.value, plan: selected.value!, planUntil: until.toISOString().slice(0, 10) }
    paying.value = false
    show(`${selected.value} tarifi faollashtirildi`)
    selected.value = null
  }, 1200)
}
</script>

<template>
  <PageHeader title="Obuna" subtitle="Tarifingizni tanlang" back="/profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <div class="flex items-center gap-3 rounded-[24px] bg-brand p-4 text-white shadow-float">
      <span class="flex size-11 items-center justify-center rounded-full bg-white/15"><AppIcon name="crown" :size="22" /></span>
      <div class="grow">
        <p class="text-xs font-bold text-white/70">Joriy tarif</p>
        <p class="text-xl font-extrabold">{{ business.plan }}</p>
      </div>
      <div class="text-right">
        <p class="text-xs font-bold text-white/70">Amal qiladi</p>
        <p class="text-sm font-extrabold">{{ formatDate(business.planUntil) }} gacha</p>
      </div>
    </div>

    <Segmented v-model="period" :options="[{ value: '1', label: 'Oylik' }, { value: '12', label: 'Yillik · −20%' }]" />

    <div
      v-for="p in profPlans" :key="p.id"
      class="card relative flex flex-col gap-3 border-2 p-4"
      :class="p.id === business.plan ? 'border-brand' : 'border-transparent'"
    >
      <span v-if="p.id === 'Pro'" class="absolute -top-2.5 right-4 rounded-full bg-[#f9a825] px-2.5 py-0.5 text-[11px] font-extrabold text-ink">Ommabop</span>
      <div class="flex items-start gap-3">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl" :style="{ background: `${p.color}1a`, color: p.color }">
          <AppIcon :name="p.id === 'Start' ? 'store' : p.id === 'Pro' ? 'trend' : 'building'" :size="22" />
        </span>
        <div class="min-w-0 grow">
          <div class="flex items-center gap-2">
            <p class="text-lg font-extrabold">{{ p.id }}</p>
            <Badge v-if="p.id === business.plan" tone="solid">Joriy</Badge>
          </div>
          <p class="text-xs font-medium text-muted">{{ p.desc }}</p>
        </div>
      </div>
      <p>
        <span class="text-[28px] font-extrabold tracking-tight">{{ p.price ? formatSom(priceFor(p.price)) : 'Bepul' }}</span>
        <span v-if="p.price" class="text-sm font-bold text-muted"> so'm / {{ period === '12' ? 'yil' : 'oy' }}</span>
      </p>
      <div class="grid grid-cols-2 gap-2">
        <div v-for="r in rows(p.id)" :key="r.label" class="flex items-center gap-2 rounded-2xl bg-field px-3 py-2.5">
          <AppIcon :name="r.icon" :size="16" class="shrink-0 text-muted" />
          <div class="min-w-0">
            <p class="text-sm leading-tight font-extrabold">{{ r.value }}</p>
            <p class="truncate text-[11px] font-bold text-muted">{{ r.label }}</p>
          </div>
        </div>
      </div>
      <PillButton
        block size="sm" :variant="p.id === business.plan ? 'field' : order(p.id) > order(business.plan) ? 'primary' : 'outline'"
        :disabled="p.id === business.plan" @click="choose(p.id)"
      >
        {{ p.id === business.plan ? 'Joriy tarif' : order(p.id) > order(business.plan) ? `${p.id} ga o'tish` : 'Tanlash' }}
      </PillButton>
    </div>
    <p class="text-center text-xs font-medium text-muted">Narxlar QQS bilan. To'lov Click, Payme yoki bank o'tkazmasi orqali.</p>
  </div>

  <BSheet :model-value="!!selected" title="Tarifni tasdiqlash" @update:model-value="!$event && !paying && (selected = null)">
    <div v-if="sel" class="flex flex-col gap-3">
      <div class="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
        <div class="text-center">
          <p class="text-xs font-bold text-muted">Hozir</p>
          <p class="text-base font-extrabold">{{ current.id }}</p>
        </div>
        <AppIcon name="arrow-right" class="text-brand" />
        <div class="text-center">
          <p class="text-xs font-bold text-muted">Yangi</p>
          <p class="text-base font-extrabold text-brand">{{ sel.id }}</p>
        </div>
      </div>
      <div class="card px-4 py-1">
        <ListRow title="Muddat" :value="period === '12' ? '12 oy' : '1 oy'" :chevron="false" />
        <ListRow title="To'lov" :value="sel.price ? `${formatSom(priceFor(sel.price))} so'm` : 'Bepul'" :chevron="false" />
      </div>
      <div v-if="overLimits.length" class="flex items-start gap-2 rounded-2xl bg-danger-soft p-3 text-[13px] font-semibold text-danger">
        <AppIcon name="alert" :size="18" class="shrink-0" />
        <span>Bu tarifga o'tib bo'lmaydi: {{ overLimits.join(', ') }}. Avval ortiqchalarini o'chiring.</span>
      </div>
      <p v-else-if="isDowngrade" class="flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-[13px] font-semibold text-warn">
        <AppIcon name="info" :size="18" class="shrink-0" />Ba'zi imkoniyatlar cheklanadi.
      </p>
      <p class="text-xs font-medium text-muted">Demo rejim: haqiqiy to'lov olinmaydi.</p>
    </div>
    <template #footer>
      <PillButton block :disabled="paying || overLimits.length > 0" @click="confirm">
        <span v-if="paying" class="size-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
        {{ paying ? 'Faollashtirilmoqda…' : 'Tasdiqlash' }}
      </PillButton>
    </template>
  </BSheet>
</template>
