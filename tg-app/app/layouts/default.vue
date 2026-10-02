<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <!-- Telefon kengligidagi konteyner: desktopda markazda turadi -->
  <div class="pt-safe relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-bg">
    <main class="relative flex min-h-0 grow flex-col">
      <slot />
    </main>
    <BottomNav v-if="route.meta.tab" />
  </div>
</template>
