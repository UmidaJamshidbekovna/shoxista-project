<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// 44x44 oq kvadrat tugma (yoki havola), ixtiyoriy qizil badge bilan
const props = defineProps<{ icon: IconName, label: string, to?: string, badge?: number | string, dark?: boolean, size?: number }>()
const s = computed(() => props.size ?? 44)
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to" :type="to ? undefined : 'button'" :aria-label="label"
    class="relative flex shrink-0 items-center justify-center"
    :class="dark ? 'rounded-2xl border-0 bg-ink text-white' : 'rounded-[14px] border border-line bg-surface text-ink'"
    :style="{ width: `${s}px`, height: `${s}px` }"
  >
    <AppIcon :name="icon" />
    <span
      v-if="badge"
      class="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-lg bg-danger px-1 text-[10px] font-bold text-white"
    >{{ badge }}</span>
  </component>
</template>
