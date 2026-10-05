<script setup lang="ts">
// Suzuvchi pastki navigatsiya: oq pill (4 ta tab) + alohida yashil FAB ("Sotish").
const route = useRoute()
const { selection } = useTelegram()
const { unreadChats, unreadNotifications } = useStore()

// O'qilmagan xabar/bildirishnoma — ikkalasi ham Asosiy ekran sarlavhasidan ochiladi
const unread = computed(() => unreadChats.value + unreadNotifications.value > 0)

const tabs = computed(() => [
  { to: '/', label: 'Asosiy', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', badge: unread.value },
  { to: '/ombor', label: 'Ombor', d: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8', badge: false },
  { to: '/tarix', label: 'Tarix', d: 'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', badge: false },
  { to: '/profil', label: 'Profil', d: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', badge: false },
])

const active = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <nav
    aria-label="Asosiy menyu"
    class="bottom-float absolute left-4 right-[92px] z-20 flex h-[66px] items-center justify-between
           rounded-[33px] bg-card px-[9px] shadow-[0_10px_30px_rgba(30,45,70,0.14)]"
  >
    <NuxtLink
      v-for="t in tabs" :key="t.to" :to="t.to"
      :aria-label="t.label" :aria-current="active(t.to) ? 'page' : undefined"
      class="relative flex h-12 min-w-12 items-center justify-center gap-[7px] rounded-3xl
             text-[13.5px] font-bold transition-all duration-[250ms] hover:brightness-[0.93] active:scale-[0.94]"
      :class="active(t.to) ? 'bg-brand px-4 text-white' : 'text-brand'"
      @click="selection()"
    >
      <svg
        width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      >
        <path :d="t.d" />
      </svg>
      <span v-if="active(t.to)" class="whitespace-nowrap">{{ t.label }}</span>
      <span
        v-else-if="t.badge"
        class="absolute right-2 top-[7px] size-2 rounded-full border-2 border-card bg-[#e5484d]"
      />
    </NuxtLink>
  </nav>

  <NuxtLink
    to="/sotish" aria-label="Sotish"
    class="bottom-float absolute right-4 z-20 flex size-[66px] flex-col items-center justify-center gap-px
           rounded-full bg-brand text-white shadow-[0_10px_24px_rgba(5,71,42,0.35)]
           transition-transform active:scale-[0.95]"
    @click="selection()"
  >
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
    </svg>
    <span class="text-[10px] font-extrabold">Sotish</span>
  </NuxtLink>
</template>
