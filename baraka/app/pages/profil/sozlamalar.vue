<script setup lang="ts">
const { settings } = useStore()
const { selection } = useTelegram()

const THEMES = [
  { value: 'light', label: 'Yorug\'', bg: '#f4f6f9', card: '#ffffff', ink: '#121212' },
  { value: 'dark', label: 'Qorong\'i', bg: '#12211a', card: '#1d2f26', ink: '#e8efe9' },
  { value: 'system', label: 'Tizim', bg: 'linear-gradient(135deg, #f4f6f9 50%, #12211a 50%)', card: '#9aa6a0', ink: '#4a5a52' },
] as const
const LANGS = [
  { value: 'uz', label: 'O\'zbekcha', sub: 'Lotin yozuvi', flag: 'UZ' },
  { value: 'en', label: 'English', sub: 'Beta', flag: 'EN' },
] as const

// Tanlov saqlanadi; qorong'i mavzu klassi ixtiyoriy ravishda <html> ga qo'yiladi
watch(() => settings.value.theme, (t) => {
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  try { localStorage.setItem('baraka:theme', t) } catch {}
})
</script>

<template>
  <PageHeader title="Ilova sozlamalari" back="/profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <SectionHead title="Mavzu" />
    <div class="grid grid-cols-3 gap-2.5">
      <button
        v-for="t in THEMES" :key="t.value" type="button"
        class="card flex flex-col items-center gap-2 border-2 p-2.5 transition-colors"
        :class="settings.theme === t.value ? 'border-brand' : 'border-transparent'"
        @click="settings.theme = t.value; selection()"
      >
        <span class="flex h-16 w-full flex-col justify-end gap-1 overflow-hidden rounded-xl p-2" :style="{ background: t.bg }">
          <span class="h-2 w-3/4 rounded-full" :style="{ background: t.card }" />
          <span class="h-2 w-1/2 rounded-full" :style="{ background: t.card }" />
        </span>
        <span class="flex items-center gap-1 text-[13px] font-extrabold" :class="settings.theme === t.value ? 'text-brand' : 'text-ink'">
          <AppIcon v-if="settings.theme === t.value" name="check" :size="14" :stroke="3" />{{ t.label }}
        </span>
      </button>
    </div>

    <SectionHead title="Til" class="mt-1" />
    <div class="card px-4 py-1">
      <button
        v-for="l in LANGS" :key="l.value" type="button"
        class="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
        @click="settings.lang = l.value; selection()"
      >
        <span class="flex size-10 items-center justify-center rounded-full bg-soft text-[13px] font-extrabold text-brand">{{ l.flag }}</span>
        <span class="grow">
          <span class="block text-[15px] font-bold">{{ l.label }}</span>
          <span class="block text-xs font-medium text-muted">{{ l.sub }}</span>
        </span>
        <span class="flex size-5 items-center justify-center rounded-full border-2" :class="settings.lang === l.value ? 'border-brand bg-brand' : 'border-[#cfd5dc]'">
          <span v-if="settings.lang === l.value" class="size-2 rounded-full bg-white" />
        </span>
      </button>
    </div>

    <SectionHead title="Bildirishnomalar" class="mt-1" />
    <div class="card px-4 py-0.5">
      <ProfSettingRow v-model="settings.notifications.orders" icon="cart" title="Yangi buyurtmalar" desc="Telegram, Instagram va ilovadan kelgan buyurtmalar" />
      <ProfSettingRow v-model="settings.notifications.lowStock" icon="box" title="Kam qolgan mahsulotlar" desc="Qoldiq minimal darajadan tushganda" />
      <ProfSettingRow v-model="settings.notifications.debts" icon="wallet" title="Qarz muddatlari" desc="To'lov muddati yaqinlashganda eslatma" />
      <ProfSettingRow v-model="settings.notifications.chat" icon="chat" title="Chat xabarlari" desc="Mijoz va ta'minotchilardan yangi xabarlar" />
    </div>
  </div>
</template>
