<script setup lang="ts">
import type { KirimLine } from '~/components/inv/KirimRow.vue'
import type { PayMethod, Product } from '~/data/types'

const store = useStore()
const { show } = useToast()
const { haptic, selection, scanQr, isTelegram } = useTelegram()

const TABS = [
  { value: 'scan', label: 'Skaner' },
  { value: 'ai', label: 'AI nakladnoy' },
  { value: 'order', label: 'Buyurtma' },
]
// ?tab=scan|ai|order — tanlangan tab (Ombor "Mahsulot qo'shish" sheet / Mahsulot sahifasidan), ?org= — ta'minotchi
const route = useRoute()
type KirimTab = 'scan' | 'ai' | 'order'
const queryTab = (v: unknown): KirimTab => (['scan', 'ai', 'order'] as const).find(t => t === v) ?? 'scan'
const tab = ref<KirimTab>(queryTab(route.query.tab))
watch(() => route.query.tab, (v) => { if (v) tab.value = queryTab(v) })

const lineValid = (l: KirimLine) => invParseNum(l.qty) > 0 && invParseNum(l.cost) >= 0
const lineSum = (l: KirimLine) => lineValid(l) ? invParseNum(l.qty) * invParseNum(l.cost) : 0

// ---------- Skaner ----------
const scanLines = ref<KirimLine[]>([])
const scanOrg = ref('')
const code = ref('')
const codeError = ref('')
const scanning = ref(false)
const pickerOpen = ref(false)
const pickerQ = ref('')
const createOpen = ref(false)
const createBarcode = ref('')

function addProduct(p: Product, qty = 1) {
  const ex = scanLines.value.find(l => l.productId === p.id)
  if (ex) ex.qty = String((invParseNum(ex.qty) || 0) + qty)
  else scanLines.value = [{ productId: p.id, qty: String(qty), cost: String(p.cost) }, ...scanLines.value]
  haptic('light')
}

function addByCode(raw: string) {
  const c = raw.trim()
  codeError.value = ''
  if (!/^\d{8,13}$/.test(c)) {
    codeError.value = 'Shtrix-kod 8–13 ta raqam bo\'lishi kerak'
    return
  }
  const p = store.products.value.find(x => x.barcode === c)
  if (!p) {
    codeError.value = 'Bu kod bilan mahsulot topilmadi'
    createBarcode.value = c
    return
  }
  addProduct(p)
  show(`${p.name} qo'shildi`, 'info')
  code.value = ''
}

async function scan() {
  selection()
  if (isTelegram) {
    const data = await scanQr('Mahsulot shtrix-kodini skanerlang')
    if (data) addByCode(data)
    return
  }
  // Brauzerda kamera simulyatsiyasi
  scanning.value = true
  await new Promise(r => setTimeout(r, 1400))
  scanning.value = false
  const list = store.products.value
  const p = list[Math.floor(Math.random() * list.length)]
  if (p) addByCode(p.barcode)
}

const pickerList = computed(() => {
  const s = pickerQ.value.trim().toLowerCase()
  return store.products.value.filter(p => !s || p.name.toLowerCase().includes(s) || p.barcode.includes(s))
})

function onCreated(p: Product) {
  codeError.value = ''
  code.value = ''
  createBarcode.value = ''
  addProduct(p)
}

// ---------- AI nakladnoy ----------
const aiStage = ref<'idle' | 'analyzing' | 'done'>('idle')
const aiPreview = ref('')
const aiStep = ref(0)
const aiLines = ref<KirimLine[]>([])
const aiOrg = ref('')
const aiInvoice = ref('')
const AI_STEPS = ['Rasm sifati tekshirilmoqda', 'Jadval va matn o\'qilmoqda', 'Ta\'minotchi aniqlanmoqda', 'Mahsulotlar katalog bilan solishtirilmoqda']
const fileCam = ref<HTMLInputElement>()
const fileGal = ref<HTMLInputElement>()

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (aiPreview.value) URL.revokeObjectURL(aiPreview.value)
  aiPreview.value = URL.createObjectURL(f)
  ;(e.target as HTMLInputElement).value = ''
  analyze()
}

