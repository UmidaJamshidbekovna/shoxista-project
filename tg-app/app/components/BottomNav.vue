<script setup lang="ts">
const route = useRoute()
const { selection } = useTelegram()

const items = [
  { to: '/', label: 'Kassa', icon: 'cart' },
  { to: '/ombor', label: 'Ombor', icon: 'box' },
  { to: '/ai-kirim', label: 'AI Kirim', icon: 'sparkle', center: true },
  { to: '/kontaktlar', label: 'Kontaktlar', icon: 'users' },
  { to: '/profil', label: 'Menyu', icon: 'grid' },
] as const
</script>

<template>
  <nav aria-label="Asosiy menyu" class="pb-safe shrink-0 border-t border-line bg-surface">
    <div class="grid h-[76px] grid-cols-5 items-end px-2 pt-2 pb-3.5">
      <NuxtLink
        v-for="it in items" :key="it.to" :to="it.to"
        class="flex flex-col items-center gap-1 text-[11px]"
        :class="[
          'center' in it ? 'font-semibold text-ink'
          : route.path === it.to ? 'min-h-12 justify-center font-bold text-brand' : 'min-h-12 justify-center font-medium text-muted',
        ]"
        @click="selection()"
      >
        <span
          v-if="'center' in it"
          class="-mt-[22px] flex size-[52px] items-center justify-center rounded-[18px] border-4 border-surface bg-brand text-white"
        >
          <AppIcon :name="it.icon" :size="24" />
        </span>
        <AppIcon v-else :name="it.icon" :size="22" />
        {{ it.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
