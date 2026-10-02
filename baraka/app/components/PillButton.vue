<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// Pill tugma: balandligi 52px, radius to'liq
withDefaults(defineProps<{
  to?: string
  icon?: IconName
  variant?: 'primary' | 'soft' | 'field' | 'outline' | 'danger'
  size?: 'md' | 'sm'
  block?: boolean
  disabled?: boolean
}>(), { variant: 'primary', size: 'md' })
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : 'button'" :disabled="disabled"
    class="flex shrink-0 items-center justify-center gap-2 rounded-full font-extrabold whitespace-nowrap transition active:scale-[0.98] disabled:opacity-45"
    :class="[
      size === 'md' ? 'h-[52px] px-6 text-[15px]' : 'h-10 px-4 text-[13px]',
      block && 'w-full',
      {
        'bg-brand text-white hover:bg-brand-hover': variant === 'primary',
        'bg-soft text-brand': variant === 'soft',
        'bg-field text-ink': variant === 'field',
        'border border-line bg-card text-ink': variant === 'outline',
        'bg-danger-soft text-danger': variant === 'danger',
      },
    ]"
  >
    <AppIcon v-if="icon" :name="icon" :size="size === 'md' ? 20 : 17" />
    <slot />
  </component>
</template>
