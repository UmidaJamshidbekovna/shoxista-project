<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// 54px balandlikdagi asosiy / ikkilamchi tugma
withDefaults(defineProps<{ to?: string, icon?: IconName, variant?: 'primary' | 'secondary' | 'dark' }>(), { variant: 'primary' })
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to" :type="to ? undefined : 'button'"
    class="flex h-[54px] grow basis-0 items-center justify-center gap-2 rounded-2xl transition-transform active:scale-[0.98]"
    :class="{
      'bg-brand text-base font-bold text-white': variant === 'primary',
      'bg-ink text-base font-bold text-white': variant === 'dark',
      'border border-line bg-surface text-[15px] font-semibold text-ink': variant === 'secondary',
    }"
  >
    <AppIcon v-if="icon" :name="icon" />
    <slot />
  </component>
</template>
