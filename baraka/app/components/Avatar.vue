<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// Dumaloq avatar: rasm, bosh harflar yoki ikonka
const props = withDefaults(defineProps<{ name?: string, src?: string, icon?: IconName, color?: string, size?: number, square?: boolean }>(), {
  size: 44, color: '#05472a',
})
const initials = computed(() => (props.name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase())
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center overflow-hidden font-extrabold"
    :class="square ? 'rounded-2xl' : 'rounded-full'"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.36)}px`, background: `${color}1a`, color }"
  >
    <img v-if="src" :src="src" alt="" class="size-full object-cover">
    <AppIcon v-else-if="icon" :name="icon" :size="Math.round(size * 0.48)" />
    <template v-else>{{ initials }}</template>
  </span>
</template>
