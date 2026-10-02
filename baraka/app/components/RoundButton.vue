<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// 46px dumaloq oq ikonka tugma (yoki havola), ixtiyoriy badge bilan
const props = withDefaults(defineProps<{
  icon: IconName
  label: string
  to?: string
  badge?: number | string
  variant?: 'white' | 'field' | 'brand'
  size?: number
}>(), { variant: 'white', size: 46 })
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : 'button'" :aria-label="label"
    class="relative flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
    :class="{
      'bg-card text-ink shadow-card': variant === 'white',
      'bg-field text-ink': variant === 'field',
      'bg-brand text-white': variant === 'brand',
    }"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <AppIcon :name="icon" />
    <span
      v-if="badge"
      class="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-danger px-1 text-[10px] font-extrabold text-white"
    >{{ badge }}</span>
  </component>
</template>
