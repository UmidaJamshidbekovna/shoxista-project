<script setup lang="ts">
import { ONBOARDED_KEY } from '~/middleware/onboarding.global'

const SLIDE_KEY = 'baraka:onb-slide'
const LANG_KEY = 'baraka:onb-lang'
const TARGET_KEY = 'baraka:onb-target'

const { tg, haptic, selection } = useTelegram()

const COPY = {
  uz: {
    slides: [
      { tag: 'Jamoa', title: 'Jamoangizni bir joydan boshqaring', text: 'Xodimlar, rollar va filiallar — barchasi bitta ilovada. Kim nima qilayotganini real vaqtda ko\'ring.' },
      { tag: 'Savdo', title: 'Savdongiz — doimo nazoratda', text: 'Kassa, ombor va online buyurtmalar bir joyda. Tushum va qoldiqni istalgan payt kuzating.' },
      { tag: 'Aloqa', title: 'Mijozlar sizdan uzoqda emas', text: 'Telegram, Instagram va ilova xabarlari yagona inboxda. Birorta buyurtma ham e\'tibordan chetda qolmaydi.' },
      { tag: 'AI', title: 'AI ni yordamchingizga aylantiring', text: 'Savol bering — AI tushum, qarzdorlar va tugayotgan mahsulotlar haqida darhol javob beradi.' },
    ],
    next: 'Keyingi', back: 'Orqaga', skip: 'O\'tkazish', start: 'Boshlash',
    tweaks: 'Sozlamalar', lang: 'Til', target: '"Boshlash" manzili',
  },
  en: {
    slides: [
      { tag: 'Team', title: 'Manage your team from one place', text: 'Staff, roles and branches — all in one app. See who is doing what in real time.' },
      { tag: 'Sales', title: 'Your sales — always under control', text: 'Checkout, stock and online orders in one place. Track revenue and inventory anytime.' },
      { tag: 'Reach', title: 'Customers are never far away', text: 'Telegram, Instagram and in-app messages in a single inbox. No order slips through.' },
      { tag: 'AI', title: 'Turn AI into your assistant', text: 'Just ask — AI instantly answers about revenue, debtors and items running low.' },
    ],
    next: 'Next', back: 'Back', skip: 'Skip', start: 'Get started',
    tweaks: 'Tweaks', lang: 'Language', target: '"Get started" target',
  },
} as const

const targets = [
  { value: '/', label: ['Bosh sahifa', 'Home'] },
  { value: '/sotish', label: ['Sotish', 'Sell'] },
  { value: '/ombor', label: ['Ombor', 'Stock'] },
  { value: '/profil', label: ['Profil', 'Profile'] },
]

const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }

const index = ref(Math.min(3, Math.max(0, Number(read(SLIDE_KEY)) || 0)))
const lang = ref<'uz' | 'en'>(read(LANG_KEY) === 'en' ? 'en' : 'uz')
const target = ref(read(TARGET_KEY) || '/')
const tweaksOpen = ref(false)

const c = computed(() => COPY[lang.value])
const total = 4
const isLast = computed(() => index.value === total - 1)

watch(index, v => write(SLIDE_KEY, String(v)))
watch(lang, v => write(LANG_KEY, v))
watch(target, v => write(TARGET_KEY, v))

function go(i: number) {
  const n = Math.min(total - 1, Math.max(0, i))
  if (n !== index.value) { index.value = n; selection() }
}
const next = () => isLast.value ? finish() : go(index.value + 1)
const prev = () => go(index.value - 1)

function finish() {
  haptic('medium')
  write(ONBOARDED_KEY, '1')
  write(SLIDE_KEY, '0')
  navigateTo(target.value || '/', { replace: true })
}

// --- swipe (pointer events) ---
const track = ref<HTMLElement>()
const dx = ref(0)
const dragging = ref(false)
let startX = 0
let startY = 0
let pointerId: number | null = null

function onDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  dragging.value = true
  dx.value = 0
}
function onMove(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  const x = e.clientX - startX
  if (Math.abs(x) > 6 && Math.abs(x) > Math.abs(e.clientY - startY)) track.value?.setPointerCapture?.(e.pointerId)
  // chekkalarda qarshilik
  const edge = (index.value === 0 && x > 0) || (isLast.value && x < 0)
  dx.value = edge ? x * 0.3 : x
}
function onUp(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  const w = track.value?.clientWidth ?? 390
  const x = dx.value
  dragging.value = false
  dx.value = 0
  pointerId = null
  if (x < -Math.min(60, w * 0.18)) go(index.value + 1)
  else if (x > Math.min(60, w * 0.18)) go(index.value - 1)
}

