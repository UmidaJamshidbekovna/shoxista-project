<script setup lang="ts">
// Bo'lim sarlavhasi (Profile.md §0): 12px / 700, #8b9099, UPPERCASE, letter-spacing .06em, padding 0 4px
defineProps<{ title: string }>()
</script>

<template>
  <section class="grid grid-cols-[minmax(0,1fr)] gap-2">
    <h2 class="flex items-center justify-between gap-2 px-1 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
      <span>{{ title }}</span><slot name="action" />
    </h2>
    <slot />
  </section>
</template>
