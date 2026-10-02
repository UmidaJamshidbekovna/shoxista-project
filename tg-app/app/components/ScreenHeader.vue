<script setup lang="ts">
// Ekran sarlavhasi: ixtiyoriy "orqaga" tugmasi, sarlavha, izoh va o'ng tomondagi amallar (slot)
const props = defineProps<{ title: string, subtitle?: string, back?: string | boolean }>()
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else router.back()
}
</script>

<template>
  <header class="flex shrink-0 items-center gap-3 px-5 pt-[18px] pb-3">
    <button
      v-if="back" type="button" aria-label="Orqaga"
      class="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface text-ink"
      @click="goBack"
    >
      <AppIcon name="chevron-left" />
    </button>
    <div class="min-w-0 grow">
      <h1 class="m-0 truncate font-display text-[26px] leading-[1.1] font-bold">{{ title }}</h1>
      <div v-if="subtitle" class="mt-0.5 text-[13px] text-muted">{{ subtitle }}</div>
    </div>
    <slot />
  </header>
</template>
