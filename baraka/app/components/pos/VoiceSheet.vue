<script setup lang="ts">
import type { PosDetected } from '~/composables/usePos'

// Ovozli qo'shish: "2 ta guruch, 1 ta sut". Web Speech API bo'lsa — haqiqiy tanib olish, bo'lmasa demo.
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ confirm: [items: PosDetected[]] }>()
const { parseSpeech } = usePos()
const { haptic } = useTelegram()

const DEMO = ['2 ta guruch, 1 ta sut va 3 ta choy', '1 ta yog\', 2 ta coca-cola', 'ikkita shokolad, bitta kir yuvish kukuni']

const stage = ref<'idle' | 'listening' | 'done'>('idle')
const transcript = ref('')
const typed = ref('')
const items = ref<PosDetected[]>([])
const unknown = ref<string[]>([])
const real = ref(false)
/** Web Speech API'ning bizga kerakli qismi (TS lib'da standart tur yo'q) */
interface SpeechResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface SpeechRec {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  abort?: () => void
}
type SpeechRecCtor = new () => SpeechRec
let rec: SpeechRec | undefined
let timer: ReturnType<typeof setTimeout> | undefined

watch(open, (v) => {
  if (v) { reset(); start() }
  else stop()
})
onBeforeUnmount(stop)

function reset() {
  stage.value = 'idle'; transcript.value = ''; typed.value = ''; items.value = []; unknown.value = []
}

function start() {
  reset()
  haptic('medium')
  stage.value = 'listening'
  const w = window as Window & { webkitSpeechRecognition?: SpeechRecCtor, SpeechRecognition?: SpeechRecCtor }
  const SR = w.webkitSpeechRecognition || w.SpeechRecognition
  real.value = !!SR
  if (SR) {
    try {
      const r = new SR()
      rec = r
      r.lang = 'uz-UZ'
      r.interimResults = true
      r.continuous = false
      r.onresult = (e) => {
        transcript.value = Array.from(e.results).map(x => x[0]?.transcript ?? '').join(' ')
      }
      r.onerror = () => { if (!transcript.value) simulate() }
      r.onend = () => { if (transcript.value) finish(transcript.value) }
      r.start()
      return
    }
    catch { real.value = false }
  }
  simulate()
}

function simulate() {
  real.value = false
  const phrase = DEMO[Math.floor(Math.random() * DEMO.length)]!
  let i = 0
  const tick = () => {
    if (stage.value !== 'listening') return
    i += 2
    transcript.value = phrase.slice(0, i)
    if (i < phrase.length) timer = setTimeout(tick, 55)
    else timer = setTimeout(() => finish(phrase), 400)
  }
  timer = setTimeout(tick, 700)
}

function stop() {
  clearTimeout(timer)
  try { rec?.abort?.() } catch {}
  rec = undefined
}

function finish(text: string) {
  stop()
  transcript.value = text
  const r = parseSpeech(text)
  items.value = r.items
  unknown.value = r.unknown
  stage.value = 'done'
}

const typedError = computed(() => typed.value && !parseSpeech(typed.value).items.length ? 'Mahsulot aniqlanmadi. Masalan: "2 ta guruch"' : '')

const selected = computed(() => items.value.filter(i => i.on))
function confirm() {
  emit('confirm', selected.value)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="Ovoz bilan qo'shish">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-center gap-3 rounded-[22px] bg-card px-5 py-6 text-center shadow-card">
        <button
          type="button" class="relative flex size-20 items-center justify-center rounded-full text-white transition active:scale-95"
          :class="stage === 'listening' ? 'bg-danger' : 'bg-brand'"
          :aria-label="stage === 'listening' ? 'To\'xtatish' : 'Gapirish'"
          @click="stage === 'listening' ? (transcript ? finish(transcript) : (stop(), stage = 'idle')) : start()"
        >
          <span v-if="stage === 'listening'" class="absolute inset-0 animate-ping rounded-full bg-danger/40" />
          <AppIcon name="mic" :size="32" class="relative" />
        </button>
        <div v-if="stage === 'listening'" class="flex h-6 items-end gap-1">
          <span v-for="n in 7" :key="n" class="pos-bar w-1.5 rounded-full bg-brand" :style="{ animationDelay: `${n * 0.09}s` }" />
        </div>
        <p class="text-[13px] font-bold text-muted-2">
          {{ stage === 'listening' ? (real ? 'Tinglanmoqda... gapiring' : 'Tinglanmoqda... (demo)') : stage === 'done' ? 'Tanib olindi' : 'Mikrofonni bosing va gapiring' }}
        </p>
        <p class="min-h-6 text-[17px] font-extrabold text-ink">
          {{ transcript ? `«${transcript}»` : '«2 ta guruch, 1 ta sut»' }}
        </p>
      </div>

      <template v-if="stage === 'done'">
        <SectionHead title="Aniqlangan mahsulotlar" />
        <PosDetectedList v-if="items.length" v-model="items" />
        <EmptyState v-else icon="mic" title="Mahsulot aniqlanmadi" text="Qayta urinib ko'ring yoki matn bilan yozing" />
        <p v-if="unknown.length" class="rounded-2xl bg-warn-soft px-3 py-2 text-xs font-semibold text-warn">
          Tushunilmadi: {{ unknown.join(', ') }}
        </p>
      </template>

      <form class="flex items-start gap-2" @submit.prevent="typed && !typedError && finish(typed)">
        <div class="grow">
          <BInput v-model="typed" placeholder="Yoki yozing: 3 ta choy" icon="edit" :error="typedError" />
        </div>
        <RoundButton icon="arrow-right" label="Aniqlash" variant="brand" :size="50" @click="typed && !typedError && finish(typed)" />
      </form>
    </div>
    <template #footer>
      <PillButton v-if="stage === 'done' && items.length" block icon="check" :disabled="!selected.length" @click="confirm">
        Savatga qo'shish ({{ selected.length }})
      </PillButton>
      <PillButton v-else block variant="soft" icon="mic" :disabled="stage === 'listening'" @click="start">
        {{ stage === 'listening' ? 'Tinglanmoqda...' : 'Qayta gapirish' }}
      </PillButton>
    </template>
  </BSheet>
</template>

<style scoped>
.pos-bar { height: 30%; animation: pos-eq 0.8s ease-in-out infinite alternate; }
@keyframes pos-eq { from { height: 20%; } to { height: 100%; } }
</style>
