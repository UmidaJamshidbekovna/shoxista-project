<script setup lang="ts">
import type { ChatMessage } from '~/data/types'
import { channelLabel, statusLabel, statusTone } from '~/data/labels'

const route = useRoute()
const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')
const { chats, txById, customerById, orgById } = useStore()
const { money } = useMoney()
const { suggestions } = useChatAi()
const { askAiQ } = useAiRobot()
const aiPrompts = AI_QUICK
const { haptic, selection } = useTelegram()
const { show } = useToast()

const thread = computed(() => chats.value.find(c => c.id === route.params.id))
const isParty = computed(() => thread.value?.kind === 'customer' || thread.value?.kind === 'org')
const profileTo = computed(() => {
  const t = thread.value
  if (!t?.refId) return undefined
  if (t.kind === 'customer' && customerById(t.refId)) return `/mijozlar/${t.refId}`
  if (t.kind === 'org' && orgById(t.refId)) return `/tashkilotlar/${t.refId}`
  return undefined
})
const subtitle = computed(() => {
  const t = thread.value
  if (!t) return ''
  if (t.kind === 'ai') return typing.value ? 'yozmoqda…' : 'Har doim onlayn'
  if (t.kind === 'support') return typing.value ? 'yozmoqda…' : 'Baraka qo\'llab-quvvatlash'
  return `${t.kind === 'org' ? 'Firma' : 'Mijoz'} · ${channelLabel[t.channel]}`
})

// Xabarlar kunlar bo'yicha
const blocks = computed(() => {
  const out: { day: string, label: string, msgs: ChatMessage[] }[] = []
  for (const m of thread.value?.messages ?? []) {
    const k = dayKey(m.time)
    let b = out[out.length - 1]
    if (!b || b.day !== k) out.push(b = { day: k, label: formatDay(m.time), msgs: [] })
    b.msgs.push(m)
  }
  return out
})

const linkedIds = computed(() => [...new Set((thread.value?.messages ?? []).filter(m => m.orderId).map(m => m.orderId!))])
const pinned = computed(() => {
  const id = linkedIds.value[linkedIds.value.length - 1]
  return id ? txById(id) : undefined
})

const hints = computed(() => thread.value && isParty.value ? suggestions(thread.value) : [])
const showHints = ref(true)

// --- yuborish ---
const text = ref('')
const typing = ref(false)
const scroller = ref<HTMLElement>()
const inputEl = ref<HTMLTextAreaElement>()

function scrollDown(smooth = true) {
  nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }))
}
function push(m: Omit<ChatMessage, 'id' | 'time'>) {
  thread.value?.messages.push({ ...m, id: uid('m'), time: new Date().toISOString() })
  scrollDown()
}

function send(body = text.value) {
  const t = thread.value
  const msg = body.trim()
  if (!t || !msg || typing.value && t.kind === 'ai') return
  haptic('light')
  text.value = ''
  showHints.value = false
  // AI: mini oyna bilan bitta tarix, javob 1100 ms da (AI Robot.md §4.2, §6)
  if (t.kind === 'ai') {
    typing.value = true
    askAiQ(msg, () => {
      typing.value = false
      scrollDown()
    })
    scrollDown()
    return
  }
  push({ from: 'me', text: msg })
  if (t.kind === 'support') {
    typing.value = true
    if (supportTimer) clearTimeout(supportTimer)
    supportTimer = setTimeout(() => {
      supportTimer = undefined
      typing.value = false
      // Javob aynan yozilgan suhbatga tushadi (sahifa boshqa chatga o'tgan bo'lsa ham)
      t.messages.push({ from: 'them', text: 'Rahmat, murojaatingiz qabul qilindi! Operatorimiz 5 daqiqa ichida javob beradi.', id: uid('m'), time: new Date().toISOString() })
      if (thread.value === t) scrollDown()
    }, 1600)
  }
}
let supportTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => {
  if (supportTimer) clearTimeout(supportTimer)
  supportTimer = undefined
})

