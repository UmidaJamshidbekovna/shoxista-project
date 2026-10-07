<script setup lang="ts">
// Mahsulot tahrirlash / yaratish sheet (Stock and History.md §9).
// `product` berilsa — "Mahsulotni tahrirlash", aks holda — "Yangi mahsulot".
import type { Product, ProductUnit } from '~/data/types'

/** barcode — yangi mahsulot uchun oldindan ma'lum shtrix-kod (masalan, Kirim skaneridan) */
const props = defineProps<{ product?: Product | null, barcode?: string }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [p: Product] }>()

const store = useStore()
const { show } = useToast()
const { haptic, selection } = useTelegram()
const inv = useInv()

const isEdit = computed(() => !!props.product)
const cats = computed(() => [...store.categories.value].sort((a, b) => a.order - b.order))
const suppliers = computed(() => store.organizations.value.filter(o => o.type === 'supplier'))

const blank = () => ({
  images: [] as string[], name: '', categoryId: '', unit: 'dona' as ProductUnit, supplierId: '',
  price: '', stock: '0', minStock: '5', description: '',
})
const form = reactive(blank())
const tried = ref(false)
const fileEl = ref<HTMLInputElement>()

watch(open, (v) => {
  if (!v) return
  const p = props.product
  Object.assign(form, p
    ? {
        images: [...productImages(p)], name: p.name, categoryId: p.categoryId, unit: p.unit, supplierId: p.supplierId ?? '',
        price: String(p.price), stock: String(p.stock), minStock: String(p.minStock), description: p.description ?? '',
      }
    : blank())
  tried.value = false
}, { immediate: true })

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.name.trim()) e.name = 'Mahsulot nomini kiriting'
  const price = parseNum(form.price)
  if (!(price > 0)) e.price = 'Narxni kiriting (0 dan katta)'
  const st = parseNum(form.stock)
  if (form.stock !== '' && (Number.isNaN(st) || st < 0)) e.stock = 'Qoldiq 0 yoki undan katta'
  const ms = parseNum(form.minStock)
  if (form.minStock !== '' && (Number.isNaN(ms) || ms < 0)) e.minStock = 'Minimal qoldiq 0 yoki undan katta'
  return e
})
const err = (k: string) => tried.value ? errors.value[k] : undefined
const errorCount = computed(() => Object.keys(errors.value).length)

function pickCategory(id: string) {
  selection()
  form.categoryId = id
  // Kategoriya bo'yicha standart tavsif (faqat Tavsif bo'sh bo'lsa)
  if (!form.description.trim()) form.description = categoryDefaultDesc(store.categoryById(id)?.name)
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  for (const f of Array.from(input.files ?? [])) {
    if (!f.type.startsWith('image/')) continue
    const r = new FileReader()
    r.onload = () => { if (typeof r.result === 'string') form.images.push(r.result) }
    r.readAsDataURL(f)
  }
  input.value = ''
}

function autoSku(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'MH'
  return `${letters}-${String(store.products.value.length + 1).padStart(3, '0')}`
}
function genBarcode() {
  let code = '478'
  for (let i = 0; i < 9; i++) code += Math.floor(Math.random() * 10)
  const sum = [...code].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  return code + ((10 - (sum % 10)) % 10)
}

function save() {
  tried.value = true
  if (errorCount.value) {
    haptic('light')
    return
  }
  const price = parseNum(form.price)
  const data = {
    name: form.name.trim(),
    categoryId: form.categoryId,
    unit: form.unit,
    supplierId: form.supplierId || undefined,
    price,
    stock: form.stock === '' ? 0 : parseNum(form.stock),
    minStock: form.minStock === '' ? 0 : parseNum(form.minStock),
    description: form.description.trim(),
    images: [...form.images],
    image: undefined,
  }
  let saved: Product
  if (props.product) {
    // Qoldiq o'zgarishi inventarizatsiya sifatida ledger orqali (tuzatishlar jurnaliga yoziladi)
    const { stock, ...rest } = data
    Object.assign(props.product, rest)
    if (stock !== props.product.stock) inv.adjust(props.product, 'count', stock, 'Mahsulot tahrirlandi')
    saved = props.product
    show('Mahsulot saqlandi')
  }
  else {
    saved = {
      id: uid('p'), sku: autoSku(data.name), barcode: props.barcode || genBarcode(), cost: Math.round(price * 0.8),
      warehouseId: store.warehouses.value[0]?.id ?? 'w1', emoji: '📦',
      tint: PRODUCT_TINTS[store.products.value.length % PRODUCT_TINTS.length], rating: 0, reviews: [],
      ...data,
    }
    store.products.value = [...store.products.value, saved]
    show('Mahsulot qo\'shildi')
  }
  haptic('medium')
  emit('saved', saved)
  open.value = false
}