function onKey(e: KeyboardEvent) {
  if (tweaksOpen.value) return
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'Enter' && isLast.value) finish()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  tg?.BackButton?.hide?.()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden bg-onb-bg">
    <div class="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,#d3ecdc_0%,transparent_70%)]" />

    <!-- tepa: logotip, til, sozlamalar -->
    <header class="relative flex shrink-0 items-center gap-2 px-5 pt-4 pb-2">
      <div class="flex grow items-center gap-2">
        <span class="flex size-9 items-center justify-center rounded-[12px] bg-onb text-white shadow-[0_6px_14px_rgba(14,138,95,0.35)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19l7-7" />
          </svg>
        </span>
        <span class="text-[22px] font-extrabold tracking-[-0.02em] text-onb">Baraka</span>
      </div>
      <button
        type="button" class="flex h-9 items-center rounded-full bg-white p-1 text-[12px] font-extrabold shadow-card"
        :aria-label="c.lang" @click="lang = lang === 'uz' ? 'en' : 'uz'; selection()"
      >
        <span class="rounded-full px-2.5 py-1 transition-colors" :class="lang === 'uz' ? 'bg-onb text-white' : 'text-muted'">UZ</span>
        <span class="rounded-full px-2.5 py-1 transition-colors" :class="lang === 'en' ? 'bg-onb text-white' : 'text-muted'">EN</span>
      </button>
      <button type="button" class="flex size-9 items-center justify-center rounded-full bg-white text-muted-2 shadow-card" :aria-label="c.tweaks" @click="tweaksOpen = true">
        <AppIcon name="settings" :size="18" />
      </button>
    </header>

    <!-- slaydlar -->
    <div
      ref="track"
      class="relative min-h-0 grow touch-pan-y overflow-hidden select-none"
      @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
    >
      <div
        class="flex h-full"
        :class="dragging ? '' : 'transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]'"
        :style="{ transform: `translateX(calc(${-index * 100}% + ${dx}px))` }"
      >
        <section
          v-for="(s, i) in c.slides" :key="i"
          class="flex h-full w-full shrink-0 flex-col px-6"
          :aria-hidden="i !== index" :aria-label="`${i + 1} / ${total}`"
        >
          <div class="flex min-h-0 grow items-center justify-center py-2">
            <div class="transition-all duration-500" :class="i === index ? 'scale-100 opacity-100' : 'scale-90 opacity-40'">
              <HomeOnbArt :slide="i" :lang="lang" />
            </div>
          </div>
          <div class="shrink-0 pb-2">
            <span class="inline-flex h-7 items-center rounded-full bg-white px-3 text-[12px] font-extrabold text-onb shadow-card">{{ i + 1 }} · {{ s.tag }}</span>
            <h1 class="mt-3 text-[31px] leading-[1.12] font-extrabold tracking-[-0.02em] text-ink-2">{{ s.title }}</h1>
            <p class="mt-2.5 text-[15px] leading-relaxed font-medium text-muted-2">{{ s.text }}</p>
          </div>
        </section>
      </div>
    </div>

    <!-- boshqaruv -->
    <footer class="pb-safe relative shrink-0 px-6 pt-3 pb-6">
      <div class="mb-4 flex h-8 items-center justify-between">
        <div class="flex items-center gap-1.5" role="tablist">
          <button
            v-for="i in total" :key="i" type="button" role="tab" :aria-selected="index === i - 1" :aria-label="`${i}`"
            class="h-2 rounded-full transition-all duration-300"
            :class="index === i - 1 ? 'w-7 bg-onb' : 'w-2 bg-onb/25 hover:bg-onb/45'"
            @click="go(i - 1)"
          />
        </div>
        <button v-if="!isLast" type="button" class="text-[14px] font-bold text-muted-2 hover:text-onb" @click="finish">{{ c.skip }}</button>
      </div>
      <div class="flex items-center gap-3">
        <Transition enter-from-class="w-0 opacity-0" leave-to-class="w-0 opacity-0" enter-active-class="transition-all duration-300" leave-active-class="transition-all duration-300">
          <button
            v-if="index > 0" type="button"
            class="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-ink-2 shadow-card active:scale-95"
            :aria-label="c.back" :title="c.back" @click="prev"
          >
            <AppIcon name="chevron-left" :size="22" />
          </button>
        </Transition>
        <button
          type="button"
          class="flex h-[54px] grow items-center justify-center gap-2 rounded-full bg-onb text-[16px] font-extrabold text-white shadow-[0_10px_24px_rgba(14,138,95,0.35)] transition hover:bg-onb-hover active:scale-[0.98]"
          @click="next"
        >
          {{ isLast ? c.start : c.next }}
          <AppIcon :name="isLast ? 'check' : 'arrow-right'" :size="20" />
        </button>
      </div>
    </footer>

    <BSheet v-model="tweaksOpen" :title="c.tweaks">
      <div class="flex flex-col gap-5 pb-2">
        <div class="flex flex-col gap-2">
          <span class="text-[13px] font-bold text-muted-2">{{ c.lang }}</span>
          <Segmented v-model="lang" :options="[{ value: 'uz', label: 'O\'zbekcha' }, { value: 'en', label: 'English' }]" />
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-[13px] font-bold text-muted-2">{{ c.target }}</span>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="tg2 in targets" :key="tg2.value" type="button"
              class="flex h-12 items-center justify-between rounded-2xl border-2 px-4 text-[14px] font-bold transition-colors"
              :class="target === tg2.value ? 'border-onb bg-soft-2 text-onb' : 'border-transparent bg-card text-ink shadow-card'"
              @click="target = tg2.value; selection()"
            >
              {{ tg2.label[lang === 'uz' ? 0 : 1] }}
              <span class="text-[11px] font-semibold text-muted">{{ tg2.value }}</span>
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="h-[52px] w-full rounded-full bg-onb text-[15px] font-extrabold text-white hover:bg-onb-hover" @click="tweaksOpen = false">OK</button>
      </template>
    </BSheet>
  </div>
</template>
