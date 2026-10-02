<script setup lang="ts">
// Segment boshqaruvi (kun/hafta/oy kabi). options: string[] yoki {value,label}[]
const props = defineProps<{ options: readonly (string | { value: string, label: string })[], dark?: boolean }>()
const model = defineModel<string>()
const { selection } = useTelegram()
const opts = computed(() => props.options.map(o => typeof o === 'string' ? { value: o, label: o } : o))
</script>

<template>
  <div class="flex rounded-full p-1" :class="dark ? 'bg-white/12' : 'bg-field'">
    <button
      v-for="o in opts" :key="o.value" type="button"
      class="h-9 grow basis-0 rounded-full px-2 text-[13px] font-bold whitespace-nowrap transition-colors"
      :class="model === o.value
        ? (dark ? 'bg-white text-brand' : 'bg-card text-ink shadow-card')
        : (dark ? 'text-white/75' : 'text-muted')"
      @click="model = o.value; selection()"
    >
      {{ o.label }}
    </button>
  </div>
</template>
