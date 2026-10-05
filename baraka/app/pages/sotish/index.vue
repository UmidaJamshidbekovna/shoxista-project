<script setup lang="ts">
import type { Product } from '~/data/types'
import type { PosDetected } from '~/composables/usePos'

definePageMeta({ tab: true })

const pos = usePos()
const { store, cart, count, total, customer, qtyInCart, cartLabel, cartTotal } = pos
const { products, categories, carts, activeCartId, stockState } = store
const { show } = useToast()
const { isTelegram, scanQr, selection, haptic } = useTelegram()

const q = ref('')
const cat = ref('all')
const sheets = reactive({ cart: false, scan: false, camera: false, voice: false, customer: false, line: false, discount: false, pay: false, delCart: false })
const editId = ref<string>()
const delId = ref<string>()

const catOptions = computed(() => [{ value: 'all', label: 'Barchasi' }, ...[...categories.value].sort((a, b) => a.order - b.order).map(c => ({ value: c.id, label: c.name }))])

const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  return products.value
    .filter(p => cat.value === 'all' || p.categoryId === cat.value)
    .filter(p => !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.barcode.includes(s))
    .sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0))
})

const branch = computed(() => store.branchById(store.currentBranchId.value)?.name ?? '')

function addProduct(p: Product, qty = 1) {
  if (p.stock <= 0) return show(`${p.name} — tugagan`, 'error')
  if (!pos.add(p, qty)) return show(`Omborda faqat ${p.stock} ${p.unit} bor`, 'error')
  selection()
}
function dec(p: Product) {
  pos.setQty(p.id, qtyInCart(p.id) - 1)
  pos.clampDiscount()
  selection()
}

function onSearchEnter() {
  const p = pos.findByCode(q.value)
  if (p) { addProduct(p); show(`${p.name} qo'shildi`); q.value = '' }
  else if (list.value.length === 1 && list.value[0]!.stock > 0) { addProduct(list.value[0]!); q.value = '' }
}

async function scan() {
  haptic()
  if (!isTelegram) return (sheets.scan = true)
  const code = await scanQr('Mahsulot shtrix-kodini skanerlang')
  if (!code) return
  const p = pos.findByCode(code)
  if (!p) return show('Bu kod bilan mahsulot topilmadi', 'error')
  addProduct(p)
  show(`${p.name} qo'shildi`)
}
function onScanned(p: Product) {
  addProduct(p)
}

function addDetected(items: PosDetected[]) {
  let n = 0
  let clipped = false
  for (const it of items) {
    const p = store.productById(it.productId)
    if (!p) continue
    const room = p.stock - qtyInCart(p.id)
    const qty = Math.min(it.qty, room)
    if (qty < it.qty) clipped = true
    if (qty > 0 && pos.add(p, qty)) n++
  }
  if (n) show(`${n} ta mahsulot savatga qo'shildi`)
  if (clipped) setTimeout(() => show('Ba\'zi miqdorlar qoldiqqa moslab kamaytirildi', 'info'), 300)
}

function newCart() {
  pos.createCart()
  haptic('medium')
  show(`${cart.value.label} yaratildi`, 'info')
}
function switchCart(id: string) {
  if (activeCartId.value === id) return
  activeCartId.value = id
  selection()
}
function askDelete(id: string) {
  delId.value = id
  sheets.delCart = true
}
const delCart = computed(() => carts.value.find(c => c.id === delId.value))
function confirmDelete() {
  if (!delId.value) return
  pos.deleteCart(delId.value)
  sheets.delCart = false
  show('Savat o\'chirildi', 'info')
}

