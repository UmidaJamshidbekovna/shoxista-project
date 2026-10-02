<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

withDefaults(defineProps<{ icon?: IconName, title: string, text?: string }>(), { icon: 'search' })
</script>

<template>
  <div class="flex flex-col items-center gap-2 px-6 py-10 text-center">
    <span class="flex size-14 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="icon" :size="26" /></span>
    <p class="text-[15px] font-extrabold">{{ title }}</p>
    <p v-if="text" class="text-[13px] font-medium text-muted">{{ text }}</p>
    <slot />
  </div>
</template>
