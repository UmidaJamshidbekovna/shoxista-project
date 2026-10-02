<script setup lang="ts">
const { settings } = useStore()
const { show } = useToast()

const rate = ref(String(settings.value.usdRate))
const rateError = computed(() => {
  const n = Number(rate.value.replace(/\s/g, ''))
  return Number.isFinite(n) && n >= 1000 && n <= 100000 ? '' : '1 000 – 100 000 oralig\'ida kiriting'
})
watch(rate, (v) => {
  const d = v.replace(/\D/g, '')
  if (d !== v) rate.value = d
  if (!rateError.value) settings.value.usdRate = Number(d)
})
watch(() => settings.value.currency, c => show(c === 'USD' ? 'Narxlar dollarda ko\'rsatiladi' : 'Narxlar so\'mda ko\'rsatiladi', 'info'))
</script>

<template>
  <PageHeader title="Do'kon sozlamalari" subtitle="Savdo va hisobot qoidalari" back="/profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <SectionHead title="Valyuta" />
    <div class="card flex flex-col gap-3 p-4">
      <Segmented v-model="settings.currency" :options="[{ value: 'UZS', label: 'UZS — so\'m' }, { value: 'USD', label: 'USD — dollar' }]" />
      <template v-if="settings.currency === 'USD'">
        <BInput v-model="rate" label="Dollar kursi" placeholder="12 650" inputmode="numeric" suffix="so'm" icon="transfer" :error="rateError" hint="Hisobotlar so'mda saqlanadi, kurs bo'yicha qayta hisoblanadi" />
        <p v-if="!rateError" class="rounded-2xl bg-soft px-3.5 py-2.5 text-[13px] font-bold text-brand">1 $ = {{ formatSom(settings.usdRate) }} so'm · 100 000 so'm ≈ {{ (100000 / settings.usdRate).toFixed(2) }} $</p>
      </template>
      <p v-else class="text-xs font-medium text-muted">Barcha narxlar va hisobotlar o'zbek so'mida.</p>
    </div>

    <SectionHead title="Savdo" class="mt-1" />
    <div class="card px-4 py-0.5">
      <ProfSettingRow v-model="settings.b2b" icon="handshake" title="B2B savdo" desc="Tashkilotlarga ulgurji narxda sotish va hisob-faktura" />
      <ProfSettingRow v-model="settings.manualConfirm" icon="check" title="Buyurtmani qo'lda tasdiqlash" desc="Online buyurtmalar avval sizning tasdiqingizni kutadi" />
      <ProfSettingRow v-model="settings.showPrices" icon="tag" title="Narxlarni ko'rsatish" desc="Ommaviy sahifa va katalogda narxlar ko'rinadi" />
    </div>

    <SectionHead title="Hisobot va ogohlantirishlar" class="mt-1" />
    <div class="card px-4 py-0.5">
      <ProfSettingRow v-model="settings.dailyReport" icon="chart" title="Kunlik hisobot" desc="Har kuni 22:00 da savdo yakuni Telegramga yuboriladi" />
      <ProfSettingRow v-model="settings.lowStockAlert" icon="alert" title="Kam qolgan mahsulot ogohlantirishi" desc="Qoldiq minimal miqdordan kam bo'lsa xabar beriladi" />
    </div>
    <p class="flex items-center justify-center gap-1.5 text-xs font-medium text-muted"><AppIcon name="check" :size="14" />O'zgarishlar avtomatik saqlanadi</p>
  </div>
</template>
