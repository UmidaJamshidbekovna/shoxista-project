<script setup lang="ts">
// Asosiy sahifadagi AI robot (AI Robot.md): o'ng chetdan mo'ralab turadi, vertikal sudraladi,
// bosilganda mini AI oyna ochiladi. To'liq suhbat — Chat → "Baraka AI yordamchi".
import { AI_QUICK } from '~/composables/useAiRobot'

const ROBOT_KEY = 'sm_robotY'
const AI_TOP = 250

const { aiCur, thread, askAiQ } = useAiRobot()
const { haptic, selection } = useTelegram()

const aiOpen = ref(false)
const aiQ = ref('')
const robotY = ref(300)
const robotDrag = ref(false)
let drag: { y0: number, t0: number, moved: boolean } | null = null

const clamp = (v: number) => Math.max(60, Math.min(600, v))

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(ROBOT_KEY))
    if (saved) robotY.value = clamp(saved)
  }
  catch {}
})

function robotDown(e: PointerEvent) {
  if (aiOpen.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag = { y0: e.clientY, t0: robotY.value, moved: false }
}
function robotMove(e: PointerEvent) {
  if (!drag) return
  const dy = e.clientY - drag.y0
  if (Math.abs(dy) > 5) drag.moved = true
  if (drag.moved) {
    robotDrag.value = true
    robotY.value = clamp(drag.t0 + dy)
  }
}
function robotUp() {
  if (!drag) return
  const moved = drag.moved
  drag = null
  robotDrag.value = false
  if (!moved) return open()
  try { localStorage.setItem(ROBOT_KEY, String(robotY.value)) }
  catch {}
}

function open() {
  haptic('medium')
  aiCur.value = null
  aiOpen.value = true
}
function close() {
  aiOpen.value = false
  aiCur.value = null
  aiQ.value = ''
}
function send(text = aiQ.value) {
  if (!text.trim()) return
  selection()
  aiQ.value = ''
  askAiQ(text)
}
function openHistory() {
  const id = thread.value?.id
  close()
  if (id) navigateTo(`/chat/${id}`)
}

/** Yopiq robot ochilganda oyna yoniga siljib, yo'qoladi (§2.3) */
const robotStyle = computed(() => aiOpen.value
  ? { right: '10px', top: `${AI_TOP + 290 - 110}px`, width: '84px', transform: 'rotate(0deg)', opacity: 0 }
  : { right: '-52px', top: `${robotY.value}px`, width: '92px' })
</script>

<template>
  <!-- Fon: blur + qoraytirish -->
  <div v-if="aiOpen" class="ai-overlay absolute inset-0 z-[14]" @click="close" />

  <!-- Mini AI oyna -->
  <div
    v-if="aiOpen"
    class="ai-win absolute z-16 flex h-[290px] w-[300px] flex-col rounded-[22px] bg-white shadow-[0_18px_40px_rgba(5,40,25,0.22)]"
    :style="{ left: '14px', top: `${AI_TOP}px` }"
    role="dialog" aria-label="AI yordamchi"
  >
    <div class="flex shrink-0 items-center gap-2 pt-3 pr-3 pb-2 pl-3.5">
      <span class="flex size-7 items-center justify-center rounded-[9px] bg-soft text-brand"><AppIcon name="sparkle" :size="14" :stroke="2" /></span>
      <span class="grow text-[13.5px] font-extrabold text-ink">AI yordamchi</span>
      <button type="button" aria-label="AI suhbat tarixi" class="flex size-[30px] items-center justify-center rounded-full bg-field text-ink" @click="openHistory">
        <AppIcon name="history" :size="15" :stroke="2" />
      </button>
      <button type="button" aria-label="Yopish" class="flex size-[30px] items-center justify-center rounded-full bg-field text-ink" @click="close">
        <AppIcon name="x" :size="14" :stroke="2.2" />
      </button>
    </div>

    <div class="no-scrollbar flex min-h-0 grow flex-col gap-2 overflow-y-auto px-3.5 pt-1 pb-2">
      <template v-if="!aiCur">
        <p class="text-xs font-medium text-muted">Do'koningiz haqida so'rang:</p>
        <button
          v-for="q in AI_QUICK" :key="q" type="button"
          class="self-start rounded-xl bg-app px-[11px] py-[7px] text-left text-[12.5px] font-semibold text-ink transition-colors hover:bg-soft"
          @click="send(q)"
        >
          {{ q }}
        </button>
      </template>
      <template v-else>
        <div class="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-brand px-[11px] py-2 text-[12.5px] leading-[1.4] text-white">{{ aiCur.q }}</div>
        <div v-if="aiCur.a === null" class="flex gap-1 self-start rounded-[14px] bg-soft-2 px-3 py-[11px]" aria-label="Javob yozilmoqda">
          <span v-for="i in 3" :key="i" class="ai-dot size-1.5 rounded-full bg-brand" :style="{ animationDelay: `${(i - 1) * 0.15}s` }" />
        </div>
        <div v-else class="ai-fade max-w-[92%] self-start rounded-[14px_14px_14px_4px] bg-soft-2 px-[11px] py-[9px] text-[12.5px] leading-[1.45] text-[#14532d]">{{ aiCur.a }}</div>
      </template>
    </div>

    <form class="flex shrink-0 items-center gap-1.5 border-t border-[#f0f1f4] px-2.5 pt-2 pb-2.5" @submit.prevent="send()">
      <input
        v-model="aiQ" type="text" placeholder="Savol yozing..." enterkeyhint="send"
        class="h-9 min-w-0 grow rounded-[18px] bg-field px-3.5 text-[13px] font-medium text-ink outline-none placeholder:text-muted"
      >
      <button type="submit" aria-label="Yuborish" class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50" :disabled="!aiQ.trim()">
        <AppIcon name="send" :size="15" :stroke="2" />
      </button>
    </form>
  </div>

  <!-- Ochiq robot: oynaga qarab turadi -->
  <img
    v-if="aiOpen" src="/assets/ai-robot-open.png" alt="" aria-hidden="true" draggable="false"
    class="ai-robot-open pointer-events-none absolute right-[13px] z-[17] h-auto w-[84px] select-none"
    style="top: 406px"
  >

  <!-- Yopiq robot: chetdan mo'ralaydi -->
  <img
    src="/assets/ai-robot-v3.png" alt="AI yordamchi" role="button" tabindex="0" draggable="false"
    class="ai-robot absolute z-[17] h-auto cursor-pointer touch-none select-none"
    :class="{ peek: !aiOpen && !robotDrag, dragging: robotDrag }"
    :style="robotStyle"
    @pointerdown="robotDown" @pointermove="robotMove" @pointerup="robotUp" @pointercancel="robotUp"
    @keydown.enter="open"
  >
</template>

<style scoped>
.ai-robot {
  transform: rotate(-30deg);
  transform-origin: 100% 100%;
  filter: drop-shadow(-6px 8px 12px rgba(0, 0, 0, 0.28));
  transition: right .45s cubic-bezier(.2, .8, .2, 1), top .45s cubic-bezier(.2, .8, .2, 1), width .45s, transform .45s, opacity .25s;
  -webkit-user-select: none;
}
.ai-robot.dragging { transition: none; }
.peek { animation: peek 3.2s ease-in-out infinite; }
@keyframes peek {
  0%, 100% { transform: translateX(0) rotate(-30deg); }
  50% { transform: translateX(-6px) rotate(-24deg); }
}

.ai-robot-open {
  filter: drop-shadow(-6px 8px 12px rgba(0, 0, 0, 0.28));
  animation: aiIn .4s cubic-bezier(.2, .8, .2, 1);
}

.ai-overlay {
  background: rgba(18, 18, 18, 0.14);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade .2s ease-out;
}
.ai-win {
  transform-origin: 100% 100%;
  animation: aiIn .32s cubic-bezier(.2, .8, .2, 1);
}
.ai-fade { animation: fade .25s ease-out; }
.ai-dot { animation: dot 1s infinite; }

@keyframes aiIn {
  from { opacity: 0; transform: translate(14px, 14px) scale(.85); }
  to { opacity: 1; transform: none; }
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dot { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
</style>
