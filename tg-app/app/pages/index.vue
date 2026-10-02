<script setup lang="ts">
import { CATEGORIES, products, stockStatus } from '~/data/products'

definePageMeta({ tab: true })

const { count, total, add } = useCart()
const { haptic, scanQr } = useTelegram()

const query = ref('')
const filter = ref('Hammasi')
const filters = ['Hammasi', ...CATEGORIES]

const visible = computed(() => products.filter(p =>
  (filter.value === 'Hammasi' || p.category === filter.value)
  && p.name.toLowerCase().includes(query.value.trim().toLowerCase())))

function onAdd(p: (typeof products)[number]) {
  add(p)
  haptic('light')
}
async function onScan() {
  const code = await scanQr()
  if (code) query.value = code
}
</script>

<template>
  <ScreenHeader title="Kassa" subtitle="Chilonzor filiali · Kassir: Aziz">
    <IconButton icon="message" label="Xabarlar" to="/xabarlar" :badge="3" />
    <IconButton icon="globe" label="Onlayn buyurtmalar" to="/onlayn" :badge="2" />
  </ScreenHeader>

  <div class="flex shrink-0 gap-2.5 px-5 pb-3">
    <SearchField v-model="query" placeholder="Mahsulot nomi yoki kodi" />
    <IconButton icon="barcode" label="Shtrix-kodni skanerlash" dark :size="52" @click="onScan" />
  </div>

  <FilterChips v-model="filter" :options="filters" />

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pt-3 pb-24">
    <div class="grid grid-cols-2 gap-2.5">
      <div
        v-for="p in visible" :key="p.id"
        class="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-3"
        :class="{ 'opacity-60': stockStatus(p) === 'out' }"
      >
        <div class="flex items-start justify-between gap-1.5">
          <LetterTile :text="p.letter" :bg="p.tile.bg" :fg="p.tile.fg" :size="40" />
          <Tag v-if="stockStatus(p) === 'low'" tone="warn">Kam qoldi</Tag>
          <Tag v-else-if="stockStatus(p) === 'out'" tone="danger">Tugagan</Tag>
        </div>
        <div class="min-h-9 text-sm leading-tight font-semibold">{{ p.name }}</div>
        <div class="text-xs text-muted">Qoldiq: {{ p.stock ? `${p.stock} ${p.unit}` : 0 }}</div>
        <div class="flex items-center justify-between gap-1.5">
          <span class="text-base font-bold">{{ formatSom(p.price) }} <span class="text-xs font-medium text-muted">so'm</span></span>
          <button
            type="button" aria-label="Savatga qo'shish"
            class="flex size-9 items-center justify-center rounded-xl transition-transform active:scale-90"
            :class="stockStatus(p) === 'out' ? 'bg-track text-muted' : 'bg-brand-soft text-brand'"
            :disabled="stockStatus(p) === 'out'"
            @click="onAdd(p)"
          >
            <AppIcon name="plus" />
          </button>
        </div>
      </div>
    </div>
    <p v-if="!visible.length" class="py-10 text-center text-sm text-muted">Mahsulot topilmadi</p>
  </div>

  <!-- Suzuvchi savat paneli -->
  <Transition
    enter-from-class="translate-y-4 opacity-0" leave-to-class="translate-y-4 opacity-0"
    enter-active-class="transition" leave-active-class="transition"
  >
    <NuxtLink
      v-if="count > 0" to="/savat"
      class="absolute inset-x-4 bottom-3 flex h-16 items-center gap-3 rounded-[20px] bg-ink px-4 text-white shadow-[0_10px_24px_rgba(23,25,30,0.22)]"
    >
      <span class="relative flex">
        <AppIcon name="cart" :size="24" />
        <span class="absolute -top-2 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-brand px-1 text-[11px] font-bold">{{ count }}</span>
      </span>
      <span class="flex grow flex-col">
        <span class="text-xs opacity-80">Savat · {{ count }} ta mahsulot</span>
        <span class="text-lg font-bold">{{ formatSom(total) }} so'm</span>
      </span>
      <span class="flex items-center gap-1 text-[15px] font-bold">To'lov<AppIcon name="chevron-right" :size="18" /></span>
    </NuxtLink>
  </Transition>
</template>
