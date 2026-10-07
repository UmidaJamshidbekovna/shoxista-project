<script setup lang="ts">
import type { ChatThread } from '~/data/types'

// Suhbat avatari + kanal belgisi (Instagram / Telegram / Ilova)
const props = withDefaults(defineProps<{ thread: ChatThread, size?: number }>(), { size: 50 })
const { orgById } = useStore()
const color = computed(() => {
  if (props.thread.kind === 'org') return orgById(props.thread.refId)?.logoColor ?? '#05472a'
  if (props.thread.kind === 'support') return '#1d5bd8'
  return '#05472a'
})
const badge = {
  instagram: { cls: 'bg-gradient-to-br from-[#f9a825] via-[#e1306c] to-[#833ab4] text-white', icon: 'instagram' },
  telegram: { cls: 'bg-[#2aabee] text-white', icon: 'telegram' },
  app: { cls: 'bg-brand text-white', icon: 'grid' },
  offline: { cls: 'bg-muted-2 text-white', icon: 'store' },
} as const
</script>

<template>
  <span class="relative shrink-0">
    <span
      v-if="thread.kind === 'ai'"
      class="flex items-center justify-center rounded-full bg-brand"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <img src="/assets/ai-robot-head.png" alt="" class="h-auto" :style="{ width: `${Math.round(size * 0.8)}px` }">
    </span>
    <Avatar v-else-if="thread.kind === 'support'" icon="headset" :color="color" :size="size" />
    <Avatar v-else :name="thread.title" :color="color" :size="size" :square="thread.kind === 'org'" />
    <span
      v-if="thread.kind === 'customer' || thread.kind === 'org'"
      class="absolute -right-0.5 -bottom-0.5 flex size-[20px] items-center justify-center rounded-full border-2 border-card"
      :class="badge[thread.channel].cls"
    >
      <AppIcon :name="badge[thread.channel].icon" :size="11" :stroke="2.4" />
    </span>
  </span>
</template>
