<script setup lang="ts">
// Holat yorlig'i
withDefaults(defineProps<{ tone?: 'brand' | 'warn' | 'danger' | 'info' | 'neutral' | 'solid' }>(), { tone: 'neutral' })
const tones = {
  brand: 'bg-soft text-brand',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-field text-muted-2',
  solid: 'bg-brand text-white',
}
</script>

<template>
  <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold whitespace-nowrap" :class="tones[tone]">
    <slot />
  </span>
</template>
