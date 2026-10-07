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

      <!-- Toast (Profile.md §0): tepada markazda, #05472a pill, oq 13px/700, yashil ✓ #4ade80, pop .25s -->
      <div class="pointer-events-none absolute inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-5">
        <TransitionGroup enter-active-class="toast-pop" leave-to-class="opacity-0" leave-active-class="transition-opacity duration-200">
          <div
            v-for="t in toasts" :key="t.id" role="status"
            class="flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-white shadow-float"
            :class="t.tone === 'error' ? 'bg-[#d93036]' : t.tone === 'info' ? 'bg-ink' : 'bg-brand'"
          >
            <AppIcon
              :name="t.tone === 'error' ? 'alert' : t.tone === 'info' ? 'info' : 'check'" :size="16" :stroke="2.4"
              class="shrink-0" :class="t.tone === 'success' ? 'text-[#4ade80]' : 'text-white'"
            />{{ t.text }}
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes toast-pop {
  from { opacity: 0; transform: translateY(-8px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.toast-pop { animation: toast-pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
</style>
