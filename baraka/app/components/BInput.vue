<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// Kulrang input: label, xato matni, ikonka va suffix bilan. textarea uchun `multiline`.
defineProps<{
  label?: string
  placeholder?: string
  error?: string | false
  hint?: string
  icon?: IconName
  suffix?: string
  type?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email'
  multiline?: boolean
  readonly?: boolean
  maxlength?: number
}>()
const model = defineModel<string | number>({ default: '' })
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-[13px] font-bold text-muted-2">{{ label }}</span>
    <span
      class="flex items-center gap-2 rounded-2xl border-2 bg-field px-4 transition-colors focus-within:border-brand focus-within:bg-card"
      :class="[error ? 'border-danger' : 'border-transparent', multiline ? 'py-3' : 'h-[50px]']"
    >
      <AppIcon v-if="icon" :name="icon" :size="18" class="shrink-0 text-muted" />
      <textarea
        v-if="multiline" v-model="model" :placeholder="placeholder" :readonly="readonly" :maxlength="maxlength" rows="3"
        class="min-w-0 grow resize-none bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted"
      />
      <input
        v-else v-model="model" :type="type ?? 'text'" :inputmode="inputmode" :placeholder="placeholder" :readonly="readonly" :maxlength="maxlength"
        class="min-w-0 grow bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted"
      >
      <span v-if="suffix" class="shrink-0 text-sm font-bold text-muted">{{ suffix }}</span>
      <slot name="end" />
    </span>
    <span v-if="error" class="text-xs font-semibold text-danger">{{ error }}</span>
    <span v-else-if="hint" class="text-xs font-medium text-muted">{{ hint }}</span>
  </label>
</template>
