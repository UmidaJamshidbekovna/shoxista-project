<script setup lang="ts">
// Obuna (Profile.md §9): joriy tarif kartasi (foydalanish chiziqlari) + tariflar ro'yxati
import type { Plan } from '~/data/types'
import { planLimits } from '~/data/labels'

const { business, employees } = useStore()
const { show } = useToast()

/** AI xabarlar (oy) — namunaviy foydalanish */
const AI_USED = 1240

const plan = computed(() => business.value.plan)
const limits = computed(() => planLimits[plan.value])
const staffCount = computed(() => employees.value.filter(e => e.role !== 'owner').length)

const pct = (used: number, limit: number) => Number.isFinite(limit) ? Math.min(100, Math.round((used / Math.max(1, limit)) * 100)) : Math.min(100, Math.round(used / 50))
const usage = computed(() => {
  const u = [{ label: 'Xodimlar', used: staffCount.value, limit: limits.value.employees }]
  if (limits.value.ai) u.push({ label: 'AI xabarlar (oy)', used: AI_USED, limit: limits.value.ai })
  return u.map(x => ({ ...x, value: `${formatSom(x.used)} / ${profLimit(x.limit)}`, pct: pct(x.used, x.limit) }))
})

function addMonth(from: string) {
  const d = new Date(Math.max(new Date(from).getTime(), Date.now()))
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function renew() {
  business.value = { ...business.value, planUntil: addMonth(business.value.planUntil) }
  show(`Obuna ${profDateUz(business.value.planUntil)}gacha uzaytirildi`)
}

function switchTo(id: Plan) {
  const until = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  business.value = { ...business.value, plan: id, planUntil: until }
  show(`${id} tarifiga o'tildi`)
}
</script>

<template>
  <ProfPage>
    <ProfHeader title="Obuna" />

    <!-- Joriy tarif -->
    <div class="grid gap-4 rounded-3xl bg-brand p-[18px] text-white">
      <div class="flex items-center gap-2">
        <span class="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] text-[#4ade80]">FAOL</span>
        <span class="text-[12px] text-[#aab0b8]">{{ profDateUz(business.planUntil) }}gacha</span>
      </div>
      <div>
        <p class="text-[28px] leading-tight font-extrabold tracking-[-0.02em]">{{ plan }}</p>
        <p class="mt-0.5 text-[14px] text-[#c7ccd3]">{{ profPlanPrice(plan) }}</p>
      </div>
      <div class="grid gap-3">
        <div v-for="u in usage" :key="u.label" class="grid gap-1.5">
          <div class="flex items-center justify-between text-[12.5px]">
            <span class="text-[#c7ccd3]">{{ u.label }}</span>
            <span class="font-extrabold">{{ u.value }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-[#2a2d31]">
            <div class="h-full rounded-full bg-[#4ade80] transition-[width] duration-300" :style="{ width: `${u.pct}%` }" />
          </div>
        </div>
      </div>
      <button type="button" class="h-11 rounded-full bg-white text-[13px] font-extrabold text-ink transition-transform active:scale-[0.98]" @click="renew">
        Obunani uzaytirish
      </button>
    </div>

    <!-- Tariflar -->
    <ProfSection title="Tariflar">
      <div class="grid gap-2.5">
        <article
          v-for="p in profPlans" :key="p.id"
          class="grid gap-3 rounded-[22px] border-2 bg-card p-4"
          :class="p.id === plan ? 'border-brand' : 'border-transparent'"
        >
          <div class="flex items-center gap-3">
            <div class="min-w-0 grow">
              <p class="text-[16px] font-extrabold text-ink">{{ p.id }}</p>
              <p class="text-[13px] text-muted">{{ profPlanPrice(p.id) }}</p>
            </div>
            <span v-if="p.id === plan" class="shrink-0 rounded-full bg-[#e7f7ec] px-3.5 py-2 text-[12.5px] font-extrabold text-[#15803d]">Joriy tarif</span>
            <button
              v-else type="button"
              class="h-9 shrink-0 rounded-full bg-brand px-4 text-[12.5px] font-extrabold text-white transition-transform active:scale-95"
              @click="switchTo(p.id)"
            >
              O'tish
            </button>
          </div>
          <ul class="grid gap-1.5">
            <li v-for="f in p.features" :key="f" class="flex items-center gap-2 text-[12.5px] text-[#5b616b]">
              <AppIcon name="check" :size="14" :stroke="2.4" class="shrink-0 text-[#15803d]" />{{ f }}
            </li>
          </ul>
        </article>
      </div>
    </ProfSection>
  </ProfPage>
</template>