const chip = (on: boolean) => on
  ? 'border-brand bg-brand text-white'
  : 'border-[#e4e7eb] bg-card text-ink'
</script>

<template>
  <BSheet v-model="open" :title="isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'" tone="card" full>
    <div class="flex flex-col gap-4 pb-2">
      <div v-if="tried && errorCount" class="flex items-center gap-2 rounded-2xl bg-[#fdecec] px-3.5 py-3 text-[13px] font-bold text-[#d93036]">
        <AppIcon name="alert" :size="17" class="shrink-0" />
        Saqlash uchun {{ errorCount }} ta maydonni to'g'rilang — nom va narx majburiy
      </div>

      <!-- Rasmlar -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Rasmlar</span>
        <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <div v-for="(src, i) in form.images" :key="i" class="relative size-[72px] shrink-0 overflow-hidden rounded-2xl bg-field">
            <img :src="src" alt="" class="size-full object-cover">
            <button
              type="button" aria-label="Rasmni o'chirish"
              class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
              @click="form.images.splice(i, 1)"
            >
              <AppIcon name="x" :size="13" :stroke="2.4" />
            </button>
          </div>
          <button
            type="button"
            class="flex size-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#c9d1d9] bg-[#f6f7f9] text-muted"
            @click="fileEl?.click()"
          >
            <AppIcon name="camera" :size="20" :stroke="1.9" />
            <span class="text-[10.5px] font-bold">Qo'shish</span>
          </button>
        </div>
        <input ref="fileEl" type="file" accept="image/*" multiple class="hidden" @change="onFiles">
      </div>

      <BInput v-model="form.name" label="Nomi *" placeholder="Masalan: Coca-Cola 1.5 L" :error="err('name')" />

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Kategoriya</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in cats" :key="c.id" type="button"
            class="rounded-[18px] border px-[13px] py-2 text-[12.5px] font-bold transition-colors" :class="chip(form.categoryId === c.id)"
            @click="pickCategory(c.id)"
          >
            {{ c.name }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">O'lchov birligi</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="u in PRODUCT_UNITS" :key="u" type="button"
            class="rounded-[18px] border px-[13px] py-2 text-[12.5px] font-bold transition-colors" :class="chip(form.unit === u)"
            @click="form.unit = u; selection()"
          >
            {{ u }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Ta'minotchi</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in suppliers" :key="o.id" type="button"
            class="rounded-[18px] border px-[13px] py-2 text-[12.5px] font-bold transition-colors" :class="chip(form.supplierId === o.id)"
            @click="form.supplierId = form.supplierId === o.id ? '' : o.id; selection()"
          >
            {{ o.name }}
          </button>
        </div>
      </div>

      <BInput v-model="form.price" label="Narx *" inputmode="numeric" placeholder="0" suffix="so'm" :error="err('price')" />
      <div class="grid grid-cols-2 gap-3">
        <BInput v-model="form.stock" label="Qoldiq" inputmode="decimal" placeholder="0" :suffix="form.unit" :error="err('stock')" />
        <BInput v-model="form.minStock" label="Minimal qoldiq" inputmode="decimal" placeholder="0" :suffix="form.unit" :error="err('minStock')" />
      </div>
      <BInput v-model="form.description" label="Tavsif" placeholder="Mahsulot haqida qisqacha" multiline :maxlength="400" />
    </div>

    <template #footer>
      <PillButton block icon="check" @click="save">{{ isEdit ? 'Saqlash' : 'Qo\'shish' }}</PillButton>
    </template>
  </BSheet>
</template>
