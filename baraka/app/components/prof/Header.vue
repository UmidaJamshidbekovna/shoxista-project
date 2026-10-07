<script setup lang="ts">
// Ichki sahifa header (Profile.md §0): ‹ Orqaga (44×44 oq doira, chevL 20) · sarlavha 19/800 · o'ngda amal
const props = withDefaults(defineProps<{ title?: string, size?: number, back?: string }>(), { size: 19 })
const router = useRouter()
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push(props.back ?? '/profil')
}
</script>

<template>
  <header class="flex min-h-11 items-center gap-3">
    <button
      type="button" aria-label="Orqaga"
      class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-[0_2px_10px_rgba(5,71,42,0.05)] transition-transform active:scale-95"
      @click="goBack"
    >
      <AppIcon name="chevron-left" :size="20" :stroke="2" />
    </button>
    <slot name="title">
      <h1 class="min-w-0 grow truncate leading-tight font-extrabold tracking-[-0.02em] text-ink" :style="{ fontSize: `${size}px` }">{{ title }}</h1>
    </slot>
    <slot />
  </header>
</template>
