<script setup lang="ts">
// Gorizontal aylanadigan filtr chiplari. `multiple` bo'lsa v-model massiv bo'ladi.
const props = defineProps<{ options: readonly (string | { value: string, label: string })[], multiple?: boolean }>()
const model = defineModel<string | string[]>()
const { selection } = useTelegram()
const opts = computed(() => props.options.map(o => typeof o === 'string' ? { value: o, label: o } : o))

const isOn = (v: string) => Array.isArray(model.value) ? model.value.includes(v) : model.value === v
function toggle(v: string) {
  selection()
  if (!props.multiple) return (model.value = v)
  const arr = Array.isArray(model.value) ? model.value : []
  model.value = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}
</script>

<template>
  <div class="no-scrollbar -mx-5 flex shrink-0 gap-2 overflow-x-auto px-5">
    <button
      v-for="o in opts" :key="o.value" type="button"
      class="h-9 shrink-0 rounded-full px-4 text-[13px] font-bold whitespace-nowrap transition-colors"
      :class="isOn(o.value) ? 'bg-brand text-white' : 'bg-card text-muted-2 shadow-card'"
      @click="toggle(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
