<script setup lang="ts">
// Rangli harf-plitka (mahsulot/mijoz avatari)
withDefaults(defineProps<{ text: string, bg: string, fg: string, size?: number, radius?: number, fontSize?: number }>(), {
  size: 44, radius: 12, fontSize: 17,
})
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center font-display font-bold"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: `${radius}px`, background: bg, color: fg, fontSize: `${fontSize}px` }"
  >{{ text }}</span>
</template>
