<script setup lang="ts">
// Mahsulot sahifasi — Product View (Stock and History.md §8)
const route = useRoute()
const router = useRouter()
const store = useStore()
const pos = usePos()
const { show } = useToast()
const { haptic, selection } = useTelegram()

const product = computed(() => store.productById(String(route.params.id)))
const images = computed(() => product.value ? productImages(product.value) : [])
const photoIdx = ref(0)
watch(() => route.params.id, () => { photoIdx.value = 0 })
watch(images, (imgs) => { if (photoIdx.value >= imgs.length) photoIdx.value = 0 })

const state = computed(() => product.value ? store.stockState(product.value) : 'ok')
const tone = computed(() => STOCK_TONE[state.value])
const category = computed(() => product.value && store.categoryById(product.value.categoryId))
const supplier = computed(() => store.orgById(product.value?.supplierId))

const editOpen = ref(false)

function nextPhoto() {
  if (images.value.length < 2) return
  photoIdx.value = (photoIdx.value + 1) % images.value.length
  selection()
}
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/ombor')
}

// ---------- Reyting va sharhlar ----------
const reviews = computed(() => product.value?.reviews ?? [])
const rating = computed(() => {
  const p = product.value
  if (!p) return 0
  if (p.rating) return p.rating
  return reviews.value.length ? reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length : 0
})
const dist = computed(() => [5, 4, 3, 2, 1].map(star => ({
  star,
  n: reviews.value.filter(r => Math.round(r.rating) === star).length,
})))
const distMax = computed(() => Math.max(1, ...dist.value.map(d => d.n)))
/** Yulduz to'ldirilishi 0..1 (yarim yulduzsiz, yaxlitlab) */
const starFill = (value: number, i: number) => value >= i - 0.25

// ---------- Buyurtma prognozi ----------
const DAY = 86400000
const lastPurchase = computed(() => {
  const p = product.value
  if (!p) return null
  const t = store.transactions.value
    .filter(x => x.kind === 'purchase' && x.status !== 'cancelled' && x.items.some(i => i.productId === p.id))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!t) return null
  const item = t.items.find(i => i.productId === p.id)!
  return { date: t.date, qty: item.qty, org: store.orgById(t.orgId)?.name }
})
const consumption = computed(() => {
  const p = product.value
  if (!p) return { daily: 0, monthly: 0 }
  const from = Date.now() - 30 * DAY
  const sales = store.transactions.value.filter(t => t.kind === 'sale' && store.countsInTotal(t) && new Date(t.date).getTime() >= from)
  const sold = sales.reduce((s, t) => s + t.items.filter(i => i.productId === p.id).reduce((x, i) => x + i.qty, 0), 0)
  // Kuzatuv oynasi: eng birinchi sotuvdan bugungacha (kamida 7, ko'pi bilan 30 kun)
  const first = Math.min(Date.now(), ...sales.map(t => new Date(t.date).getTime()))
  const days = Math.min(30, Math.max(7, Math.ceil((Date.now() - first) / DAY)))
  const daily = sold / days
  return { daily, monthly: daily * 30 }
})
const daysLeft = computed(() => {
  const p = product.value
  if (!p || consumption.value.daily <= 0) return null
  return Math.floor(Math.max(0, p.stock) / consumption.value.daily)
})
/** Keyingi oyga tavsiya: oylik sarf + minimal zaxira − joriy qoldiq (5 ga yaxlitlab) */
const recommend = computed(() => {
  const p = product.value
  if (!p) return 0
  const need = consumption.value.monthly + p.minStock - Math.max(0, p.stock)
  return need > 0 ? Math.ceil(need / 5) * 5 : 0
})
const fmtQty = (n: number) => n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10).replace('.', ',')

// ---------- Amallar ----------
function order() {
  selection()
  const org = product.value?.supplierId
  navigateTo(`/ombor/kirim?tab=order${org ? `&org=${org}` : ''}`)
}
function sell() {
  const p = product.value
  if (!p) return
  if (!pos.add(p, 1)) {
    haptic('light')
    return show(p.stock <= 0 ? 'Mahsulot omborda tugagan' : `Omborda faqat ${p.stock} ${p.unit} bor`, 'error')
  }
  haptic('medium')
  show(`${p.name} savatga qo'shildi`, 'info')
  navigateTo('/sotish')
}
</script>