async function analyze() {
  aiStage.value = 'analyzing'
  aiStep.value = 0
  haptic('light')
  for (let i = 1; i < AI_STEPS.length; i++) {
    await new Promise(r => setTimeout(r, 750))
    if (aiStage.value !== 'analyzing') return
    aiStep.value = i
  }
  await new Promise(r => setTimeout(r, 750))
  if (aiStage.value !== 'analyzing') return
  const supplier = store.organizations.value.find(o => o.id === 'o2') ?? store.organizations.value.find(o => o.type === 'supplier')
  aiOrg.value = supplier?.id ?? ''
  aiInvoice.value = `NK-${Math.floor(1000 + Math.random() * 9000)}`
  const P = (id: string) => store.productById(id)
  const pick = (id: string, qty: number, costMul = 1, flag?: string): KirimLine | null => {
    const p = P(id)
    return p ? { productId: id, qty: String(qty), cost: String(Math.round((p.cost * costMul) / 100) * 100), flag } : null
  }
  aiLines.value = [
    pick('p1', 50),
    pick('p3', 24),
    pick('p6', 36, 1.18, 'Narxni tekshiring: oxirgi kirimdan ~18% qimmat'),
    pick('p4', 30),
    pick('p5', 20),
  ].filter(Boolean) as KirimLine[]
  aiStage.value = 'done'
  haptic('medium')
  show('Nakladnoy tahlil qilindi', 'info')
}

function resetAi() {
  aiStage.value = 'idle'
  aiLines.value = []
  if (aiPreview.value) URL.revokeObjectURL(aiPreview.value)
  aiPreview.value = ''
}
onBeforeUnmount(() => { if (aiPreview.value) URL.revokeObjectURL(aiPreview.value) })

// ---------- Tashkilotdan buyurtma ----------
const queryOrg = () => {
  const id = String(route.query.org ?? '')
  return store.orgById(id) ? id : ''
}
const orderOrg = ref(queryOrg())
watch(() => route.query.org, () => { if (queryOrg()) orderOrg.value = queryOrg() })
const orderQty = ref<Record<string, number>>({})
const orderQ = ref('')
const orderNote = ref('')
const orderSending = ref(false)

const orderList = computed(() => {
  const s = orderQ.value.trim().toLowerCase()
  return [...store.products.value]
    .filter(p => !s || p.name.toLowerCase().includes(s))
    .sort((a, b) => (store.stockState(a) === 'ok' ? 1 : 0) - (store.stockState(b) === 'ok' ? 1 : 0))
})
const orderItems = computed(() => Object.entries(orderQty.value).filter(([, q]) => q > 0))
const orderTotal = computed(() => orderItems.value.reduce((s, [id, q]) => s + (store.productById(id)?.cost ?? 0) * q, 0))

function setQty(id: string, d: number) {
  orderQty.value = { ...orderQty.value, [id]: Math.max(0, (orderQty.value[id] ?? 0) + d) }
  selection()
}
function fillLow() {
  const next = { ...orderQty.value }
  for (const p of store.lowStock.value) next[p.id] = Math.max(next[p.id] ?? 0, p.minStock * 2 - p.stock)
  orderQty.value = next
  haptic('light')
  show(`${store.lowStock.value.length} ta kam qolgan mahsulot qo'shildi`, 'info')
}
async function sendOrder() {
  const org = store.orgById(orderOrg.value)
  if (!org || !orderItems.value.length) return
  orderSending.value = true
  await new Promise(r => setTimeout(r, 900))
  orderSending.value = false
  haptic('medium')
  show(`Buyurtma ${org.name} ga yuborildi`)
  orderQty.value = {}
  orderNote.value = ''
}

// ---------- Kirimni tasdiqlash ----------
const activeLines = computed(() => tab.value === 'scan' ? scanLines.value : aiLines.value)
const activeOrg = computed(() => tab.value === 'scan' ? scanOrg.value : aiOrg.value)
const total = computed(() => activeLines.value.reduce((s, l) => s + lineSum(l), 0))
const canConfirm = computed(() => !!activeOrg.value && activeLines.value.length > 0 && activeLines.value.every(lineValid))
const confirmHint = computed(() => {
  if (!activeLines.value.length) return 'Mahsulot qo\'shing'
  if (!activeLines.value.every(lineValid)) return 'Miqdor va narxlarni tekshiring'
  if (!activeOrg.value) return 'Ta\'minotchini tanlang'
  return ''
})

