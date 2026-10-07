<script setup lang="ts">
import type { SupplierListing } from '~/data/types'

const { suppliers, organizations } = useStore()
const { amount, money } = useMoney()
const { show } = useToast()
const { haptic, selection } = useTelegram()

const q = ref('')
const cat = ref('all')
const categories = computed(() => [
  { value: 'all', label: 'Hammasi' },
  ...[...new Set(suppliers.value.map(s => s.category))].map(c => ({ value: c, label: c })),
])

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const orgFor = (name: string) => organizations.value.find(o => norm(o.name) === norm(name))
const matches = (name: string, category: string, city = '') => {
  const k = norm(q.value)
  if (cat.value !== 'all' && category !== cat.value) return false
  return !k || [name, category, city].some(f => norm(f).includes(k))
}

const promos = computed(() => suppliers.value.filter(s => s.promo))
const fresh = computed(() => suppliers.value
  .filter(s => !s.connected && matches(s.name, s.category, s.city))
  .sort((a, b) => b.rating - a.rating))

interface Mine { key: string, name: string, sub: string, cats: string[], city?: string, color: string, orgId?: string, listing?: SupplierListing, balance?: number }
const mine = computed<Mine[]>(() => {
  const list: Mine[] = organizations.value.filter(o => o.type === 'supplier').map((o) => {
    const listing = suppliers.value.find(s => norm(s.name) === norm(o.name))
    return { key: o.id, name: o.name, sub: o.categories.join(', ') || 'Ta\'minotchi', cats: [...o.categories, ...(listing ? [listing.category] : [])], city: listing?.city, color: o.logoColor, orgId: o.id, listing, balance: o.balance }
  })
  for (const s of suppliers.value) {
    if (s.connected && !list.some(m => m.listing?.id === s.id))
      list.push({ key: s.id, name: s.name, sub: `${s.category} · ${s.city}`, cats: [s.category], city: s.city, color: s.color, listing: s })
  }
  const k = norm(q.value)
  return list.filter(m => (cat.value === 'all' || m.cats.includes(cat.value)) && (!k || [m.name, m.city ?? '', ...m.cats].some(f => norm(f).includes(k))))
})

// Banner karusel
const track = ref<HTMLElement>()
const slide = ref(0)
function onScroll() {
  const el = track.value
  if (!el || !el.children[0]) return
  const w = (el.children[0] as HTMLElement).offsetWidth + 12
  slide.value = Math.round(el.scrollLeft / w)
}
function goSlide(i: number) {
  const el = track.value
  const card = el?.children[i] as HTMLElement | undefined
  if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: 'smooth' })
}

const NuxtLink = resolveComponent('NuxtLink')
const gradient = (c: string) => `linear-gradient(135deg, ${c} 0%, color-mix(in srgb, ${c} 55%, #000) 100%)`
const cleanName = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, '')

// Ulanish so'rovi
function request(s: SupplierListing) {
  haptic('medium')
  s.requested = true
  show('So\'rov yuborildi')
}
function cancel(s: SupplierListing) {
  selection()
  s.requested = false
  show('So\'rov bekor qilindi', 'info')
}

