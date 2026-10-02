<script setup lang="ts">
import type { PayMethod } from '~/data/types'

// Summa kiritish oynasi (to'lov qabul qilish, balansga qo'shish, to'lov qilish)
const props = defineProps<{ title: string, confirm: string, max?: number, info?: string, maxLabel?: string }>()
const emit = defineEmits<{ submit: [amount: number, method: PayMethod] }>()
const open = defineModel<boolean>({ default: false })

const raw = ref('')
const method = ref<PayMethod>('cash')
watch(open, (v) => {
  if (v) {
    raw.value = ''
    method.value = 'cash'
  }
})
watch(raw, (v) => {
  const d = String(v).replace(/\D/g, '').replace(/^0+/, '').slice(0, 11)
  const f = d ? formatSom(Number(d)) : ''
  if (f !== v) raw.value = f
})
const amount = computed(() => Number(String(raw.value).replace(/\D/g, '')) || 0)

const err = computed(() => {
  if (!raw.value) return ''
  if (amount.value <= 0) return 'Summani kiriting'
  if (props.max != null && amount.value > props.max) return `Ko'pi bilan ${formatSom(props.max)} so'm`
  return ''
})
const valid = computed(() => amount.value > 0 && !err.value)

const quick = computed(() => {
  const list = [50000, 100000, 200000, 500000].filter(x => props.max == null || x < props.max)
  return list.slice(0, 3)
})

function submit() {
  if (!valid.value) return
  emit('submit', amount.value, method.value)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" :title="title">
    <div class="flex flex-col gap-3.5">
      <p v-if="info" class="rounded-2xl bg-soft px-4 py-3 text-[13px] font-semibold text-muted-2">{{ info }}</p>
      <BInput v-model="raw" label="Summa" placeholder="0" inputmode="numeric" suffix="so'm" icon="wallet" :error="err" />
      <div class="flex flex-wrap gap-2">
        <button
          v-if="max" type="button" class="h-9 rounded-full bg-brand px-3.5 text-[13px] font-bold text-white"
          @click="raw = formatSom(max)"
        >
          {{ maxLabel ?? 'To\'liq' }}: {{ formatSom(max) }}
        </button>
        <button
          v-for="q in quick" :key="q" type="button" class="h-9 rounded-full bg-card px-3.5 text-[13px] font-bold text-muted-2 shadow-card"
          @click="raw = formatSom(q)"
        >
          {{ formatSom(q) }}
        </button>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">To'lov turi</span>
        <Chips v-model="method" :options="contactPayMethods" />
      </div>
    </div>
    <template #footer>
      <PillButton block :disabled="!valid" icon="check" @click="submit">
        {{ confirm }}<template v-if="valid"> · {{ formatSom(amount) }} so'm</template>
      </PillButton>
    </template>
  </BSheet>
</template>
