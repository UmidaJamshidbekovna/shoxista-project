<script setup lang="ts">
// Switch (Profile.md §0): 46×28, radius 14; yoqilgan #05472a, o'chiq #dde1e6; tugmacha 22×22, left 21/3, transition .2s
const model = defineModel<boolean>({ default: false })
defineProps<{ label?: string }>()
const { selection } = useTelegram()
function flip() {
  model.value = !model.value
  selection()
}
</script>

<template>
  <button
    type="button" role="switch" :aria-checked="model" :aria-label="label"
    class="relative h-7 w-[46px] shrink-0 rounded-[14px] transition-colors duration-200"
    :class="model ? 'bg-brand' : 'bg-[#dde1e6]'"
    @click.stop="flip"
  >
    <span
      class="absolute top-[3px] size-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200"
      :style="{ left: model ? '21px' : '3px' }"
    />
  </button>
</template>
