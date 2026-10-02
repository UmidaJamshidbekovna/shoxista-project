<script setup lang="ts">
const route = useRoute()
const { toasts } = useToast()
</script>

<template>
  <!-- Telefon kadri: mobil qurilmada to'liq ekran, desktopda 390px markazda -->
  <div class="flex min-h-dvh justify-center bg-outer sm:items-center sm:py-6">
    <div
      class="pt-safe bg-app-glow relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden
             sm:h-[844px] sm:max-h-[calc(100dvh-48px)] sm:w-[390px] sm:rounded-[52px] sm:shadow-[0_30px_80px_rgba(18,33,26,0.25)]"
    >
      <main class="relative flex min-h-0 grow flex-col">
        <slot />
      </main>
      <BottomNav v-if="route.meta.tab" />

      <!-- Modal/drawer'lar shu yerga teleport qilinadi (telefon kadri ichida qoladi) -->
      <div id="sheet-root" class="pointer-events-none absolute inset-0 z-40" />

      <div class="pointer-events-none absolute inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-5">
        <TransitionGroup enter-from-class="-translate-y-3 opacity-0" leave-to-class="opacity-0" enter-active-class="transition duration-200" leave-active-class="transition duration-200">
          <div
            v-for="t in toasts" :key="t.id"
            class="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-white shadow-float"
            :class="t.tone === 'error' ? 'bg-danger' : t.tone === 'info' ? 'bg-ink' : 'bg-brand'"
          >
            <AppIcon :name="t.tone === 'error' ? 'alert' : t.tone === 'info' ? 'info' : 'check'" :size="16" />{{ t.text }}
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>
