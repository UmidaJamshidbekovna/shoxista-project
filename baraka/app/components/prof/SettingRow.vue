<script setup lang="ts">
import type { IconName } from '../AppIcon.vue'

// Sozlama qatori: ikonka, sarlavha, izoh va o'ngda Toggle
defineProps<{ icon?: IconName, title: string, desc?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
    <span v-if="icon" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="icon" /></span>
    <div class="min-w-0 grow">
      <p class="text-[15px] font-bold text-ink">{{ title }}</p>
      <p v-if="desc" class="text-xs leading-snug font-medium text-muted">{{ desc }}</p>
    </div>
    <Toggle v-model="model" :label="title" />
  </div>
</template>
