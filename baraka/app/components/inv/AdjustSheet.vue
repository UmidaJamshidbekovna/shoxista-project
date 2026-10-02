<script setup lang="ts">
// Qoldiqni tuzatish: kirim / hisobdan chiqarish / inventarizatsiya
import type { Product } from '~/data/types'
import type { AdjustReason } from '~/composables/useInv'

const props = defineProps<{ product: Product, reason?: AdjustReason }>()
const open = defineModel<boolean>({ default: false })

const { adjust } = useInv()
const { show } = useToast()
const { haptic, selection } = useTelegram()

const REASONS = [
  { value: 'in', label: 'Kirim' },
  { value: 'writeoff', label: 'Chiqarish' },
  { value: 'count', label: 'Inventar' },
]
const WRITEOFF_NOTES = ['Yaroqsiz', 'Muddati o\'tgan', 'Shikastlangan', 'Ichki ehtiyoj']

const reason = ref<AdjustReason>('in')
const qty = ref('')
const note = ref('')
const touched = ref(false)

watch(open, (v) => {
  if (!v) return
  reason.value = props.reason ?? 'in'
  qty.value = reason.value === 'count' ? String(props.product.stock) : ''
  note.value = ''
  touched.value = false
})
watch(reason, (r) => {
  qty.value = r === 'count' ? String(props.product.stock) : ''
  touched.value = false
})

const n = computed(() => invParseNum(qty.value))
const error = computed(() => {
  if (Number.isNaN(n.value)) return 'Miqdorni kiriting'
  if (props.product.unit === 'dona' || props.product.unit === 'qadoq') {
    if (!Number.isInteger(n.value)) return 'Butun son kiriting'
  }
  if (reason.value === 'count') return n.value < 0 ? 'Manfiy bo\'lmasin' : n.value === props.product.stock ? 'Qoldiq o\'zgarmadi' : ''
  if (n.value <= 0) return 'Miqdor 0 dan katta bo\'lishi kerak'
  if (reason.value === 'writeoff' && n.value > props.product.stock) return `Omborda faqat ${props.product.stock} ${props.product.unit} bor`
  return ''
})
const after = computed(() => {
  if (error.value) return null
  return reason.value === 'in' ? props.product.stock + n.value : reason.value === 'writeoff' ? props.product.stock - n.value : n.value
})

function step(d: number) {
  const cur = Number.isNaN(n.value) ? 0 : n.value
  qty.value = String(Math.max(0, cur + d))
  touched.value = true
  selection()
}

function save() {
  if (error.value) return
  adjust(props.product, reason.value, n.value, note.value.trim())
  haptic('medium')
  show(`Qoldiq yangilandi: ${props.product.stock} ${props.product.unit}`)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="Qoldiqni o'zgartirish">
    <div class="flex flex-col gap-4">
      <Segmented v-model="reason" :options="REASONS" />
      <p class="-mt-1 text-xs font-medium text-muted">
        <template v-if="reason === 'in'">Omborga qo'shimcha mahsulot qabul qilish.</template>
        <template v-else-if="reason === 'writeoff'">Yaroqsiz, shikastlangan yoki ichki ehtiyoj uchun hisobdan chiqarish.</template>
        <template v-else>Sanab chiqilgan haqiqiy qoldiqni kiriting.</template>
      </p>

      <div class="card flex items-center gap-3 p-3">
        <button type="button" aria-label="Kamaytirish" class="flex size-12 shrink-0 items-center justify-center rounded-full bg-field active:scale-95" @click="step(-1)">
          <AppIcon name="minus" />
        </button>
        <input
          v-model="qty" inputmode="decimal" placeholder="0" aria-label="Miqdor"
          class="min-w-0 grow bg-transparent text-center text-[30px] font-extrabold outline-none placeholder:text-muted"
          @input="touched = true"
        >
        <button type="button" aria-label="Ko'paytirish" class="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white active:scale-95" @click="step(1)">
          <AppIcon name="plus" />
        </button>
      </div>
      <p v-if="touched && error" class="-mt-2 text-xs font-semibold text-danger">{{ error }}</p>

      <div class="flex items-center justify-between rounded-2xl bg-soft px-4 py-3 text-sm font-bold">
        <span class="text-muted-2">Hozir: {{ product.stock }} {{ product.unit }}</span>
        <AppIcon name="arrow-right" :size="16" class="text-muted" />
        <span class="text-brand">Keyin: {{ after ?? '—' }} {{ product.unit }}</span>
      </div>

      <div v-if="reason === 'writeoff'" class="flex flex-wrap gap-2">
        <button
          v-for="w in WRITEOFF_NOTES" :key="w" type="button"
          class="h-8 rounded-full px-3 text-xs font-bold"
          :class="note === w ? 'bg-brand text-white' : 'bg-card text-muted-2 shadow-card'"
          @click="note = w; selection()"
        >
          {{ w }}
        </button>
      </div>
      <BInput v-model="note" label="Izoh" placeholder="Ixtiyoriy" :maxlength="80" />
    </div>
    <template #footer>
      <PillButton block :disabled="!!error" :variant="reason === 'writeoff' ? 'danger' : 'primary'" @click="save">
        {{ reason === 'in' ? 'Kirim qilish' : reason === 'writeoff' ? 'Hisobdan chiqarish' : 'Qoldiqni tasdiqlash' }}
      </PillButton>
    </template>
  </BSheet>
</template>
