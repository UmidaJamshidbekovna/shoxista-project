<script setup lang="ts">
// Haqiqiy, skanerlanadigan QR kod (SVG). Matn 78 baytdan oshsa — xabar ko'rsatiladi.
const props = withDefaults(defineProps<{ value: string, size?: number, color?: string }>(), { size: 200, color: '#12211a' })
const matrix = computed(() => encodeQr(props.value))
const quiet = 4
const path = computed(() => {
  const m = matrix.value
  if (!m) return ''
  let d = ''
  m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + quiet} ${y + quiet}h1v1h-1z` }))
  return d
})
const dim = computed(() => (matrix.value?.length ?? 21) + quiet * 2)
</script>

<template>
  <svg
    v-if="matrix" :width="size" :height="size" :viewBox="`0 0 ${dim} ${dim}`" shape-rendering="crispEdges"
    role="img" :aria-label="`QR kod: ${value}`" class="block"
  >
    <rect :width="dim" :height="dim" fill="#fff" />
    <path :d="path" :fill="color" />
  </svg>
  <div v-else class="flex items-center justify-center rounded-2xl bg-field text-center text-xs font-semibold text-muted" :style="{ width: `${size}px`, height: `${size}px` }">
    Havola juda uzun
  </div>
</template>
