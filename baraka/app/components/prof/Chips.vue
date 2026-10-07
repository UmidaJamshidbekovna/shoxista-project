<script setup lang="ts">
// Chip (Profile.md §0): 36px, padding 0 14px, radius 18, border 1.5px, 13/700; aktiv #05472a/oq, noaktiv oq/#e4e7eb
const props = defineProps<{ options: readonly { value: string, label: string }[], multiple?: boolean }>()
const model = defineModel<string | string[]>()
const { selection } = useTelegram()
const on = (v: string) => Array.isArray(model.value) ? model.value.includes(v) : model.value === v
function toggle(v: string) {
  selection()
  if (!props.multiple) {
    model.value = v
    return
  }
  const arr = Array.isArray(model.value) ? model.value : []
  model.value = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="o in props.options" :key="o.value" type="button" :aria-pressed="on(o.value)"
      class="h-9 rounded-[18px] border-[1.5px] px-[14px] text-[13px] font-bold whitespace-nowrap transition-colors duration-200"
      :class="on(o.value) ? 'border-brand bg-brand text-white' : 'border-[#e4e7eb] bg-card text-ink'"
      @click="toggle(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
