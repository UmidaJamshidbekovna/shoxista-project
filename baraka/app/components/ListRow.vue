<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// Menyu qatori: ikonka, sarlavha, izoh, o'ng tomonda qiymat/chevron. `to` bo'lsa havola.
defineProps<{ icon?: IconName, title: string, subtitle?: string, value?: string, to?: string, danger?: boolean, chevron?: boolean }>()
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : 'button'"
    class="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
  >
    <span v-if="icon" class="flex size-10 shrink-0 items-center justify-center rounded-full" :class="danger ? 'bg-danger-soft text-danger' : 'bg-soft text-brand'">
      <AppIcon :name="icon" />
    </span>
    <slot name="start" />
    <span class="min-w-0 grow">
      <span class="block truncate text-[15px] font-bold" :class="danger ? 'text-danger' : 'text-ink'">{{ title }}</span>
      <span v-if="subtitle" class="block truncate text-xs font-medium text-muted">{{ subtitle }}</span>
    </span>
    <span v-if="value" class="shrink-0 text-[13px] font-bold text-muted-2">{{ value }}</span>
    <slot name="end" />
    <AppIcon v-if="chevron ?? !!to" name="chevron-right" :size="18" class="shrink-0 text-muted" />
  </component>
</template>