const confirmOpen = ref(false)
const paid = ref('')
const method = ref<PayMethod>('transfer')
const METHODS = [
  { value: 'cash', label: 'Naqd' },
  { value: 'card', label: 'Karta' },
  { value: 'transfer', label: 'O\'tkazma' },
]
const paidN = computed(() => paid.value === '' ? 0 : invParseNum(paid.value))
const paidError = computed(() => Number.isNaN(paidN.value) || paidN.value < 0 ? 'Summani to\'g\'ri kiriting' : paidN.value > total.value ? 'Jami summadan oshmasin' : '')

function openConfirm() {
  if (!canConfirm.value) return
  paid.value = ''
  confirmOpen.value = true
}

function confirmKirim() {
  if (paidError.value || !canConfirm.value) return
  const org = store.orgById(activeOrg.value)!
  const items = activeLines.value.map((l) => {
    const p = store.productById(l.productId)!
    return { productId: p.id, name: p.name, qty: invParseNum(l.qty), price: invParseNum(l.cost) }
  })
  const t = total.value
  const pd = paidN.value
  store.addTransaction({
    kind: 'purchase', segment: 'B2B', channel: 'app', date: new Date().toISOString(), orgId: org.id, items,
    total: t, paid: pd, method: method.value, status: 'delivered',
    payStatus: pd >= t ? 'paid' : pd > 0 ? 'partial' : 'unpaid',
    cashier: store.business.value.owner.split(' ')[0] ?? 'Aziz', branchId: store.currentBranchId.value,
  })
  for (const i of items) {
    const p = store.productById(i.productId)
    if (p) p.cost = i.price
  }
  org.balance += t - pd
  haptic('heavy')
  show(`Kirim qabul qilindi: ${items.length} ta mahsulot`)
  confirmOpen.value = false
  if (tab.value === 'scan') {
    scanLines.value = []
    scanOrg.value = ''
  }
  else resetAi()
  navigateTo('/ombor')
}
</script>

