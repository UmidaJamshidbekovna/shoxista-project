<script setup lang="ts">
// Gorizontal aylanadigan filtr chiplari (qora = tanlangan)
defineProps<{ options: readonly string[] }>()
const model = defineModel<string>()
const { selection } = useTelegram()
</script>

<template>
  <div class="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-5">
    <button
      v-for="o in options" :key="o" type="button"
      class="h-9 shrink-0 rounded-[18px] border px-3.5 text-sm font-semibold"
      :class="model === o ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink'"
      @click="model = o; selection()"
    >
      {{ o }}
    </button>
  </div>
</template>