function openEdit(id: string) {
  editId.value = id
  sheets.line = true
}
function setCustomer(id: string | undefined) {
  cart.value.customerId = id
  if (id) show(`Mijoz: ${store.customerById(id)?.name}`)
}
function openPay() {
  if (!count.value) return show('Savat bo\'sh', 'error')
  sheets.pay = true
}
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
    <PageHeader title="Sotish" :subtitle="`${branch} · Kassa`">
      <RoundButton icon="history" label="Sotuvlar tarixi" to="/tarix" />
      <button
        type="button" class="flex h-[46px] max-w-[132px] items-center gap-2 rounded-full bg-card pr-3 pl-1 shadow-card"
        :aria-label="customer ? `Mijoz: ${customer.name}` : 'Mijoz tanlash'" @click="sheets.customer = true"
      >
        <Avatar v-if="customer" :name="customer.name" :size="38" />
        <Avatar v-else icon="user" :size="38" color="#8b9099" />
        <span class="min-w-0 truncate text-[13px] font-bold">{{ customer ? customer.name.split(' ')[0] : 'Mijoz' }}</span>
      </button>
    </PageHeader>

    <!-- Hold savatlar -->
    <div class="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto px-5 pb-3">
      <div
        v-for="c in carts" :key="c.id"
        class="flex h-10 shrink-0 items-center rounded-full transition-colors"
        :class="c.id === activeCartId ? 'bg-brand text-white shadow-float' : 'bg-card text-muted-2 shadow-card'"
      >
        <button type="button" class="flex h-full items-center gap-1.5 pr-1 pl-3.5 text-[13px] font-bold whitespace-nowrap" @click="switchCart(c.id)">
          <AppIcon v-if="c.id !== activeCartId && c.lines.length" name="pause" :size="13" />
          {{ cartLabel(c) }}
          <span
            v-if="c.lines.length" class="rounded-full px-1.5 text-[11px] font-extrabold"
            :class="c.id === activeCartId ? 'bg-white/20' : 'bg-field'"
          >{{ c.id === activeCartId ? c.lines.length : formatSom(cartTotal(c)) }}</span>
        </button>
        <button
          type="button" :aria-label="`${c.label} ni o'chirish`" class="mr-1 flex size-7 items-center justify-center rounded-full opacity-70"
          @click="askDelete(c.id)"
        >
          <AppIcon name="x" :size="13" />
        </button>
      </div>
      <button type="button" aria-label="Yangi savat" class="flex h-10 shrink-0 items-center gap-1 rounded-full border-2 border-dashed border-brand/30 px-3 text-[13px] font-bold text-brand" @click="newCart">
        <AppIcon name="plus" :size="16" /> Yangi
      </button>
    </div>

    <!-- Qo'shish usullari -->
    <div class="flex shrink-0 flex-col gap-2.5 px-5 pb-3">
      <form @submit.prevent="onSearchEnter">
        <BInput v-model="q" placeholder="Nomi, SKU yoki shtrix-kod" icon="search" inputmode="search">
          <template #end>
            <button v-if="q" type="button" aria-label="Tozalash" class="text-muted" @click="q = ''"><AppIcon name="x" :size="18" /></button>
          </template>
        </BInput>
      </form>
      <div class="grid grid-cols-3 gap-2">
        <button type="button" class="flex h-12 items-center justify-center gap-2 rounded-2xl bg-card text-[13px] font-bold text-ink shadow-card active:scale-95" @click="scan">
          <span class="text-brand"><AppIcon name="barcode" :size="19" /></span> Skaner
        </button>
        <button type="button" class="flex h-12 items-center justify-center gap-2 rounded-2xl bg-card text-[13px] font-bold text-ink shadow-card active:scale-95" @click="sheets.camera = true">
          <span class="text-brand"><AppIcon name="sparkle" :size="19" /></span> AI kamera
        </button>
        <button type="button" class="flex h-12 items-center justify-center gap-2 rounded-2xl bg-card text-[13px] font-bold text-ink shadow-card active:scale-95" @click="sheets.voice = true">
          <span class="text-brand"><AppIcon name="mic" :size="19" /></span> Ovoz
        </button>
      </div>
      <Chips v-model="cat" :options="catOptions" />
    </div>

    <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pt-1 pb-4">
      <div v-if="list.length" class="grid grid-cols-3 gap-2.5">
        <PosProductCard
          v-for="p in list" :key="p.id" :product="p" :in-cart="qtyInCart(p.id)"
          @add="addProduct(p)" @dec="dec(p)"
        />
      </div>
      <EmptyState v-else title="Mahsulot topilmadi" :text="q ? `«${q}» bo'yicha natija yo'q` : 'Bu kategoriyada mahsulot yo\'q'">
        <PillButton v-if="q" size="sm" variant="soft" @click="q = ''; cat = 'all'">Filtrni tozalash</PillButton>
      </EmptyState>
      <p v-if="list.some(p => stockState(p) === 'out')" class="mt-3 text-center text-[11px] font-semibold text-muted">Tugagan mahsulotlarni sotib bo'lmaydi</p>
    </div>

    <!-- Savat paneli (pastki navigatsiya ustida) -->
    <div class="shrink-0 px-3 pt-1 pb-24">
      <div class="flex items-center gap-2 rounded-[24px] bg-brand p-2 pl-3 text-white shadow-float">
        <button type="button" class="flex min-w-0 grow items-center gap-3 text-left" aria-label="Savatni ochish" @click="sheets.cart = true">
          <span class="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/12">
            <AppIcon name="cart" :size="22" />
            <span v-if="count" class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-brand bg-[#4ade80] px-1 text-[10px] font-extrabold text-brand">{{ count }}</span>
          </span>
          <span class="min-w-0 grow">
            <span class="flex items-center gap-1 text-[12px] font-semibold text-white/70">
              <span class="truncate">{{ cartLabel(cart) }} · {{ count ? `${count} ta` : 'bo\'sh' }}</span>
              <AppIcon name="chevron-down" :size="14" class="shrink-0 rotate-180" />
            </span>
            <span class="block truncate text-[20px] leading-tight font-extrabold">{{ formatSom(total) }} <span class="text-[13px]">so'm</span></span>
          </span>
        </button>
        <button
          type="button" class="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[15px] font-extrabold text-brand transition active:scale-95 disabled:opacity-50"
          :disabled="!count" @click="openPay"
        >
          To'lov <AppIcon name="arrow-right" :size="18" />
        </button>
      </div>
    </div>

    <!-- Sheetlar (tartib muhim: keyingilari ustida ochiladi) -->
    <PosScanSheet v-model="sheets.scan" @found="onScanned" />
    <PosCameraSheet v-model="sheets.camera" @confirm="addDetected" />
    <PosVoiceSheet v-model="sheets.voice" @confirm="addDetected" />
    <PosCartSheet
      v-model="sheets.cart"
      @edit="openEdit" @discount="sheets.discount = true" @customer="sheets.customer = true" @pay="openPay"
    />
    <PosLineSheet v-model="sheets.line" :product-id="editId" />
    <PosDiscountSheet v-model="sheets.discount" />
    <PosPaySheet v-model="sheets.pay" @need-customer="sheets.customer = true" />
    <PosCustomerSheet v-model="sheets.customer" :selected-id="cart.customerId" @select="setCustomer" />

    <BSheet v-model="sheets.delCart" title="Savatni o'chirish">
      <p v-if="delCart" class="text-[15px] font-medium text-muted-2">
        <b class="text-ink">{{ cartLabel(delCart) }}</b>
        <template v-if="delCart.lines.length"> ichida {{ delCart.lines.length }} ta mahsulot ({{ formatSom(cartTotal(delCart)) }} so'm) bor.</template>
        O'chirilgan savatni qaytarib bo'lmaydi.
      </p>
      <template #footer>
        <div class="flex gap-2">
          <PillButton variant="field" class="basis-1/3" @click="sheets.delCart = false">Bekor</PillButton>
          <PillButton block variant="danger" icon="trash" @click="confirmDelete">O'chirish</PillButton>
        </div>
      </template>
    </BSheet>
  </div>
</template>