function applyHint(h: string) {
  selection()
  text.value = h
  nextTick(() => {
    inputEl.value?.focus()
    autoGrow()
  })
}
function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 110)}px`
}
watch(text, () => nextTick(autoGrow))
watch(() => thread.value?.messages.length, () => {
  const last = thread.value?.messages.at(-1)
  if (last?.from === 'them') showHints.value = true
})

// --- buyurtmaga bog'lash ---
const linkOpen = ref(false)
function link(id: string) {
  const t = thread.value
  const tx = txById(id)
  if (!t || !tx) return
  const target = [...t.messages].reverse().find(m => m.from === 'them' && !m.orderId)
  if (target) target.orderId = id
  else push({ from: 'me', text: `Buyurtma ${tx.no} bo'yicha`, orderId: id })
  show(`${tx.no} suhbatga bog'landi`)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// O'qilgan deb belgilash
watch(thread, (t) => { if (t) t.unread = 0 }, { immediate: true })
onMounted(() => scrollDown(false))
</script>

<template>
  <template v-if="thread">
    <header class="flex shrink-0 items-center gap-3 px-5 pt-4 pb-3">
      <RoundButton icon="chevron-left" label="Orqaga" @click="router.back()" />
      <component :is="profileTo ? NuxtLink : 'div'" :to="profileTo" class="flex min-w-0 grow items-center gap-2.5">
        <ChatThreadAvatar :thread="thread" :size="42" />
        <span class="min-w-0">
          <span class="flex items-center gap-1 truncate text-[17px] leading-tight font-extrabold">
            {{ thread.title }}<AppIcon v-if="profileTo" name="chevron-right" :size="15" class="shrink-0 text-muted" />
          </span>
          <span class="block truncate text-xs font-semibold" :class="typing ? 'text-brand' : 'text-muted'">{{ subtitle }}</span>
        </span>
      </component>
      <RoundButton v-if="isParty" icon="link" label="Buyurtmaga bog'lash" @click="linkOpen = true" />
    </header>

    <NuxtLink
      v-if="pinned" :to="`/tarix/${pinned.id}`"
      class="mx-5 mb-2 flex shrink-0 items-center gap-2.5 rounded-2xl bg-card px-3 py-2 shadow-card"
    >
      <span class="flex size-8 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="cart" :size="16" /></span>
      <span class="min-w-0 grow">
        <span class="block text-[13px] font-extrabold">{{ pinned.no }} · {{ money(pinned.total) }}</span>
        <span class="block text-[11px] font-semibold text-muted">Bog'langan buyurtma{{ linkedIds.length > 1 ? ` (+${linkedIds.length - 1})` : '' }}</span>
      </span>
      <Badge :tone="statusTone[pinned.status]">{{ statusLabel[pinned.status] }}</Badge>
    </NuxtLink>

    <div ref="scroller" class="no-scrollbar flex min-h-0 grow flex-col overflow-y-auto px-4 pb-3">
      <template v-for="b in blocks" :key="b.day">
        <div class="sticky top-0 z-10 my-2 flex justify-center">
          <span class="rounded-full bg-card/90 px-3 py-1 text-[11px] font-bold text-muted-2 shadow-card backdrop-blur">{{ b.label }}</span>
        </div>
        <div
          v-for="m in b.msgs" :key="m.id"
          class="mb-1.5 flex max-w-[82%] animate-fade-in flex-col"
          :class="m.from === 'me' ? 'items-end self-end' : 'items-start self-start'"
        >
          <span v-if="m.from === 'ai'" class="mb-1 flex items-center gap-1 pl-1 text-[11px] font-extrabold text-brand"><AppIcon name="sparkle" :size="12" />AI yordamchi</span>
          <div
            class="rounded-[20px] px-3.5 py-2.5 text-[14px] leading-snug font-medium whitespace-pre-line"
            :class="{
              'rounded-br-md bg-brand text-white': m.from === 'me',
              'rounded-bl-md bg-card text-ink shadow-card': m.from === 'them',
              'rounded-bl-md bg-soft-2 text-ink-2': m.from === 'ai',
            }"
          >
            {{ m.text }}
            <NuxtLink
              v-if="m.orderId && txById(m.orderId)" :to="`/tarix/${m.orderId}`"
              class="mt-2 flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold"
              :class="m.from === 'me' ? 'bg-white/15 text-white' : 'bg-soft text-brand'"
            >
              <AppIcon name="link" :size="13" />
              {{ txById(m.orderId)!.no }} · {{ money(txById(m.orderId)!.total) }}
              <span class="ml-auto opacity-80">{{ statusLabel[txById(m.orderId)!.status] }}</span>
            </NuxtLink>
            <span class="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-semibold" :class="m.from === 'me' ? 'text-white/65' : 'text-muted'">
              {{ formatTime(m.time) }}<AppIcon v-if="m.from === 'me'" name="check" :size="11" :stroke="2.6" />
            </span>
          </div>
        </div>
      </template>
      <div v-if="typing" class="mb-1.5 flex items-center gap-1 self-start rounded-[20px] rounded-bl-md px-4 py-3.5" :class="thread.kind === 'ai' ? 'bg-soft-2' : 'bg-card shadow-card'">
        <span v-for="i in 3" :key="i" class="size-1.5 animate-bounce rounded-full bg-brand/60" :style="{ animationDelay: `${i * 120}ms` }" />
      </div>
    </div>

    <div class="pb-safe shrink-0 bg-card pt-2.5 pb-3 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
      <div v-if="hints.length && showHints" class="mb-2.5">
        <div class="mb-1.5 flex items-center justify-between px-5">
          <span class="flex items-center gap-1 text-[11px] font-extrabold text-brand"><AppIcon name="sparkle" :size="13" />AI javob taklifi</span>
          <button type="button" class="text-[11px] font-bold text-muted" @click="showHints = false">Yashirish</button>
        </div>
        <div class="no-scrollbar flex gap-2 overflow-x-auto px-5">
          <button
            v-for="h in hints" :key="h" type="button"
            class="w-[230px] shrink-0 rounded-2xl border border-soft bg-soft-2 px-3 py-2 text-left text-[12.5px] leading-snug font-semibold text-ink-2 active:scale-[0.98]"
            @click="applyHint(h)"
          >
            <span class="line-clamp-3">{{ h }}</span>
          </button>
        </div>
      </div>
      <div v-else-if="thread.kind === 'ai'" class="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto px-5">
        <button
          v-for="p in aiPrompts" :key="p" type="button" :disabled="typing"
          class="h-8 shrink-0 rounded-full bg-soft-2 px-3 text-xs font-bold text-brand disabled:opacity-50"
          @click="send(p)"
        >
          {{ p }}
        </button>
      </div>

      <div class="flex items-end gap-2 px-5">
        <RoundButton v-if="isParty && !(hints.length && showHints)" icon="sparkle" label="AI javob taklifi" variant="field" :size="44" @click="showHints = true; selection()" />
        <textarea
          ref="inputEl" v-model="text" rows="1"
          :placeholder="thread.kind === 'ai' ? 'AI dan so\'rang…' : 'Xabar yozing…'"
          class="max-h-[110px] min-h-[44px] grow resize-none rounded-[22px] bg-field px-4 py-[11px] text-[15px] font-medium text-ink outline-none placeholder:text-muted focus:bg-field"
          @keydown="onKey"
        />
        <RoundButton icon="send" label="Yuborish" variant="brand" :size="44" :class="!text.trim() && 'opacity-50'" @click="send()" />
      </div>
    </div>

    <ChatLinkOrderSheet v-if="isParty" v-model="linkOpen" :thread="thread" :linked="linkedIds" @pick="link" />
  </template>

  <template v-else>
    <PageHeader title="Chat" back="/chat" />
    <EmptyState icon="chat" title="Suhbat topilmadi">
      <PillButton size="sm" variant="soft" to="/chat" class="mt-2">Inboxga qaytish</PillButton>
    </EmptyState>
  </template>
</template>
