<script setup lang="ts">
// Savat qatorini tahrirlash: narx va miqdor
const open = defineModel<boolean>({ default: false })
const props = defineProps<{ productId?: string }>()
const { productById } = useStore()
const { cart, setQty, remove, clampDiscount } = usePos()
const { show } = useToast()

const product = computed(() => props.productId ? productById(props.productId) : undefined)
const line = computed(() => cart.value.lines.find(l => l.productId === props.productId))
const qty = ref('')
const price = ref('')
const confirmDel = ref(false)

watch(open, (v) => {
  if (v && line.value) { qty.value = String(line.value.qty); price.value = String(line.value.price); confirmDel.value = false }
})

const fractional = computed(() => product.value?.unit === 'kg' || product.value?.unit === 'litr')
const qtyN = computed(() => Number(String(qty.value).replace(',', '.')))
const priceN = computed(() => Number(String(price.value).replace(/\s/g, '')))

const qtyError = computed(() => {
  if (!String(qty.value).trim() || !Number.isFinite(qtyN.value) || qtyN.value <= 0) return 'Miqdor 0 dan katta bo\'lsin'
  if (!fractional.value && !Number.isInteger(qtyN.value)) return 'Bu mahsulot faqat butun sonda sotiladi'
  if (product.value && qtyN.value > product.value.stock) return `Omborda faqat ${product.value.stock} ${product.value.unit} bor`
  return ''
})
const priceError = computed(() => {
  if (!String(price.value).trim() || !Number.isFinite(priceN.value) || priceN.value <= 0) return 'Narxni kiriting'
  if (!Number.isInteger(priceN.value)) return 'Narx butun son bo\'lsin'
  return ''
})
const belowCost = computed(() => product.value && !priceError.value && priceN.value < product.value.cost)
const valid = computed(() => !qtyError.value && !priceError.value)

function save() {
  if (!valid.value || !line.value) return
  line.value.price = priceN.value
  setQty(line.value.productId, Math.round(qtyN.value * 1000) / 1000)
  clampDiscount()
  show('Qator yangilandi')
  open.value = false
}
function del() {
  if (!confirmDel.value) return (confirmDel.value = true)
  remove(props.productId!)
  clampDiscount()
  show('Savatdan olib tashlandi', 'info')
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="Qatorni tahrirlash">
    <div v-if="product" class="flex flex-col gap-3">
      <div class="flex items-center gap-3 rounded-[18px] bg-card p-3 shadow-card">
        <span class="flex size-12 items-center justify-center rounded-xl bg-field text-2xl">{{ product.emoji }}</span>
        <span class="min-w-0 grow">
          <span class="block truncate text-[15px] font-extrabold">{{ product.name }}</span>
          <span class="block text-xs font-semibold text-muted">Asl narx {{ formatSom(product.price) }} · qoldiq {{ product.stock }} {{ product.unit }}</span>
        </span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <BInput v-model="qty" label="Miqdor" :suffix="product.unit" :inputmode="fractional ? 'decimal' : 'numeric'" :error="qtyError" />
        <BInput v-model="price" label="Narx" suffix="so'm" inputmode="numeric" :error="priceError" />
      </div>
      <p v-if="belowCost" class="rounded-2xl bg-warn-soft px-3 py-2 text-xs font-semibold text-warn">
        Diqqat: narx tannarxdan ({{ formatSom(product.cost) }} so'm) past
      </p>
      <div class="flex items-center justify-between rounded-2xl bg-field px-4 py-3">
        <span class="text-[13px] font-bold text-muted-2">Qator summasi</span>
        <span class="text-[17px] font-extrabold">{{ valid ? formatSom(qtyN * priceN) : '—' }} so'm</span>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2">
        <PillButton variant="danger" icon="trash" :class="confirmDel ? 'grow' : ''" @click="del">{{ confirmDel ? 'Tasdiqlash' : '' }}</PillButton>
        <PillButton v-if="!confirmDel" block icon="check" :disabled="!valid" @click="save">Saqlash</PillButton>
        <PillButton v-else variant="field" @click="confirmDel = false">Bekor</PillButton>
      </div>
    </template>
  </BSheet>
</template>