const detailId = ref<string>()
const detailOpen = ref(false)
const detail = computed(() => suppliers.value.find(s => s.id === detailId.value))
const detailOrg = computed(() => detail.value ? orgFor(detail.value.name) : undefined)
function openDetail(s: SupplierListing) {
  selection()
  detailId.value = s.id
  detailOpen.value = true
}
const about: Record<string, string> = {
  'Sut mahsulotlari': 'Har kuni yangi sut, qatiq, tvorog va pishloq. Sovutgichli transportda yetkazib beriladi.',
  'Oziq-ovqat': 'Guruch, un, yog\', shakar va boshqa kundalik mahsulotlar ulgurji narxlarda.',
  'Ichimliklar': 'Gazli va gazsiz ichimliklar, sharbatlar, suv. Rasmiy distribyutor narxlari.',
  'Non mahsulotlari': 'Har kuni ertalab issiq non va pishiriqlar yetkazib beriladi.',
  'Maishiy kimyo': 'Yuvish vositalari, gigiyena va uy-ro\'zg\'or buyumlari keng assortimentda.',
  'Shirinliklar': 'Konfet, pechenye, tort va milliy shirinliklar. Bayram aksiyalari muntazam.',
}
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
    <PageHeader title="Ta'minotchilar" subtitle="Yangi hamkorlar toping va ulaning" back="/mijozlar?tab=org" />

    <div class="flex shrink-0 flex-col gap-3 px-5 pb-3">
      <BInput v-model="q" placeholder="Nomi, yo'nalish yoki shahar" icon="search" inputmode="search">
        <template #end>
          <button v-if="q" type="button" aria-label="Tozalash" class="text-muted" @click.prevent="q = ''"><AppIcon name="x" :size="18" /></button>
        </template>
      </BInput>
      <Chips v-model="cat" :options="categories" />
    </div>

    <div class="no-scrollbar flex min-h-0 grow flex-col gap-5 overflow-y-auto pb-6">
      <!-- Banner reklama kartalari -->
      <section v-if="promos.length && !q && cat === 'all'" class="flex flex-col gap-2.5">
        <div ref="track" class="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 py-1" @scroll.passive="onScroll">
          <button
            v-for="s in promos" :key="s.id" type="button"
            class="relative flex h-[164px] w-[86%] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] p-4 text-left text-white shadow-float"
            :style="{ background: gradient(s.color) }" @click="openDetail(s)"
          >
            <span class="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-white/12" />
            <span class="pointer-events-none absolute -right-4 -bottom-16 size-32 rounded-full bg-white/8" />
            <span class="flex items-center gap-2">
              <span class="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase">Reklama</span>
              <span class="flex items-center gap-0.5 text-xs font-bold text-white/90"><AppIcon name="star" :size="13" class="fill-current" />{{ s.rating }}</span>
            </span>
            <span class="mt-2.5 text-[22px] leading-tight font-extrabold tracking-tight">{{ s.promo }}</span>
            <span class="mt-auto flex items-end justify-between gap-2">
              <span class="min-w-0">
                <span class="block truncate text-sm font-extrabold">{{ s.name }}</span>
                <span class="block truncate text-xs font-medium text-white/75">{{ s.category }} · {{ s.city }}</span>
              </span>
              <span class="flex h-9 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-xs font-extrabold" :style="{ color: s.color }">
                Batafsil <AppIcon name="arrow-right" :size="14" />
              </span>
            </span>
          </button>
        </div>
        <div v-if="promos.length > 1" class="flex justify-center gap-1.5">
          <button
            v-for="(s, i) in promos" :key="s.id" type="button" :aria-label="`${i + 1}-banner`"
            class="h-1.5 rounded-full transition-all" :class="slide === i ? 'w-5 bg-brand' : 'w-1.5 bg-black/15'"
            @click="goSlide(i)"
          />
        </div>
      </section>

      <!-- Mening ta'minotchilarim -->
      <section class="flex flex-col gap-2.5 px-5">
        <SectionHead title="Mening ta'minotchilarim" :action="mine.length ? `${mine.length} ta` : undefined" />
        <div v-if="mine.length" class="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-1">
          <component
            :is="m.orgId ? NuxtLink : 'button'" v-for="m in mine" :key="m.key"
            :to="m.orgId ? `/tashkilotlar/${m.orgId}` : undefined" :type="m.orgId ? undefined : 'button'"
            class="card flex w-[150px] shrink-0 flex-col gap-2 p-3.5 text-left"
            @click="!m.orgId && m.listing ? openDetail(m.listing) : selection()"
          >
            <Avatar :name="cleanName(m.name)" :color="m.color" :size="42" square />
            <span class="min-w-0">
              <span class="line-clamp-2 text-[13px] leading-tight font-extrabold">{{ m.name }}</span>
              <span class="mt-0.5 block truncate text-[11px] font-semibold text-muted">{{ m.sub }}</span>
            </span>
            <span v-if="m.balance && m.balance > 0" class="text-[11px] font-extrabold text-danger">{{ money(m.balance) }} qarz</span>
            <span v-else-if="m.orgId" class="text-[11px] font-bold text-brand">Hisob toza</span>
            <span v-else class="text-[11px] font-bold text-info">Ulangan</span>
          </component>
        </div>
        <div v-else class="card"><EmptyState icon="handshake" title="Hali ta'minotchi yo'q" text="Quyidagi hamkorlarga ulanish so'rovini yuboring" /></div>
      </section>

      <!-- Yangi hamkorlar -->
      <section class="flex flex-col gap-2.5 px-5">
        <SectionHead title="Yangi hamkorlar" :action="fresh.length ? `${fresh.length} ta` : undefined" />
        <div v-if="fresh.length" class="flex flex-col gap-3">
          <article v-for="s in fresh" :key="s.id" class="card flex flex-col gap-3 p-4">
            <button type="button" class="flex items-start gap-3 text-left" @click="openDetail(s)">
              <Avatar :name="cleanName(s.name)" :color="s.color" :size="48" square />
              <span class="min-w-0 grow">
                <span class="block truncate text-[15px] font-extrabold">{{ s.name }}</span>
                <span class="block truncate text-xs font-semibold text-muted">{{ s.category }} · {{ s.city }}</span>
                <span class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted-2">
                  <span class="flex items-center gap-0.5 text-warn"><AppIcon name="star" :size="12" class="fill-current" />{{ s.rating.toFixed(1) }}</span>
                  <span class="flex items-center gap-1"><AppIcon name="box" :size="12" />{{ s.products }} mahsulot</span>
                  <span class="flex items-center gap-1"><AppIcon name="cart" :size="12" />min {{ amount(s.minOrder) }}</span>
                </span>
              </span>
              <AppIcon name="chevron-right" :size="18" class="mt-1 shrink-0 text-muted" />
            </button>
            <div v-if="s.promo" class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold" :style="{ background: `${s.color}14`, color: s.color }">
              <AppIcon name="tag" :size="14" />{{ s.promo }}
            </div>
            <div v-if="s.requested" class="flex items-center gap-2">
              <Badge tone="info"><AppIcon name="clock" :size="12" />So'rov yuborildi</Badge>
              <span class="grow text-[11px] font-medium text-muted">Javob kutilmoqda</span>
              <button type="button" class="text-[13px] font-bold text-danger" @click="cancel(s)">Bekor qilish</button>
            </div>
            <PillButton v-else size="sm" variant="soft" icon="handshake" block @click="request(s)">Ulanish so'rovi</PillButton>
          </article>
        </div>
        <div v-else class="card">
          <EmptyState icon="search" title="Hamkor topilmadi" :text="q || cat !== 'all' ? 'Qidiruv yoki filtrni o\'zgartiring' : 'Barcha ta\'minotchilarga ulangansiz'" />
        </div>
      </section>
    </div>

    <!-- Batafsil -->
    <BSheet v-model="detailOpen">
      <template v-if="detail">
        <div class="relative -mx-1 mt-1 overflow-hidden rounded-[24px] p-5 text-white" :style="{ background: gradient(detail.color) }">
          <span class="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/12" />
          <span class="flex size-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold" :style="{ color: detail.color }">
            {{ cleanName(detail.name).split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() }}
          </span>
          <h2 class="mt-3 text-xl leading-tight font-extrabold">{{ detail.name }}</h2>
          <p class="text-[13px] font-medium text-white/80">{{ detail.category }} · {{ detail.city }}</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span class="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold"><AppIcon name="star" :size="12" class="fill-current" />{{ detail.rating.toFixed(1) }}</span>
            <span v-if="detail.connected" class="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-brand"><AppIcon name="check" :size="12" />Ulangan</span>
            <span v-else-if="detail.requested" class="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">So'rov yuborildi</span>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2.5">
          <div class="card p-3 text-center">
            <p class="text-base font-extrabold">{{ detail.products }}</p>
            <p class="text-[11px] font-bold text-muted">mahsulot</p>
          </div>
          <div class="card p-3 text-center">
            <p class="text-base font-extrabold">{{ formatSom(detail.minOrder / 1000) }}k</p>
            <p class="text-[11px] font-bold text-muted">min buyurtma</p>
          </div>
          <div class="card p-3 text-center">
            <p class="truncate text-base font-extrabold">{{ detail.city }}</p>
            <p class="text-[11px] font-bold text-muted">shahar</p>
          </div>
        </div>

        <div v-if="detail.promo" class="mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold" :style="{ background: `${detail.color}14`, color: detail.color }">
          <AppIcon name="tag" :size="18" />{{ detail.promo }}
        </div>

        <div class="card mt-3 p-4">
          <p class="text-xs font-bold text-muted">Kompaniya haqida</p>
          <p class="mt-1 text-sm font-medium text-muted-2">{{ about[detail.category] ?? 'Ishonchli ulgurji ta\'minotchi.' }}</p>
          <p class="mt-3 text-xs font-bold text-muted">Shartlar</p>
          <ul class="mt-1 flex flex-col gap-1 text-sm font-medium text-muted-2">
            <li class="flex items-center gap-2"><AppIcon name="cart" :size="15" class="text-brand" />Minimal buyurtma: {{ money(detail.minOrder) }}</li>
            <li class="flex items-center gap-2"><AppIcon name="truck" :size="15" class="text-brand" />Yetkazib berish: {{ detail.city }} bo'ylab 1–2 kun</li>
            <li class="flex items-center gap-2"><AppIcon name="wallet" :size="15" class="text-brand" />To'lov: o'tkazma, naqd, muddatli</li>
          </ul>
        </div>
      </template>
      <template #footer>
        <template v-if="detail">
          <div v-if="detail.connected" class="flex gap-2.5">
            <PillButton v-if="detailOrg" variant="field" class="grow basis-0" icon="building" :to="`/tashkilotlar/${detailOrg.id}`">Sahifasi</PillButton>
            <PillButton class="grow basis-0" icon="truck" :to="detailOrg ? `/ombor/kirim?org=${detailOrg.id}` : '/ombor/kirim'">Buyurtma</PillButton>
          </div>
          <PillButton v-else-if="detail.requested" block variant="danger" icon="x" @click="cancel(detail)">So'rovni bekor qilish</PillButton>
          <PillButton v-else block icon="handshake" @click="request(detail)">Ulanish so'rovi yuborish</PillButton>
        </template>
      </template>
    </BSheet>
  </div>
</template>