<template>
  <PageHeader title="Kirim" subtitle="Omborga mahsulot qabul qilish" back="/ombor" />
  <div class="shrink-0 px-5 pb-3">
    <Segmented v-model="tab" :options="TABS" />
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3.5 overflow-y-auto px-5 pb-6">
    <!-- ===== SKANER ===== -->
    <template v-if="tab === 'scan'">
      <button
        type="button"
        class="relative flex h-[132px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[24px] bg-brand text-white shadow-float active:scale-[0.99]"
        :disabled="scanning" @click="scan"
      >
        <span class="pointer-events-none absolute inset-5 rounded-2xl border-2 border-dashed border-white/25" />
        <span v-if="scanning" class="pointer-events-none absolute inset-x-6 h-0.5 animate-[inv-scan_1.2s_ease-in-out_infinite] bg-[#7cf0b6] shadow-[0_0_14px_#7cf0b6]" />
        <span class="flex size-12 items-center justify-center rounded-full bg-white/15"><AppIcon name="barcode" :size="26" /></span>
        <span class="text-[15px] font-extrabold">{{ scanning ? 'Skanerlanmoqda…' : 'Shtrix-kodni skanerlash' }}</span>
      </button>

      <div class="flex items-start gap-2">
        <div class="grow">
          <BInput
            v-model="code" icon="barcode" inputmode="numeric" placeholder="Kodni qo'lda kiriting" :maxlength="13" :error="codeError"
            @keydown.enter="addByCode(code)"
          />
        </div>
        <RoundButton icon="plus" label="Qo'shish" variant="brand" :size="50" @click="addByCode(code)" />
      </div>
      <div v-if="createBarcode && codeError" class="-mt-1 flex items-center justify-between gap-2 rounded-2xl bg-info-soft px-3.5 py-2.5">
        <span class="text-xs font-bold text-info">Yangi mahsulot sifatida yaratasizmi?</span>
        <button type="button" class="rounded-full bg-info px-3 py-1.5 text-xs font-extrabold text-white" @click="createOpen = true">Yaratish</button>
      </div>
      <PillButton variant="outline" icon="search" block @click="pickerOpen = true; pickerQ = ''">Katalogdan tanlash</PillButton>

      <SectionHead title="Ta'minotchi" to="/taminotchilar" action="Yangi" />
      <InvSupplierPicker v-model="scanOrg" />

      <SectionHead :title="`Kirim ro'yxati (${scanLines.length})`" :action="scanLines.length ? 'Tozalash' : undefined" @action="scanLines = []" />
      <InvKirimRow v-for="(l, i) in scanLines" :key="l.productId" :line="l" @remove="scanLines.splice(i, 1)" />
      <div v-if="!scanLines.length" class="card"><EmptyState icon="barcode" title="Ro'yxat bo'sh" text="Mahsulotni skanerlang yoki katalogdan tanlang" /></div>
    </template>

    <!-- ===== AI NAKLADNOY ===== -->
    <template v-else-if="tab === 'ai'">
      <input ref="fileCam" type="file" accept="image/*" capture="environment" class="hidden" @change="onFile">
      <input ref="fileGal" type="file" accept="image/*" class="hidden" @change="onFile">

      <template v-if="aiStage === 'idle'">
        <div class="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-brand/25 bg-card px-5 py-7 text-center">
          <span class="flex size-16 items-center justify-center rounded-full bg-soft-2 text-brand"><AppIcon name="sparkle" :size="30" /></span>
          <p class="text-base font-extrabold">Nakladnoyni suratga oling</p>
          <p class="text-[13px] font-medium text-muted">AI mahsulotlar, miqdor va narxlarni avtomatik aniqlaydi. Siz faqat tekshirib tasdiqlaysiz.</p>
          <div class="mt-1 grid w-full grid-cols-2 gap-2">
            <PillButton icon="camera" @click="fileCam?.click()">Suratga olish</PillButton>
            <PillButton icon="image" variant="soft" @click="fileGal?.click()">Galereya</PillButton>
          </div>
          <button type="button" class="text-[13px] font-bold text-brand" @click="analyze">Namuna nakladnoy bilan sinash</button>
        </div>
        <div class="card flex flex-col gap-2.5 p-4">
          <p class="text-sm font-extrabold">Yaxshi natija uchun</p>
          <p v-for="t in ['Hujjatni tekis joyga qo\'ying', 'Barcha qatorlar kadrga sig\'sin', 'Yorug\'lik yetarli bo\'lsin, soya tushmasin']" :key="t" class="flex items-center gap-2 text-[13px] font-semibold text-muted-2">
            <AppIcon name="check" :size="16" class="text-brand" />{{ t }}
          </p>
        </div>
      </template>

      <template v-else-if="aiStage === 'analyzing'">
        <div class="relative h-[260px] overflow-hidden rounded-[24px] bg-ink">
          <img v-if="aiPreview" :src="aiPreview" alt="Nakladnoy" class="size-full object-cover opacity-60">
          <div v-else class="absolute inset-6 flex flex-col gap-2.5 rounded-lg bg-white/90 p-4">
            <span class="h-3 w-1/2 rounded bg-ink/20" />
            <span class="h-2 w-1/3 rounded bg-ink/10" />
            <span v-for="i in 6" :key="i" class="flex gap-2"><span class="h-2 grow rounded bg-ink/15" /><span class="h-2 w-8 rounded bg-ink/15" /><span class="h-2 w-12 rounded bg-ink/15" /></span>
          </div>
          <span class="absolute inset-x-0 h-16 animate-[inv-sweep_1.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-[#7cf0b6]/45 to-transparent" />
          <span class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-brand">
            <AppIcon name="sparkle" :size="14" class="animate-pulse" />AI tahlil qilmoqda
          </span>
        </div>
        <div class="card flex flex-col gap-3 p-4">
          <div v-for="(s, i) in AI_STEPS" :key="s" class="flex items-center gap-3 text-[13px] font-bold" :class="i > aiStep ? 'text-muted' : 'text-ink'">
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full" :class="i < aiStep ? 'bg-brand text-white' : i === aiStep ? 'bg-soft text-brand' : 'bg-field'">
              <AppIcon v-if="i < aiStep" name="check" :size="13" :stroke="3" />
              <span v-else-if="i === aiStep" class="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </span>
            {{ s }}
          </div>
        </div>
        <PillButton variant="field" block @click="resetAi">Bekor qilish</PillButton>
      </template>

      <template v-else>
        <div class="flex items-center gap-3 rounded-[20px] bg-soft-2 p-3.5">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="sparkle" :size="20" /></span>
          <span class="min-w-0 grow">
            <span class="block text-sm font-extrabold">{{ aiLines.length }} ta mahsulot aniqlandi</span>
            <span class="block text-xs font-semibold text-muted-2">Nakladnoy №{{ aiInvoice }} · ishonchlilik 94%</span>
          </span>
          <button type="button" class="shrink-0 text-[13px] font-bold text-brand" @click="resetAi">Qayta</button>
        </div>

        <SectionHead title="Ta'minotchi (aniqlandi)" />
        <InvSupplierPicker v-model="aiOrg" />

        <SectionHead title="Aniqlangan qatorlar" />
        <InvKirimRow v-for="(l, i) in aiLines" :key="l.productId" :line="l" @remove="aiLines.splice(i, 1)" />
        <EmptyState v-if="!aiLines.length" icon="file" title="Qatorlar qolmadi" />
      </template>
    </template>

    <!-- ===== TASHKILOTDAN BUYURTMA ===== -->
    <template v-else>
      <SectionHead title="Ta'minotchini tanlang" to="/taminotchilar" action="Barchasi" />
      <InvSupplierPicker v-model="orderOrg" />

      <div class="flex items-center gap-2">
        <div class="grow"><BInput v-model="orderQ" icon="search" placeholder="Mahsulot qidirish" /></div>
      </div>
      <button v-if="store.lowStock.value.length" type="button" class="flex items-center gap-3 rounded-[18px] bg-warn-soft p-3 text-left" @click="fillLow">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-warn"><AppIcon name="alert" :size="18" /></span>
        <span class="min-w-0 grow">
          <span class="block text-[13px] font-extrabold text-warn">{{ store.lowStock.value.length }} ta mahsulot kam qolgan</span>
          <span class="block text-xs font-semibold text-muted-2">Tavsiya etilgan miqdorda qo'shish</span>
        </span>
        <AppIcon name="plus" :size="18" class="text-warn" />
      </button>

      <div class="card px-3">
        <div v-for="p in orderList" :key="p.id" class="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-field text-xl">{{ p.emoji }}</span>
          <span class="min-w-0 grow">
            <span class="block truncate text-sm font-bold">{{ p.name }}</span>
            <span class="block text-xs font-semibold" :class="store.stockState(p) === 'ok' ? 'text-muted' : 'text-warn'">
              {{ p.stock }} {{ p.unit }} · {{ formatSom(p.cost) }} so'm
            </span>
          </span>
          <div v-if="orderQty[p.id]" class="flex h-9 shrink-0 items-center rounded-full bg-soft text-brand">
            <button type="button" aria-label="Kamaytirish" class="flex size-9 items-center justify-center" @click="setQty(p.id, -1)"><AppIcon name="minus" :size="15" /></button>
            <span class="min-w-6 text-center text-sm font-extrabold">{{ orderQty[p.id] }}</span>
            <button type="button" aria-label="Ko'paytirish" class="flex size-9 items-center justify-center" @click="setQty(p.id, 1)"><AppIcon name="plus" :size="15" /></button>
          </div>
          <button v-else type="button" aria-label="Qo'shish" class="flex size-9 shrink-0 items-center justify-center rounded-full bg-field text-ink" @click="setQty(p.id, 1)">
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
      </div>
      <BInput v-model="orderNote" label="Izoh" placeholder="Masalan: ertaga soat 10:00 gacha yetkazing" multiline :maxlength="200" />
    </template>
  </div>

  <!-- Pastki panel -->
  <div v-if="tab !== 'order' && (tab === 'scan' || aiStage === 'done')" class="pb-safe shrink-0 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
    <div class="mb-2.5 flex items-center justify-between text-sm">
      <span class="font-semibold text-muted">{{ activeLines.length }} ta mahsulot</span>
      <span class="text-lg font-extrabold">{{ formatSom(total) }} so'm</span>
    </div>
    <PillButton block icon="check" :disabled="!canConfirm" @click="openConfirm">{{ confirmHint || 'Kirimni tasdiqlash' }}</PillButton>
  </div>
  <div v-else-if="tab === 'order'" class="pb-safe shrink-0 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
    <div class="mb-2.5 flex items-center justify-between text-sm">
      <span class="font-semibold text-muted">{{ orderItems.length }} ta mahsulot · taxminan</span>
      <span class="text-lg font-extrabold">{{ formatSom(orderTotal) }} so'm</span>
    </div>
    <PillButton block icon="send" :disabled="!orderOrg || !orderItems.length || orderSending" @click="sendOrder">
      {{ orderSending ? 'Yuborilmoqda…' : !orderOrg ? 'Ta\'minotchini tanlang' : !orderItems.length ? 'Mahsulot qo\'shing' : 'Buyurtma yuborish' }}
    </PillButton>
  </div>

  <!-- Katalogdan tanlash -->
  <BSheet v-model="pickerOpen" title="Mahsulot tanlash" full>
    <div class="sticky top-0 z-10 -mx-5 bg-app px-5 pb-3">
      <BInput v-model="pickerQ" icon="search" placeholder="Nomi yoki shtrix-kod" />
    </div>
    <div class="card px-3">
      <button
        v-for="p in pickerList" :key="p.id" type="button"
        class="flex w-full items-center gap-3 border-b border-line py-2.5 text-left last:border-b-0"
        @click="addProduct(p); show(`${p.name} qo'shildi`, 'info')"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-field text-xl">{{ p.emoji }}</span>
        <span class="min-w-0 grow">
          <span class="block truncate text-sm font-bold">{{ p.name }}</span>
          <span class="block text-xs font-semibold text-muted">{{ p.barcode }} · {{ p.stock }} {{ p.unit }}</span>
        </span>
        <span v-if="scanLines.find(l => l.productId === p.id)" class="rounded-full bg-soft px-2 py-1 text-xs font-extrabold text-brand">
          ×{{ scanLines.find(l => l.productId === p.id)?.qty }}
        </span>
        <AppIcon v-else name="plus" :size="18" class="text-brand" />
      </button>
    </div>
    <EmptyState v-if="!pickerList.length" title="Topilmadi" />
    <template #footer>
      <PillButton block @click="pickerOpen = false">Tayyor</PillButton>
    </template>
  </BSheet>

  <StockProductSheet v-model="createOpen" :barcode="createBarcode" @saved="onCreated" />

  <!-- Tasdiqlash -->
  <BSheet v-model="confirmOpen" title="Kirimni tasdiqlash">
    <div class="flex flex-col gap-4">
      <div class="card flex flex-col gap-2 p-4 text-sm">
        <div class="flex justify-between"><span class="font-semibold text-muted">Ta'minotchi</span><span class="font-extrabold">{{ store.orgById(activeOrg)?.name }}</span></div>
        <div class="flex justify-between"><span class="font-semibold text-muted">Mahsulotlar</span><span class="font-extrabold">{{ activeLines.length }} xil · {{ activeLines.reduce((s, l) => s + (invParseNum(l.qty) || 0), 0) }} birlik</span></div>
        <div class="flex justify-between border-t border-line pt-2"><span class="font-semibold text-muted">Jami</span><span class="text-lg font-extrabold">{{ formatSom(total) }} so'm</span></div>
      </div>
      <BInput v-model="paid" label="Hozir to'lanadi" inputmode="numeric" placeholder="0" suffix="so'm" :error="paidError">
        <template #end>
          <button type="button" class="shrink-0 rounded-full bg-soft px-3 py-1.5 text-xs font-extrabold text-brand" @click="paid = String(total)">To'liq</button>
        </template>
      </BInput>
      <Segmented v-model="method" :options="METHODS" />
      <div class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold" :class="total - paidN > 0 ? 'bg-warn-soft text-warn' : 'bg-soft text-brand'">
        <span>{{ total - paidN > 0 ? 'Qarzimizga yoziladi' : 'To\'liq to\'landi' }}</span>
        <span>{{ formatSom(Math.max(0, total - (paidN || 0))) }} so'm</span>
      </div>
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!!paidError" @click="confirmKirim">Qabul qilish</PillButton>
    </template>
  </BSheet>
</template>

<style>
@keyframes inv-scan {
  0%, 100% { top: 24px; }
  50% { top: calc(100% - 26px); }
}
@keyframes inv-sweep {
  0% { top: -64px; }
  100% { top: 100%; }
}
</style>
