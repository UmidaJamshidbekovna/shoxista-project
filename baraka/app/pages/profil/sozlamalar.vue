<script setup lang="ts">
// Sozlamalar (Profile.md §8): ?mode=store — Do'kon sozlamalari, ?mode=app — Ilova sozlamalari
const route = useRoute()
const { settings } = useStore()

const mode = computed(() => route.query.mode === 'app' ? 'app' : 'store')

const currencies = [{ value: 'UZS', label: 'So\'m (UZS)' }, { value: 'USD', label: 'Dollar (USD)' }] as const
const themes = [{ value: 'day', label: 'Kun' }, { value: 'night', label: 'Tun' }, { value: 'system', label: 'Tizim' }] as const
const langs = [{ value: 'uz', label: 'O\'zbek' }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }] as const
</script>

<template>
  <ProfPage>
    <ProfHeader :title="mode === 'store' ? 'Do\'kon sozlamalari' : 'Ilova sozlamalari'" />

    <template v-if="mode === 'store'">
      <ProfSection title="Valyuta">
        <ProfCard class="grid gap-3 p-4">
          <ProfSeg v-model="settings.currency" :options="currencies" />
          <div>
            <p class="text-[11.5px] text-muted">Narxlar va hisobotlar qaysi valyutada ko'rsatilsin</p>
            <p class="mt-0.5 text-[11.5px] font-bold text-[#5b616b]">Kurs: 1 $ = {{ formatSom(settings.usdRate) }} UZS</p>
          </div>
        </ProfCard>
      </ProfSection>

      <ProfSection title="Savdo">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-model="settings.b2b" label="Korxonalar bilan savdo" hint="Tashkilotlarga ulgurji sotish va ulardan xarid" />
          <ProfToggleRow v-model="settings.confirm" label="Buyurtmani tasdiqlash" hint="Yangi buyurtmalar qo'lda tasdiqlanadi" />
          <ProfToggleRow v-model="settings.showPrices" label="Narxlarni ko'rsatish" hint="Ombordagi mahsulot narxlari mijozlarga ko'rinadi" />
        </ProfCard>
      </ProfSection>

      <ProfSection title="Maxfiylik">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-model="settings.showPhone" label="Mijoz raqamimni ko'rsin" hint="Chatda qo'ng'iroq qilish tugmasi ko'rinadi" />
        </ProfCard>
      </ProfSection>

      <ProfSection title="Hisobot va ogohlantirish">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-model="settings.dailyReport" label="Kunlik hisobot" hint="Har kuni kechqurun savdo xulosasi yuboriladi" />
          <ProfToggleRow v-model="settings.lowStock" label="Kam qolgan mahsulotlar" hint="Minimal qoldiqdan tushganda ogohlantirish" />
        </ProfCard>
      </ProfSection>
    </template>

    <template v-else>
      <ProfSection title="Mavzu">
        <ProfCard class="grid gap-2.5 p-4">
          <p class="text-[12.5px] font-bold text-[#5b616b]">Ilova ko'rinishi</p>
          <ProfSeg v-model="settings.theme" :options="themes" />
        </ProfCard>
      </ProfSection>

      <ProfSection title="Til">
        <ProfCard class="grid gap-2.5 p-4">
          <p class="text-[12.5px] font-bold text-[#5b616b]">Ilova tili</p>
          <ProfSeg v-model="settings.lang" :options="langs" />
        </ProfCard>
      </ProfSection>

      <ProfSection title="Bildirishnomalar">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-model="settings.push" label="Push bildirishnomalar" hint="Yangi buyurtma va xabarlar" />
        </ProfCard>
      </ProfSection>
    </template>
  </ProfPage>
</template>
