<script setup lang="ts">
import type { IconName } from '../AppIcon.vue'

// BInput uslubidagi tanlov maydoni (native select)
defineProps<{ label?: string, options: readonly { value: string, label: string }[], placeholder?: string, error?: string | false, icon?: IconName }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-[13px] font-bold text-muted-2">{{ label }}</span>
    <span
      class="relative flex h-[50px] items-center gap-2 rounded-2xl border-2 bg-field px-4 transition-colors focus-within:border-brand focus-within:bg-card"
      :class="error ? 'border-danger' : 'border-transparent'"
    >
      <AppIcon v-if="icon" :name="icon" :size="18" class="shrink-0 text-muted" />
      <select v-model="model" class="min-w-0 grow appearance-none bg-transparent pr-6 text-[15px] font-semibold outline-none" :class="model ? 'text-ink' : 'text-muted'">
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <AppIcon name="chevron-down" :size="18" class="pointer-events-none absolute right-4 text-muted" />
    </span>
    <span v-if="error" class="text-xs font-semibold text-danger">{{ error }}</span>
  </label>
</template>
