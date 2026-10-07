<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

// Menyu qatori (Profile.md §1.5): padding 12px 0, gap 12, chegara #f0f1f4; ikonka 40×40 r13 #e6efe9 (18px, stroke 1.8);
// yorliq 14/700, izoh 11.5px #8b9099, chevR 16px #a3a8b0
defineProps<{ icon: IconName, label: string, sub?: string, to: string }>()
</script>

<template>
  <NuxtLink :to="to" class="flex items-center gap-3 border-b border-[#f0f1f4] py-3 transition-opacity last:border-b-0 active:opacity-70">
    <span class="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-soft text-brand">
      <AppIcon :name="icon" :size="18" :stroke="1.8" />
    </span>
    <span class="min-w-0 grow">
      <span class="block truncate text-[14px] font-bold text-ink">{{ label }}</span>
      <span v-if="sub" class="mt-px block truncate text-[11.5px] text-muted">{{ sub }}</span>
    </span>
    <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#a3a8b0]" />
  </NuxtLink>
</template>
