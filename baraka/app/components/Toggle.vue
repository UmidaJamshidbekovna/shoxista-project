<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
defineProps<{ label?: string }>()
const { selection } = useTelegram()
</script>

<template>
  <button
    type="button" role="switch" :aria-checked="model" :aria-label="label"
    class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
    :class="model ? 'bg-brand' : 'bg-[#d5dae1]'"
    @click="model = !model; selection()"
  >
    <span class="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform" :class="model && 'translate-x-5'" />
  </button>
</template>
