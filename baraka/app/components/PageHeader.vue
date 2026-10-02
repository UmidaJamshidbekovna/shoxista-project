<script setup lang="ts">
// Sahifa sarlavhasi: 25px / 800. `back` — orqaga tugmasi (true = router.back, string = shu manzil)
const props = defineProps<{ title: string, subtitle?: string, back?: string | boolean }>()
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else router.back()
}
</script>

<template>
  <header class="flex shrink-0 items-center gap-3 px-5 pt-4 pb-3">
    <RoundButton v-if="back" icon="chevron-left" label="Orqaga" @click="goBack" />
    <div class="min-w-0 grow">
      <h1 class="truncate text-[25px] leading-tight font-extrabold text-ink">{{ title }}</h1>
      <p v-if="subtitle" class="truncate text-[13px] font-medium text-muted">{{ subtitle }}</p>
    </div>
    <slot />
  </header>
</template>
