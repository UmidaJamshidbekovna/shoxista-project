<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

// 44×44 dumaloq amal tugmasi: white (oq/#05472a), brand (#05472a/oq), danger (#fdecec/#d93036), field (#f1f3f6)
withDefaults(defineProps<{ icon: IconName, label: string, tone?: 'white' | 'brand' | 'danger' | 'field', size?: number, iconSize?: number }>(), {
  tone: 'white', size: 44, iconSize: 20,
})
</script>

<template>
  <button
    type="button" :aria-label="label"
    class="flex shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-200 active:scale-95"
    :class="{
      'bg-card text-brand shadow-[0_2px_10px_rgba(5,71,42,0.05)]': tone === 'white',
      'bg-brand text-white': tone === 'brand',
      'bg-[#fdecec] text-[#d93036]': tone === 'danger',
      'bg-field text-ink': tone === 'field',
    }"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <AppIcon :name="icon" :size="iconSize" :stroke="iconSize <= 15 ? 2.2 : 2" />
  </button>
</template>
