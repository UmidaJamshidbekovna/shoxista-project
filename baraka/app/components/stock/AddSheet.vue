<script setup lang="ts">
// "Mahsulot qo'shish" sheet (Stock and History.md §7): Skaner / AI yordamchi / Tashkilotdan buyurtma
import type { IconName } from '~/components/AppIcon.vue'

const open = defineModel<boolean>({ default: false })
const { selection } = useTelegram()

const VARIANTS: { title: string, text: string, icon: IconName, bg: string, color: string, to: string }[] = [
  { title: 'Skaner', text: 'Shtrix-kod orqali tez qo\'shish', icon: 'barcode', bg: '#e6efe9', color: '#05472a', to: '/ombor/kirim?tab=scan' },
  { title: 'AI yordamchi', text: 'Nakladnoy yoki mahsulot rasmidan avtomatik aniqlaydi', icon: 'sparkle', bg: '#05472a', color: '#ffffff', to: '/ombor/kirim?tab=ai' },
  { title: 'Tashkilotdan buyurtma', text: 'Ilova orqali ta\'minotchidan onlayn buyurtma', icon: 'truck', bg: '#fbefdc', color: '#9a5b0b', to: '/taminotchilar' },
]

function go(to: string) {
  selection()
  open.value = false
  navigateTo(to)
}
</script>

<template>
  <BSheet v-model="open" title="Mahsulot qo'shish" tone="card">
    <div class="flex flex-col gap-2.5 pb-2">
      <button
        v-for="v in VARIANTS" :key="v.title" type="button"
        class="flex items-center gap-3.5 rounded-[20px] bg-[#f6f7f9] p-3.5 text-left transition-transform active:scale-[0.985]"
        @click="go(v.to)"
      >
        <span class="flex size-[50px] shrink-0 items-center justify-center rounded-2xl" :style="{ background: v.bg, color: v.color }">
          <AppIcon :name="v.icon" :size="22" :stroke="1.9" />
        </span>
        <span class="min-w-0 grow">
          <span class="block text-[15px] font-extrabold text-ink">{{ v.title }}</span>
          <span class="mt-0.5 block text-[12.5px] leading-snug text-muted">{{ v.text }}</span>
        </span>
      </button>
    </div>
  </BSheet>
</template>