<template>
  <div v-if="!product" class="flex grow flex-col items-center justify-center gap-3 px-5 text-center">
    <p class="text-[15px] font-extrabold">Mahsulot topilmadi</p>
    <p class="text-[13px] text-muted">U o'chirilgan bo'lishi mumkin</p>
    <PillButton to="/ombor" size="sm" variant="soft">Omborga qaytish</PillButton>
  </div>

  <template v-else>
    <div class="no-scrollbar flex min-h-0 grow flex-col overflow-y-auto">
      <!-- Rasm maydoni -->
      <div class="relative h-[360px] shrink-0 overflow-hidden" :style="{ background: product.tint ?? '#eef0f3' }" @click="nextPhoto">
        <img v-if="images.length" :src="images[photoIdx]" :alt="product.name" class="size-full object-cover">
        <span v-else class="absolute inset-0 flex items-center justify-center pb-[30px] text-[72px] font-extrabold text-black/18">
          {{ productInitials(product.name) }}
        </span>

        <button
          type="button" aria-label="Orqaga"
          class="absolute top-4 left-5 flex size-11 items-center justify-center rounded-full bg-white/92 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-95"
          @click.stop="goBack"
        >
          <AppIcon name="chevron-left" :size="20" :stroke="2.2" />
        </button>
        <button
          type="button" aria-label="Tahrirlash"
          class="absolute top-4 right-5 flex size-11 items-center justify-center rounded-full bg-white/92 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-95"
          @click.stop="editOpen = true; selection()"
        >
          <AppIcon name="edit" :size="19" :stroke="2" />
        </button>

        <!-- Nuqtalar (panel ostida qolmasligi uchun 30px overlap hisobga olingan) -->
        <div v-if="images.length > 1" class="absolute inset-x-0 bottom-[46px] flex justify-center gap-1.5">
          <span
            v-for="(_, i) in images" :key="i"
            class="h-1.5 rounded-full transition-all duration-200"
            :class="i === photoIdx ? 'w-[18px] bg-black/55' : 'w-1.5 bg-black/20'"
          />
        </div>
      </div>

      <!-- Kontent paneli -->
      <div class="relative -mt-[30px] flex grow flex-col gap-[18px] rounded-t-[30px] bg-card px-5 pt-6 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div class="flex flex-col gap-2">
          <h1 class="text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{{ product.name }}</h1>
          <div class="flex items-center gap-1.5 text-[13px]">
            <span class="flex gap-0.5">
              <svg v-for="i in 5" :key="i" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" :fill="starFill(rating, i) ? '#f5a524' : '#e4e7eb'" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="font-extrabold text-ink">{{ rating ? rating.toFixed(1) : '—' }}</span>
            <span class="text-muted">({{ reviews.length }} ta sharh)</span>
          </div>
          <p v-if="product.description" class="text-[13.5px] leading-[1.55] text-[#6b7280]">{{ product.description }}</p>
        </div>

        <!-- Narx / Omborda -->
        <div class="grid grid-cols-2 rounded-[18px] bg-app">
          <div class="px-4 py-3.5">
            <p class="text-[12px] font-bold text-muted">Narx</p>
            <p class="mt-0.5 text-[20px] leading-tight font-extrabold text-brand">{{ formatSom(product.price) }}</p>
            <p class="mt-0.5 text-[11.5px] text-muted">Tan narx {{ formatSom(product.cost) }}</p>
          </div>
          <div class="border-l border-[#e4e7eb] px-4 py-3.5">
            <p class="text-[12px] font-bold text-muted">Omborda</p>
            <p class="mt-0.5 text-[20px] leading-tight font-extrabold" :style="{ color: tone.color }">{{ product.stock }}</p>
            <p class="mt-0.5 text-[11.5px] text-muted">O'lchov: {{ product.unit }} · {{ tone.label }}</p>
          </div>
        </div>

        <!-- Ma'lumotlar -->
        <section class="flex flex-col gap-2.5">
          <h2 class="text-[16px] font-extrabold text-ink">Ma'lumotlar</h2>
          <div class="rounded-[18px] border border-[#eceef1] px-4">
            <div
              v-for="row in [
                ['SKU', product.sku],
                ['Kategoriya', category?.name ?? '—'],
                ['O\'lchov birligi', product.unit],
                ['Ta\'minotchi', supplier?.name ?? '—'],
                ['Shtrix-kod', product.barcode || '—'],
                ['Minimal qoldiq', `${product.minStock} ${product.unit}`],
              ]" :key="row[0]"
              class="flex items-center justify-between gap-3 border-b border-[#eceef1] py-3 text-[13.5px] last:border-b-0"
            >
              <span class="shrink-0 text-muted">{{ row[0] }}</span>
              <span class="min-w-0 truncate text-right font-bold text-ink">{{ row[1] }}</span>
            </div>
          </div>
        </section>

        <!-- Buyurtma prognozi -->
        <section class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-[16px] font-extrabold text-ink">Buyurtma prognozi</h2>
            <span
              class="rounded-[10px] px-2.5 py-1 text-[11.5px] font-extrabold"
              :style="daysLeft !== null && daysLeft < 7 ? { background: '#fff4e0', color: '#b45309' } : { background: '#e6efe9', color: '#05472a' }"
            >{{ daysLeft === null ? 'Sotuv yo\'q' : `${daysLeft} kun` }}</span>
          </div>
          <div class="flex flex-col gap-3 rounded-[18px] border border-[#eceef1] p-4">
            <div class="flex items-start justify-between gap-3 text-[13.5px]">
              <span class="text-muted">Oxirgi buyurtma</span>
              <span class="text-right">
                <span class="block font-bold text-ink">{{ lastPurchase ? `${formatDate(lastPurchase.date)} · ${lastPurchase.qty} ${product.unit}` : 'Hali buyurtma qilinmagan' }}</span>
                <span v-if="lastPurchase?.org" class="block text-[11.5px] text-muted">{{ lastPurchase.org }}</span>
              </span>
            </div>
            <div class="flex items-start justify-between gap-3 text-[13.5px]">
              <span class="text-muted">O'rtacha sarf</span>
              <span class="text-right">
                <span class="block font-bold text-ink">{{ fmtQty(consumption.daily) }} {{ product.unit }} / kun</span>
                <span class="block text-[11.5px] text-muted">≈ {{ fmtQty(consumption.monthly) }} {{ product.unit }} / oy</span>
              </span>
            </div>
            <div class="flex gap-3 rounded-2xl bg-soft p-3">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand text-white">
                <AppIcon name="sparkle" :size="16" :stroke="2" />
              </span>
              <p class="min-w-0 text-[13px] leading-snug text-[#12211a]">
                <span class="block font-extrabold text-brand">AI tavsiyasi · keyingi oy</span>
                <template v-if="recommend > 0">
                  Keyingi oyga <b>{{ recommend }} {{ product.unit }}</b> buyurtma qiling — oylik sarf ≈ {{ fmtQty(consumption.monthly) }} {{ product.unit }}, minimal zaxira {{ product.minStock }} {{ product.unit }}.
                </template>
                <template v-else>
                  Joriy qoldiq keyingi oyga yetadi — hozircha buyurtma shart emas.
                </template>
              </p>
            </div>
          </div>
        </section>

        <!-- Mijozlar sharhlari -->
        <section class="flex flex-col gap-2.5">
          <h2 class="text-[16px] font-extrabold text-ink">Mijozlar sharhlari</h2>
          <div class="flex items-center gap-5 rounded-[18px] border border-[#eceef1] p-4">
            <div class="flex shrink-0 flex-col items-center gap-1">
              <span class="text-[30px] leading-none font-extrabold text-ink">{{ rating ? rating.toFixed(1) : '—' }}</span>
              <span class="flex gap-0.5">
                <svg v-for="i in 5" :key="i" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" :fill="starFill(rating, i) ? '#f5a524' : '#e4e7eb'" />
                </svg>
              </span>
              <span class="text-[11.5px] text-muted">{{ reviews.length }} ta sharh</span>
            </div>
            <div class="flex min-w-0 grow flex-col gap-1.5">
              <div v-for="d in dist" :key="d.star" class="flex items-center gap-2 text-[11.5px] font-bold text-muted">
                <span class="w-2 text-center">{{ d.star }}</span>
                <span class="h-1.5 grow overflow-hidden rounded-full bg-field">
                  <span class="block h-full rounded-full bg-[#f5a524]" :style="{ width: `${(d.n / distMax) * 100}%` }" />
                </span>
                <span class="w-3 text-right">{{ d.n }}</span>
              </div>
            </div>
          </div>

          <div v-for="(r, i) in reviews" :key="i" class="flex flex-col gap-1.5 rounded-[18px] bg-[#f6f7f9] p-3.5">
            <div class="flex items-center gap-2.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft text-[12px] font-extrabold text-brand">{{ productInitials(r.name) }}</span>
              <span class="min-w-0 grow">
                <span class="block truncate text-[13.5px] font-extrabold text-ink">{{ r.name }}</span>
                <span class="block text-[11px] text-muted">{{ formatDay(r.date) }}</span>
              </span>
              <span class="flex shrink-0 gap-0.5">
                <svg v-for="s in 5" :key="s" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" :fill="s <= r.rating ? '#f5a524' : '#e4e7eb'" />
                </svg>
              </span>
            </div>
            <p class="text-[13px] leading-[1.5] text-[#4b5563]">{{ r.text }}</p>
          </div>
          <p v-if="!reviews.length" class="py-4 text-center text-[13px] text-muted">Hozircha sharh yo'q</p>
        </section>
      </div>
    </div>

    <!-- Pastki panel -->
    <div class="flex shrink-0 gap-2.5 border-t border-[#eceef1] bg-card px-5 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        class="flex h-[52px] grow basis-0 items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-[#e4e7eb] bg-card text-[15px] font-extrabold text-ink transition-transform active:scale-[0.98]"
        @click="order"
      >
        <AppIcon name="box" :size="19" :stroke="1.9" />Buyurtma
      </button>
      <button
        type="button"
        class="flex h-[52px] grow basis-0 items-center justify-center gap-2 rounded-[18px] bg-brand text-[15px] font-extrabold text-white transition-transform active:scale-[0.98]"
        @click="sell"
      >
        <AppIcon name="scan" :size="19" :stroke="2" />Sotish
      </button>
    </div>

    <StockProductSheet v-model="editOpen" :product="product" />
  </template>
</template>
