<script setup lang="ts">
import { AI_SUGGESTIONS } from '~/composables/useHomeAi'

const open = defineModel<boolean>({ default: false })
const { messages, typing, ask, reset } = useHomeAi()
const { haptic } = useTelegram()
const input = ref('')
const list = ref<HTMLElement>()

function send(q?: string) {
  const text = (q ?? input.value).trim()
  if (!text || typing.value) return
  haptic('light')
  ask(text)
  input.value = ''
}

function scrollDown() {
  nextTick(() => {
    const el = list.value?.closest('.overflow-y-auto') as HTMLElement | null
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}
watch(() => [messages.value.length, typing.value, open.value], scrollDown)

function go(to: string) {
  open.value = false
  navigateTo(to)
}
</script>

<template>
  <BSheet v-model="open" full>
    <div class="sticky -top-1 z-10 -mx-5 -mt-1 flex items-center gap-3 bg-app px-5 pt-2 pb-3">
      <span class="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#14a36f,#05472a)] text-white">
        <AppIcon name="robot" :size="22" />
        <span class="absolute right-0 bottom-0 size-3 rounded-full border-2 border-app bg-[#22c483]" />
      </span>
      <div class="min-w-0 grow">
        <h2 class="text-lg leading-tight font-extrabold">Baraka AI</h2>
        <p class="text-xs font-semibold text-muted">{{ typing ? 'yozmoqda…' : 'Do\'koningiz bo\'yicha yordamchi' }}</p>
      </div>
      <RoundButton icon="undo" label="Suhbatni tozalash" variant="field" :size="38" @click="reset" />
      <RoundButton icon="x" label="Yopish" variant="field" :size="38" @click="open = false" />
    </div>

    <div ref="list" class="flex flex-col gap-2.5 pt-1">
      <div
        v-for="m in messages" :key="m.id"
        class="flex animate-fade-in items-end gap-2"
        :class="m.from === 'me' ? 'justify-end' : 'justify-start'"
      >
        <span v-if="m.from === 'ai'" class="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
          <AppIcon name="sparkle" :size="15" />
        </span>
        <div
          class="max-w-[80%] rounded-[20px] px-4 py-2.5 text-[14px] leading-relaxed font-medium whitespace-pre-line"
          :class="m.from === 'me' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-soft-2 text-ink-2'"
        >
          {{ m.text }}
          <div v-if="m.links?.length" class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="l in m.links" :key="l.to" type="button"
              class="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-extrabold text-brand shadow-card"
              @click="go(l.to)"
            >
              {{ l.label }} <AppIcon name="chevron-right" :size="14" :stroke="2.6" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="typing" class="flex items-end gap-2">
        <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="sparkle" :size="15" /></span>
        <div class="flex items-center gap-1 rounded-[20px] rounded-bl-md bg-soft-2 px-4 py-3.5">
          <span v-for="d in 3" :key="d" class="ai-dot size-2 rounded-full bg-brand/60" :style="{ animationDelay: `${d * 0.16}s` }" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
        <button
          v-for="q in AI_SUGGESTIONS" :key="q" type="button" :disabled="typing"
          class="h-9 shrink-0 rounded-full border border-soft bg-soft-2 px-3.5 text-[13px] font-bold whitespace-nowrap text-brand transition active:scale-95 disabled:opacity-50"
          @click="send(q)"
        >
          {{ q }}
        </button>
      </div>
      <form class="flex items-center gap-2" @submit.prevent="send()">
        <input
          v-model="input" type="text" placeholder="Savolingizni yozing…" maxlength="200"
          class="h-[50px] min-w-0 grow rounded-full border-2 border-transparent bg-field px-5 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted focus:border-brand focus:bg-card"
        >
        <button
          type="submit" :disabled="!input.trim() || typing" aria-label="Yuborish"
          class="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover active:scale-95 disabled:opacity-40"
        >
          <AppIcon name="send" :size="20" />
        </button>
      </form>
    </template>
  </BSheet>
</template>

<style scoped>
.ai-dot { animation: ai-dot 1.1s ease-in-out infinite; }
@keyframes ai-dot { 0%, 100% { opacity: .35; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
</style>
