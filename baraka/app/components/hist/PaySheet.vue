<script setup lang="ts">
import type { PayMethod, Transaction } from '~/data/types'
import type { IconName } from '../AppIcon.vue'
import { methodIcon, methodLabel } from '~/data/labels'

const props = defineProps<{ tx: Transaction }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ paid: [amount: number, method: PayMethod] }>()
const { selection } = useTelegram()

const remaining = computed(() => Math.max(0, props.tx.total - props.tx.paid))
const amountStr = ref('')
const method = ref<PayMethod>('cash')

watch(open, (v) => {
  if (!v) return
  amountStr.value = String(remaining.value)
  method.value = props.tx.method === 'balance' ? 'cash' : props.tx.method
})

const amount = computed(() => Number(String(amountStr.value).replace(/\D/g, '')) || 0)
const error = computed(() => {
  if (!String(amountStr.value).trim()) return 'Summani kiriting'
  if (amount.value <= 0) return 'Summa 0 dan katta bo\'lishi kerak'
  if (amount.value > remaining.value) return `Qoldiqdan oshmasin: ${formatSom(remaining.value)} so'm`
  return ''
})

const methods: PayMethod[] = ['cash', 'card', 'click', 'payme', 'transfer']
const quick = computed(() => {
  const r = remaining.value
  return [...new Set([Math.round(r / 4 / 1000) * 1000, Math.round(r / 2 / 1000) * 1000, r])].filter(v => v > 0)
})

function submit() {
  if (error.value) return
  emit('paid', amount.value, method.value)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" :title="tx.kind === 'sale' ? 'To\'lov qabul qilish' : 'To\'lov qilish'">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-2.5">
        <div class="rounded-2xl bg-card p-3 shadow-card">
          <p class="text-xs font-semibold text-muted">To'langan</p>
          <p class="text-base font-extrabold">{{ formatSom(tx.paid) }}</p>
        </div>
        <div class="rounded-2xl bg-card p-3 shadow-card">
          <p class="text-xs font-semibold text-muted">Qoldiq</p>
          <p class="text-base font-extrabold text-danger">{{ formatSom(remaining) }}</p>
        </div>
      </div>

      <BInput
        v-model="amountStr" label="Summa" inputmode="numeric" suffix="so'm" placeholder="0"
        :error="error"
      />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="q in quick" :key="q" type="button"
          class="h-8 rounded-full px-3 text-xs font-bold"
          :class="amount === q ? 'bg-brand text-white' : 'bg-card text-muted-2 shadow-card'"
          @click="amountStr = String(q); selection()"
        >
          {{ q === remaining ? 'To\'liq' : formatSom(q) }}
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-[13px] font-bold text-muted-2">To'lov turi</span>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in methods" :key="m" type="button"
            class="flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs font-bold transition-colors"
            :class="method === m ? 'border-brand bg-soft text-brand' : 'border-transparent bg-card text-muted-2 shadow-card'"
            @click="method = m; selection()"
          >
            <AppIcon :name="methodIcon[m] as IconName" :size="20" />
            {{ methodLabel[m] }}
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!!error" @click="submit">
        {{ error ? 'Saqlash' : `${formatSom(amount)} so'm ${tx.kind === 'sale' ? 'qabul qilish' : 'to\'lash'}` }}
      </PillButton>
    </template>
  </BSheet>
</template>
