<script setup lang="ts">
// Segment (Profile.md §0): konteyner #f1f3f6, radius 22, padding 4; element 38px, radius 19, 13/700;
// aktiv #05472a / oq, noaktiv shaffof / #5b616b
const props = defineProps<{ options: readonly { value: string, label: string }[] }>()
const model = defineModel<string>()
const { selection } = useTelegram()
function pick(v: string) {
  model.value = v
  selection()
}
</script>

<template>
  <div class="flex rounded-[22px] bg-field p-1">
    <button
      v-for="o in props.options" :key="o.value" type="button" :aria-pressed="model === o.value"
      class="h-[38px] grow basis-0 rounded-[19px] px-2 text-[13px] font-bold whitespace-nowrap transition-colors duration-200"
      :class="model === o.value ? 'bg-brand text-white' : 'bg-transparent text-[#5b616b]'"
      @click="pick(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
