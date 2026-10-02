<script setup lang="ts">
const route = useRoute()
const { selection } = useTelegram()

const items = [
  { to: '/', label: 'Asosiy', icon: 'home' },
  { to: '/ombor', label: 'Ombor', icon: 'box' },
  { to: '/sotish', label: 'Sotish', icon: 'cart', center: true },
  { to: '/tarix', label: 'Tarix', icon: 'history' },
  { to: '/profil', label: 'Profil', icon: 'user' },
] as const

const active = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <nav aria-label="Asosiy menyu" class="pb-safe shrink-0 bg-card shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
    <div class="grid h-[72px] grid-cols-5 items-center px-2">
      <NuxtLink
        v-for="it in items" :key="it.to" :to="it.to"
        class="flex flex-col items-center gap-1 text-[11px] font-bold"
        :class="active(it.to) ? 'text-brand' : 'text-muted'"
        @click="selection()"
      >
        <span
          v-if="'center' in it"
          class="-mt-7 flex size-14 items-center justify-center rounded-full border-4 border-card bg-brand text-white shadow-float"
        >
          <AppIcon :name="it.icon" :size="24" />
        </span>
        <span v-else class="flex h-8 w-12 items-center justify-center rounded-full" :class="active(it.to) && 'bg-soft'">
          <AppIcon :name="it.icon" :size="22" />
        </span>
        {{ it.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
