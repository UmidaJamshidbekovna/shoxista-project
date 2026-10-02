<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'
import type { PayMethod } from '~/composables/useCart'

const { lines, subtotal, discount, total, customer, method, cashPart, add, dec, checkout } = useCart()
const { haptic, notify, scanQr } = useTelegram()
const router = useRouter()

const methods: { id: PayMethod, label: string, icon: IconName }[] = [
  { id: 'naqd', label: 'Naqd', icon: 'cash' },
  { id: 'karta', label: 'Karta', icon: 'card' },
  { id: 'qarz', label: 'Qarzga', icon: 'dollar' },
  { id: 'aralash', label: 'Aralash', icon: 'percent' },
]

// Aralash to'lov: naqd kiritiladi, karta qismi avtomatik hisoblanadi
const cashText = computed({
  get: () => formatSom(cashPart.value),
  set: (v: string) => { cashPart.value = Math.min(Number(v.replace(/\D/g, '')) || 0, total.value) },
})
const cardPart = computed(() => Math.max(0, total.value - cashPart.value))

function confirm() {
  if (!lines.value.length) return
  checkout()
  notify('success')
  router.replace('/chek')
}
</script>

<template>
  <ScreenHeader title="Savat" back="/">
    <IconButton icon="barcode" label="Shtrix-kod bilan qo'shish" @click="scanQr()" />
  </ScreenHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-3">
    <div v-if="customer" class="rounded-[18px] border border-line bg-surface px-3.5 py-3">
      <div class="flex items-center gap-3">
        <LetterTile :text="customer.initials" bg="#E6EBFA" fg="#2849A8" :size="40" :radius="20" :font-size="14" />
        <div class="grow">
          <div class="text-xs text-muted">Mijoz</div>
          <div class="text-[15px] font-semibold">{{ customer.name }}</div>
        </div>
        <Tag v-if="customer.debt" tone="warn">Qarzi: {{ formatSom(customer.debt) }}</Tag>
      </div>
    </div>

    <div class="rounded-[18px] border border-line bg-surface px-4 pt-1 pb-4">
      <div v-for="l in lines" :key="l.product.id" class="flex items-center gap-3 border-b border-line py-3">
        <div class="min-w-0 grow">
          <div class="text-[15px] font-semibold">{{ l.product.name }}</div>
          <div class="mt-0.5 text-[13px] text-muted">{{ l.qty }} × {{ formatSom(l.product.price) }} so'm</div>
        </div>
        <div class="flex shrink-0 items-center gap-1 rounded-xl bg-chip p-0.5">
          <button type="button" aria-label="Kamaytirish" class="flex size-8 items-center justify-center rounded-[10px] bg-surface text-ink" @click="dec(l.product); haptic()">
            <AppIcon name="minus" :size="16" />
          </button>
          <span class="w-6 text-center font-bold">{{ l.qty }}</span>
          <button type="button" aria-label="Ko'paytirish" class="flex size-8 items-center justify-center rounded-[10px] bg-surface text-ink" @click="add(l.product); haptic()">
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
        <div class="w-[76px] shrink-0 text-right text-[15px] font-bold">{{ formatSom(l.qty * l.product.price) }}</div>
      </div>
      <p v-if="!lines.length" class="py-6 text-center text-sm text-muted">Savat bo'sh</p>

      <div class="flex justify-between pt-3 pb-1 text-sm text-muted">
        <span>Oraliq summa</span><span>{{ formatSom(subtotal) }} so'm</span>
      </div>
      <div v-if="discount" class="flex items-center justify-between py-1 text-sm">
        <span class="flex items-center gap-1.5 text-muted">Chegirma <Tag tone="brand">Mijoz kartasi</Tag></span>
        <span class="font-semibold text-brand">−{{ formatSom(discount) }} so'm</span>
      </div>
      <div class="mt-1.5 flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
        <span class="text-[15px] font-semibold">Jami</span>
        <span class="font-display text-[26px] font-bold">{{ formatSom(total) }} so'm</span>
      </div>
    </div>

    <SectionTitle>To'lov usuli</SectionTitle>
    <div class="flex gap-2">
      <button
        v-for="m in methods" :key="m.id" type="button"
        class="flex h-16 grow basis-0 flex-col items-center justify-center gap-1 rounded-[14px] text-[13px] font-semibold"
        :class="method === m.id ? 'border-2 border-brand bg-brand-soft text-brand' : 'border border-line bg-surface text-ink'"
        @click="method = m.id; haptic()"
      >
        <AppIcon :name="m.icon" />{{ m.label }}
      </button>
    </div>

    <div v-if="method === 'aralash'" class="flex gap-2.5">
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Naqd</span>
        <span class="flex h-[50px] items-center rounded-[14px] border border-line bg-surface px-3.5">
          <input v-model="cashText" inputmode="numeric" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none">
        </span>
      </label>
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Karta</span>
        <span class="flex h-[50px] items-center rounded-[14px] border border-line bg-surface px-3.5">
          <input :value="formatSom(cardPart)" readonly class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none">
        </span>
      </label>
    </div>
  </div>

  <div class="pb-safe flex shrink-0 border-t border-line bg-surface">
    <div class="flex grow px-5 pt-3 pb-5">
      <AppButton icon="check" :class="{ 'opacity-50': !lines.length }" @click="confirm">
        To'lovni tasdiqlash · {{ formatSom(total) }}
      </AppButton>
    </div>
  </div>
</template>
