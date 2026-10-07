<script setup lang="ts">
// Toggle qatori (Profile.md §8): yorliq 14/700 + izoh 11.5px #8b9099, o'ngda switch
defineProps<{ label: string, hint?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="flex items-center gap-3 border-b border-[#f0f1f4] py-3 last:border-b-0">
    <span class="min-w-0 grow">
      <span class="block text-[14px] font-bold text-ink">{{ label }}</span>
      <span v-if="hint" class="mt-0.5 block text-[11.5px] leading-snug text-muted">{{ hint }}</span>
    </span>
    <ProfToggle v-model="model" :label="label" />
  </div>
</template>
