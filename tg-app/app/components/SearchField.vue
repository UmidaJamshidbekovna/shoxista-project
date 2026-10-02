<script setup lang="ts">
defineProps<{ placeholder?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="flex h-[52px] grow items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 text-muted">
    <AppIcon name="search" />
    <span class="sr-only">Qidirish</span>
    <input
      v-model="model" type="search" :placeholder="placeholder"
      class="min-w-0 grow border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
    >
  </label>
</template>
