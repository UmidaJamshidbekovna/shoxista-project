<script setup lang="ts">
// Kichik holat yorlig'i: "Kam qoldi", "Tugagan", "Qarzi: ..." va h.k.
const props = withDefaults(defineProps<{ tone?: 'brand' | 'warn' | 'danger' | 'info' | 'neutral' }>(), { tone: 'neutral' })
const tones = {
  brand: 'text-brand bg-brand-soft',
  warn: 'text-warn bg-warn-soft',
  danger: 'text-danger bg-danger-soft',
  info: 'text-info bg-info-soft',
  neutral: 'text-muted bg-track',
}
</script>

<template>
  <span class="inline-flex h-[22px] items-center rounded-md px-2 text-xs font-semibold whitespace-nowrap" :class="tones[props.tone]">
    <slot />
  </span>
</template>
