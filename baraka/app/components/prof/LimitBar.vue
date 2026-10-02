<script setup lang="ts">
// Tarif limiti chizig'i: "4/10 xodim"
const props = defineProps<{ label: string, used: number, limit: number, dark?: boolean }>()
const pct = computed(() => profUnlimited(props.limit) ? Math.min(100, props.used) / 10 : Math.min(100, (props.used / props.limit) * 100))
const full = computed(() => !profUnlimited(props.limit) && props.used >= props.limit)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between text-xs font-bold" :class="dark ? 'text-white/80' : 'text-muted-2'">
      <span>{{ label }}</span>
      <span :class="full && (dark ? 'text-[#ffd59a]' : 'text-warn')">{{ formatSom(used) }} / {{ profLimitText(limit) }}</span>
    </div>
    <div class="h-1.5 overflow-hidden rounded-full" :class="dark ? 'bg-white/15' : 'bg-field'">
      <div
        class="h-full rounded-full transition-all"
        :class="full ? (dark ? 'bg-[#ffd59a]' : 'bg-warn') : (dark ? 'bg-white' : 'bg-brand')"
        :style="{ width: `${Math.max(3, pct)}%` }"
      />
    </div>
  </div>
</template>
