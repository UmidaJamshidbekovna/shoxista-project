<script setup lang="ts">
// Input (Profile.md §0): 48px, radius 14, border 1.5px #e4e7eb, padding 0 14px, 14px; yorliq 12.5/700 #5b616b
// variant="soft" — ijtimoiy tarmoq formasi (§7): 50px, #f4f6f9, chegarasiz, radius 16
const props = withDefaults(defineProps<{
  label?: string
  placeholder?: string
  type?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
  prefix?: string
  multiline?: boolean
  rows?: number
  maxlength?: number
  /** Chegara rangi (masalan username holati) */
  border?: string
  hint?: string
  variant?: 'line' | 'soft'
}>(), { variant: 'line', rows: 4 })
const model = defineModel<string>({ default: '' })
const focused = ref(false)
const borderColor = computed(() => props.border ?? (focused.value ? '#05472a' : '#e4e7eb'))
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-[12.5px] font-bold text-[#5b616b]">{{ label }}</span>
    <span
      class="flex items-center gap-1 transition-colors duration-200"
      :class="[
        variant === 'soft' ? 'rounded-2xl bg-[#f4f6f9] px-4' : 'rounded-[14px] border-[1.5px] bg-card px-[14px]',
        multiline ? 'py-3' : variant === 'soft' ? 'h-[50px]' : 'h-12',
      ]"
      :style="variant === 'line' ? { borderColor } : undefined"
    >
      <span v-if="prefix" class="shrink-0 text-[14px] font-bold text-muted">{{ prefix }}</span>
      <textarea
        v-if="multiline" v-model="model" :placeholder="placeholder" :maxlength="maxlength" :rows="rows"
        class="min-w-0 grow resize-none bg-transparent text-[14px] leading-[1.5] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-[#a3a8b0]"
        @focus="focused = true" @blur="focused = false"
      />
      <input
        v-else v-model="model" :type="type ?? 'text'" :inputmode="inputmode" :placeholder="placeholder" :maxlength="maxlength"
        class="h-full min-w-0 grow bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-[#a3a8b0]"
        @focus="focused = true" @blur="focused = false"
      >
      <slot name="end" />
    </span>
    <slot name="below">
      <span v-if="hint" class="px-1 text-[11.5px] font-semibold text-muted">{{ hint }}</span>
    </slot>
  </label>
</template>
