<script setup lang="ts">
// Ijtimoiy tarmoqlar ro'yxati (Profile.md §7)
import type { IconName } from '~/components/AppIcon.vue'

const { socials } = useStore()

const rows = computed<{ id: 'telegram' | 'instagram', name: string, icon: IconName, c: string, bg: string, on: boolean, handle: string }[]>(() => [
  { id: 'telegram', name: 'Telegram', icon: 'send', c: '#229ed9', bg: '#e6f5fc', on: socials.value.telegram.connected, handle: socials.value.telegram.botUsername },
  { id: 'instagram', name: 'Instagram', icon: 'instagram', c: '#d6246e', bg: '#fdeaf2', on: socials.value.instagram.connected, handle: socials.value.instagram.account },
])
</script>

<template>
  <ProfPage>
    <ProfHeader title="Ijtimoiy tarmoqlar" />

    <ProfCard class="px-[14px] py-1">
      <NuxtLink
        v-for="r in rows" :key="r.id" :to="`/profil/ijtimoiy/${r.id}`"
        class="flex items-center gap-3 border-b border-[#f0f1f4] py-3 last:border-b-0 active:opacity-70"
      >
        <span class="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]" :style="{ background: r.bg, color: r.c }">
          <AppIcon :name="r.icon" :size="20" :stroke="1.9" />
        </span>
        <span class="min-w-0 grow">
          <span class="block text-[15px] font-extrabold text-ink">{{ r.name }}</span>
          <span class="block truncate text-[12px] text-muted">{{ r.on && r.handle ? r.handle : 'Ulanmagan' }}</span>
        </span>
        <ProfSocialTag :on="r.on" />
        <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#a3a8b0]" />
      </NuxtLink>
    </ProfCard>

    <p class="px-1 text-[12px] leading-relaxed text-muted">
      Hisob ulangach e'lonlar shu tarmoqqa bir bosishda joylanadi, kelgan mijozlar manbasi avtomatik yoziladi.
    </p>
  </ProfPage>
</template>
