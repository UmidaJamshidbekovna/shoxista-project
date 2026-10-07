<script setup lang="ts">
// Profil sahifalari scroll konteyneri (Profile.md §0): padding 16/20/40 (tabda pastdan 124px), grid gap 16
defineProps<{ tab?: boolean }>()
</script>

<template>
  <div
    class="no-scrollbar grid min-h-0 grow auto-rows-min content-start grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto px-5 pt-4"
    :class="tab ? 'pb-[124px]' : 'pb-10'"
  >
    <slot />
  </div>
</template>
