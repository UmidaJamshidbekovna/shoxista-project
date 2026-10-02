<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

definePageMeta({ tab: true })

const { user, selection } = useTelegram()

// Telegram foydalanuvchisi bo'lsa — uning ismi va rasmi
const fullName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : ''
const avatarLetter = (user?.first_name?.[0] ?? 'D').toUpperCase()
const subtitle = fullName ? `${fullName} · Egasi · 2 filial · 4 xodim` : 'Egasi · 2 filial · 4 xodim'

type Item = { icon: IconName, title: string, sub: string, to?: string, badge?: number, badgeClass?: string }
const groups: { title: string, items: Item[] }[] = [
  {
    title: 'Ish',
    items: [
      { icon: 'chart', title: 'Hisobot', sub: 'Tushum, foyda, top mahsulotlar', to: '/hisobot' },
      { icon: 'history', title: 'Tarix', sub: 'Sotuvlar, kirimlar, qaytarishlar', to: '/tarix' },
      { icon: 'message', title: 'Xabarlar', sub: 'Firmalar va mijozlar bilan chat', to: '/xabarlar', badge: 3, badgeClass: 'bg-brand' },
      { icon: 'globe', title: "Onlayn do'kon", sub: 'Mijoz ilovasi va buyurtmalar', to: '/onlayn', badge: 2, badgeClass: 'bg-info' },
    ],
  },
  {
    title: 'Biznes',
    items: [
      { icon: 'store', title: "Biznes ma'lumotlari", sub: 'Nomi, STIR, manzil, chek shabloni' },
      { icon: 'building', title: 'Filiallar', sub: 'Chilonzor, Yunusobod' },
      { icon: 'key', title: 'Xodimlar va huquqlar', sub: '4 xodim · Kassir, Omborchi, Admin' },
      { icon: 'crown', title: 'Obuna (tarif)', sub: "Biznes · keyingi to'lov 31.10.2026" },
      { icon: 'bell', title: 'Bildirishnomalar', sub: 'Kam qoldiq, qarz muddati, buyurtmalar' },
    ],
  },
]

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <ScreenHeader title="Menyu">
    <IconButton icon="bell" label="Bildirishnomalar" :badge="5" @click="selection()" />
  </ScreenHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-2.5 overflow-y-auto px-5 pb-5">
    <div class="flex items-center gap-3.5 rounded-[20px] bg-ink p-4 text-white">
      <img v-if="user?.photo_url" :src="user.photo_url" alt="" class="size-12 shrink-0 rounded-[14px] object-cover">
      <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-surface font-display text-xl font-bold text-ink">{{ avatarLetter }}</span>
      <div class="min-w-0 grow">
        <div class="font-display text-lg font-bold">[DO'KON NOMI]</div>
        <div class="truncate text-[13px] opacity-85">{{ subtitle }}</div>
      </div>
      <span class="flex shrink-0 flex-col items-end gap-0.5">
        <span class="flex h-6 items-center gap-1 rounded-md bg-brand px-2 text-xs font-bold text-white">
          <AppIcon name="crown" :size="13" />Biznes
        </span>
        <span class="text-[11px] opacity-80">31.10.2026 gacha</span>
      </span>
    </div>

    <template v-for="g in groups" :key="g.title">
      <SectionTitle>{{ g.title }}</SectionTitle>
      <div class="rounded-[18px] border border-line bg-surface px-3.5">
        <component
          :is="it.to ? NuxtLink : 'button'"
          v-for="it in g.items" :key="it.title"
          :to="it.to" :type="it.to ? undefined : 'button'"
          class="flex w-full items-center gap-3 border-b border-line py-[11px] text-left text-ink last:border-b-0"
          @click="selection()"
        >
          <span class="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-chip">
            <AppIcon :name="it.icon" :size="19" />
          </span>
          <span class="min-w-0 grow">
            <span class="block text-[15px] font-semibold">{{ it.title }}</span>
            <span class="mt-px block text-xs text-muted">{{ it.sub }}</span>
          </span>
          <span
            v-if="it.badge"
            class="flex h-5 min-w-5 items-center justify-center rounded-[10px] px-1.5 text-[11px] font-bold text-white"
            :class="it.badgeClass"
          >{{ it.badge }}</span>
          <span class="flex text-muted"><AppIcon name="chevron-right" :size="18" /></span>
        </component>
      </div>
    </template>
  </div>
</template>
