<script setup lang="ts">
import type { OrderStatus } from '~/data/types'
import { statusFlow, statusLabel } from '~/data/labels'

const props = defineProps<{ status: OrderStatus }>()
const idx = computed(() => statusFlow.indexOf(props.status))
const stopped = computed(() => idx.value < 0)
</script>

<template>
  <ol class="flex items-start" :class="stopped && 'opacity-40 grayscale'">
    <li v-for="(s, i) in statusFlow" :key="s" class="relative flex grow basis-0 flex-col items-center gap-1.5">
      <span
        v-if="i > 0"
        class="absolute top-[12.5px] h-[3px] rounded-full"
        :class="i <= idx ? 'bg-brand' : 'bg-line'"
        style="left: calc(-50% + 18px); width: calc(100% - 36px)"
      />
      <span
        class="relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-extrabold transition-colors"
        :class="i < idx ? 'bg-brand text-white' : i === idx ? 'bg-brand text-white ring-4 ring-soft' : 'bg-field text-muted'"
      >
        <AppIcon v-if="i < idx || (i === idx && s === 'delivered')" name="check" :size="15" :stroke="2.8" />
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span class="text-center text-[11px] leading-tight font-bold" :class="i <= idx ? 'text-ink' : 'text-muted'">{{ statusLabel[s] }}</span>
    </li>
  </ol>
</template>
