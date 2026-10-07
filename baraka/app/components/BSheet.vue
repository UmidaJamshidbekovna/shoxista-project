<script setup lang="ts">
// Pastdan chiqadigan modal/drawer. v-model bilan ochiladi/yopiladi.
/** tone: sheet foni — ilova kulrangi (standart) yoki oq */
withDefaults(defineProps<{ title?: string, full?: boolean, tone?: 'app' | 'card' }>(), { full: false, tone: 'app' })
const open = defineModel<boolean>({ default: false })

const { tg } = useTelegram()
// Ochiq paytda Telegram "Orqaga" tugmasi sheetni yopadi
const close = () => { open.value = false }
watch(open, (v) => {
  if (!tg?.initData || !tg.BackButton) return
  if (v) tg.BackButton.onClick(close)
  else tg.BackButton.offClick?.(close)
})
onBeforeUnmount(() => { if (tg?.initData) tg.BackButton?.offClick?.(close) })
</script>

<template>
  <Teleport to="#sheet-root">
    <!-- Har bir sheet o'z qatlamida: keyin ochilgani (DOM'da keyinroq) doim ustida, pastdagisi qorayadi -->
    <div class="pointer-events-none absolute inset-0 isolate">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200">
      <div v-if="open" class="pointer-events-auto absolute inset-0 z-40 bg-black/35" @click="open = false" />
    </Transition>
    <Transition enter-from-class="translate-y-full" leave-to-class="translate-y-full" enter-active-class="transition-transform duration-300 ease-out" leave-active-class="transition-transform duration-200 ease-in">
      <div
        v-if="open"
        class="pointer-events-auto absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px]"
        :class="[full ? 'top-6' : 'max-h-[88%]', tone === 'card' ? 'bg-card' : 'bg-app']"
        role="dialog" aria-modal="true"
      >
        <div class="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-black/15" />
        <div v-if="title" class="flex shrink-0 items-center gap-3 px-5 pt-3 pb-2">
          <h2 class="grow text-[19px] font-extrabold">{{ title }}</h2>
          <RoundButton icon="x" label="Yopish" variant="field" :size="36" @click="open = false" />
        </div>
        <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pt-1 pb-4">
          <slot />
        </div>
        <div v-if="$slots.footer" class="pb-safe shrink-0 border-t border-line bg-card px-5 pt-3 pb-4">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
    </div>
  </Teleport>
</template>
