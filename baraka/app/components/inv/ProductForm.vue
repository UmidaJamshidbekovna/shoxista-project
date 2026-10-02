<script setup lang="ts">
// Mahsulot yaratish / tahrirlash drawer'i (validatsiya bilan)
import type { Product } from '~/data/types'

const props = defineProps<{ product?: Product | null, barcode?: string }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [p: Product] }>()

const store = useStore()
const { show } = useToast()
const { haptic, selection } = useTelegram()

const EMOJIS = ['📦', '🍚', '🥛', '🌻', '🍵', '🥚', '🥤', '🍫', '🧺', '🍞', '🧀', '🍎', '🍌', '🥩', '🐟', '🧃', '☕', '🍬', '🍪', '🥫', '🧴', '🧼', '🧻', '🌶️']
const UNITS = [
  { value: 'dona', label: 'Dona' },
  { value: 'kg', label: 'Kg' },
  { value: 'litr', label: 'Litr' },
  { value: 'qadoq', label: 'Qadoq' },
]

const blank = () => ({
  name: '', emoji: '📦', categoryId: '', unit: 'dona' as Product['unit'], price: '', cost: '', barcode: props.barcode ?? '',
  sku: '', minStock: '5', stock: '0', warehouseId: store.warehouses.value[0]?.id ?? 'w1',
})
const form = reactive(blank())
const dirty = ref(new Set<string>())
const tried = ref(false)
const emojiOpen = ref(false)

const isEdit = computed(() => !!props.product)
const cats = computed(() => [...store.categories.value].sort((a, b) => a.order - b.order))

watch(open, (v) => {
  if (!v) return
  const p = props.product
  Object.assign(form, p
    ? { name: p.name, emoji: p.emoji, categoryId: p.categoryId, unit: p.unit, price: String(p.price), cost: String(p.cost), barcode: p.barcode, sku: p.sku, minStock: String(p.minStock), stock: String(p.stock), warehouseId: p.warehouseId }
    : blank())
  tried.value = false
  emojiOpen.value = false
  nextTick(() => { dirty.value = new Set() })
}, { immediate: true })

watch(() => ({ ...form }), (n, o) => {
  for (const k of Object.keys(n) as (keyof typeof n)[]) if (n[k] !== o[k]) dirty.value.add(k)
})

const errors = computed(() => {
  const e: Record<string, string> = {}
  const name = form.name.trim()
  if (!name) e.name = 'Mahsulot nomini kiriting'
  else if (name.length < 2) e.name = 'Nom juda qisqa'
  const price = invParseNum(form.price)
  if (!(price > 0)) e.price = 'Narx 0 dan katta bo\'lishi kerak'
  const cost = invParseNum(form.cost)
  if (Number.isNaN(cost) || cost < 0) e.cost = 'Tannarx 0 yoki undan katta bo\'lishi kerak'
  const bc = form.barcode.trim()
  if (!/^\d{8,13}$/.test(bc)) e.barcode = 'Shtrix-kod 8–13 ta raqamdan iborat bo\'lishi kerak'
  else if (store.products.value.some(p => p.barcode === bc && p.id !== props.product?.id)) e.barcode = 'Bu shtrix-kod boshqa mahsulotda bor'
  if (!form.categoryId) e.categoryId = 'Kategoriyani tanlang'
  const ms = invParseNum(form.minStock)
  if (Number.isNaN(ms) || ms < 0) e.minStock = 'Minimal qoldiq 0 yoki undan katta'
  if (!isEdit.value) {
    const st = invParseNum(form.stock)
    if (Number.isNaN(st) || st < 0) e.stock = 'Qoldiq 0 yoki undan katta'
  }
  return e
})
const valid = computed(() => Object.keys(errors.value).length === 0)
const err = (k: string) => (tried.value || dirty.value.has(k)) ? errors.value[k] : undefined

const margin = computed(() => {
  const price = invParseNum(form.price)
  const cost = invParseNum(form.cost)
  if (!(price > 0) || Number.isNaN(cost)) return null
  return Math.round(((price - cost) / price) * 100)
})

function genBarcode() {
  let code = '478'
  for (let i = 0; i < 9; i++) code += Math.floor(Math.random() * 10)
  const sum = [...code].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  form.barcode = code + ((10 - (sum % 10)) % 10)
  selection()
}

function autoSku(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'MH'
  return `${letters}-${String(store.products.value.length + 1).padStart(3, '0')}`
}

