<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// 46px dumaloq oq ikonka tugma (yoki havola), ixtiyoriy badge yoki qizil nuqta bilan
const props = withDefaults(defineProps<{
  icon: IconName
  label: string
  to?: string
  badge?: number | string
  /** Raqamsiz ogohlantirish nuqtasi (masalan o'qilmagan bildirishnoma) */
  dot?: boolean
  badgeTone?: 'danger' | 'brand'
  variant?: 'white' | 'field' | 'brand'
  size?: number
  /** Ikonka chizig'i qalinligi (Home Icons.md: header 1.8) */
  stroke?: number
}>(), { variant: 'white', size: 46, badgeTone: 'danger' })
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
    <AppIcon :name="icon" :stroke="stroke ?? 2" />
    <span
      v-if="badge"
      class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-app px-1 text-[11px] font-extrabold text-white"
      :class="badgeTone === 'brand' ? 'bg-brand' : 'bg-danger'"
    >{{ badge }}</span>
    <span
      v-else-if="dot"
      class="absolute top-[11px] right-[12px] size-2 rounded-full border-2 border-card bg-[#e5484d]"
    />
  </component>
</template>
