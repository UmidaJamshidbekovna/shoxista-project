<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

definePageMeta({ tab: true })

const { haptic, notify } = useTelegram()

const NuxtLink = resolveComponent('NuxtLink')
const phone = '+998712000000'
const actions: { label: string, icon: IconName, href?: string, to?: string }[] = [
  { label: "Qo'ng'iroq", icon: 'phone', href: `tel:${phone}` },
  { label: 'Xabar', icon: 'message', to: '/xabarlar' },
  { label: "To'lov", icon: 'cash' },
  { label: 'Akt sverka', icon: 'file' },
]

// AI taklif: kam qolgan mahsulotlar
const order = ref([
  { name: 'Guruch lazer 1 kg', stock: 8, min: 20, qty: '50 kg', on: true },
  { name: 'Shakar 1 kg', stock: 4, min: 15, qty: '40 kg', on: true },
  { name: 'Makaron 400 g', stock: 11, min: 24, qty: '48 dona', on: true },
])
const sent = ref(false)
const anySelected = computed(() => order.value.some(o => o.on))

function sendOrder() {
  if (!anySelected.value || sent.value) return
  sent.value = true
  notify('success')
}

const payments = [
  { date: '20.09', label: "To'lov · naqd", amount: -1500000 },
  { date: '18.09', label: 'Kirim №1174', amount: 2850000 },
  { date: '11.09', label: "To'lov · o'tkazma", amount: -3000000 },
]
</script>

<template>
  <ScreenHeader title="Baraka Savdo MChJ" subtitle="Firma · Ta'minotchi" back="/kontaktlar" />

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-5">
    <div class="flex items-center justify-between rounded-[18px] bg-danger-soft p-4 text-danger">
      <div>
        <div class="text-xs font-semibold">Bizning qarzimiz</div>
        <div class="font-display text-[28px] font-bold">{{ formatSom(4200000) }} so'm</div>
        <div class="text-xs">Muddat: 30.09.2026</div>
      </div>
    </div>

    <div class="flex gap-2">
      <component
        :is="a.to ? NuxtLink : a.href ? 'a' : 'button'"
        v-for="a in actions" :key="a.label"
        :to="a.to" :href="a.href" :type="a.to || a.href ? undefined : 'button'"
        class="flex h-16 grow basis-0 flex-col items-center justify-center gap-1 rounded-[14px] border border-line bg-surface text-xs font-semibold text-ink"
        @click="haptic()"
      >
        <AppIcon :name="a.icon" />{{ a.label }}
      </component>
    </div>

    <SectionTitle>
      Buyurtma berish
      <template #action><Tag tone="brand">AI taklif</Tag></template>
    </SectionTitle>
    <div class="rounded-[18px] border border-line bg-surface px-3.5 pt-3 pb-3.5">
      <div class="mb-1 text-[13px] text-muted">Kam qolgan mahsulotlar asosida tayyorlandi</div>
      <label v-for="o in order" :key="o.name" class="flex items-center gap-3 border-b border-line py-2.5">
        <input v-model="o.on" type="checkbox" class="size-5 accent-brand" :disabled="sent" @change="haptic()">
        <span class="grow">
          <span class="block text-sm font-semibold">{{ o.name }}</span>
          <span class="block text-xs text-warn">Qoldiq {{ o.stock }} · min {{ o.min }}</span>
        </span>
        <span class="text-sm font-bold">{{ o.qty }}</span>
      </label>
      <div class="mt-3 flex gap-2.5">
        <AppButton :icon="sent ? 'check' : 'send'" :class="{ 'opacity-50': !anySelected && !sent }" @click="sendOrder">
          {{ sent ? 'Buyurtma yuborildi' : 'Buyurtmani yuborish' }}
        </AppButton>
      </div>
    </div>

    <SectionTitle>To'lovlar tarixi</SectionTitle>
    <div class="rounded-[18px] border border-line bg-surface px-3.5 py-1.5">
      <div v-for="p in payments" :key="p.date + p.label" class="flex justify-between py-2 text-sm">
        <span><span class="mr-2 text-muted">{{ p.date }}</span>{{ p.label }}</span>
        <span class="font-bold" :class="p.amount < 0 ? 'text-brand' : 'text-danger'">
          {{ p.amount < 0 ? '−' : '+' }}{{ formatSom(Math.abs(p.amount)) }}
        </span>
      </div>
    </div>
  </div>
</template>