function save() {
  tried.value = true
  if (!valid.value) return
  const data = {
    name: form.name.trim(),
    emoji: form.emoji,
    categoryId: form.categoryId,
    unit: form.unit,
    price: invParseNum(form.price),
    cost: invParseNum(form.cost),
    barcode: form.barcode.trim(),
    sku: form.sku.trim() || autoSku(form.name),
    minStock: invParseNum(form.minStock),
    warehouseId: form.warehouseId,
  }
  let saved: Product
  if (props.product) {
    Object.assign(props.product, data)
    saved = props.product
    show('Mahsulot saqlandi')
  }
  else {
    saved = { id: `p${Date.now()}`, stock: invParseNum(form.stock), ...data }
    store.products.value = [...store.products.value, saved]
    show('Mahsulot qo\'shildi')
  }
  haptic('medium')
  emit('saved', saved)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" :title="isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'" full>
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button" class="flex size-[72px] shrink-0 items-center justify-center rounded-[22px] bg-card text-[38px] shadow-card"
          aria-label="Belgini tanlash" @click="emojiOpen = !emojiOpen"
        >
          {{ form.emoji }}
        </button>
        <div class="min-w-0 grow">
          <p class="text-[13px] font-bold text-muted-2">Belgi</p>
          <p class="text-xs font-medium text-muted">Rasm o'rniga ko'rsatiladi. Bosing va tanlang.</p>
        </div>
      </div>
      <div v-if="emojiOpen" class="card grid animate-fade-in grid-cols-8 gap-1 p-2">
        <button
          v-for="e in EMOJIS" :key="e" type="button"
          class="flex aspect-square items-center justify-center rounded-xl text-[22px]"
          :class="form.emoji === e ? 'bg-soft ring-2 ring-brand' : 'active:bg-field'"
          @click="form.emoji = e; emojiOpen = false; selection()"
        >
          {{ e }}
        </button>
      </div>

      <BInput v-model="form.name" label="Nomi *" placeholder="Masalan: Guruch Lazer 1 kg" :error="err('name')" :maxlength="60" />

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Kategoriya *</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in cats" :key="c.id" type="button"
            class="flex h-9 items-center gap-2 rounded-full border-2 px-3 text-[13px] font-bold transition-colors"
            :class="form.categoryId === c.id ? 'border-brand bg-soft text-brand' : 'border-transparent bg-card text-muted-2 shadow-card'"
            @click="form.categoryId = c.id; selection()"
          >
            <span class="size-2.5 rounded-full" :style="{ background: c.color }" />{{ c.name }}
          </button>
        </div>
        <span v-if="err('categoryId')" class="text-xs font-semibold text-danger">{{ err('categoryId') }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">O'lchov birligi</span>
        <Segmented v-model="form.unit" :options="UNITS" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <BInput v-model="form.price" label="Sotuv narxi *" inputmode="numeric" placeholder="0" suffix="so'm" :error="err('price')" />
        <BInput v-model="form.cost" label="Tannarx *" inputmode="numeric" placeholder="0" suffix="so'm" :error="err('cost')" />
      </div>
      <p v-if="margin !== null" class="-mt-2 text-xs font-bold" :class="margin < 0 ? 'text-danger' : 'text-brand'">
        Marja: {{ margin }}%{{ margin < 0 ? ' — tannarxdan arzon sotilmoqda' : '' }}
      </p>

      <BInput v-model="form.barcode" label="Shtrix-kod *" icon="barcode" inputmode="numeric" placeholder="8–13 raqam" :maxlength="13" :error="err('barcode')">
        <template #end>
          <button type="button" class="shrink-0 rounded-full bg-soft px-3 py-1.5 text-xs font-extrabold text-brand" @click="genBarcode">Yaratish</button>
        </template>
      </BInput>
      <BInput v-model="form.sku" label="Artikul (SKU)" placeholder="Avtomatik" hint="Bo'sh qolsa avtomatik yaratiladi" :maxlength="20" />

      <div class="grid grid-cols-2 gap-3">
        <BInput v-model="form.minStock" label="Minimal qoldiq *" inputmode="numeric" :suffix="form.unit" :error="err('minStock')" />
        <BInput v-if="!isEdit" v-model="form.stock" label="Boshlang'ich qoldiq" inputmode="numeric" :suffix="form.unit" :error="err('stock')" />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Ombor</span>
        <div class="flex flex-col gap-2">
          <button
            v-for="w in store.warehouses.value" :key="w.id" type="button"
            class="flex items-center gap-3 rounded-2xl border-2 bg-card px-3 py-2.5 text-left"
            :class="form.warehouseId === w.id ? 'border-brand' : 'border-transparent'"
            @click="form.warehouseId = w.id; selection()"
          >
            <span class="flex size-9 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="warehouse" :size="18" /></span>
            <span class="min-w-0 grow">
              <span class="block text-sm font-bold">{{ w.name }}</span>
              <span class="block truncate text-xs font-medium text-muted">{{ w.address }}</span>
            </span>
            <AppIcon v-if="form.warehouseId === w.id" name="check" :size="18" class="text-brand" />
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <PillButton block :disabled="!valid" @click="save">{{ isEdit ? 'Saqlash' : 'Mahsulotni qo\'shish' }}</PillButton>
    </template>
  </BSheet>
</template>
