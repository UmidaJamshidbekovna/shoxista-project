<script setup lang="ts">
// Ombor ro'yxatidagi mahsulot kartasi (Stock and History.md §6)
import type { Product } from '~/data/types'

const props = defineProps<{ product: Product }>()
const store = useStore()

const tone = computed(() => STOCK_TONE[store.stockState(props.product)])
const cover = computed(() => productImages(props.product)[0])
const sub = computed(() => [
  store.categoryById(props.product.categoryId)?.name,
  store.orgById(props.product.supplierId)?.name,
].filter(Boolean).join(' · '))
</script>

<template>
  <NuxtLink
    :to="`/ombor/${product.id}`"
    class="flex items-center gap-3 rounded-[22px] bg-card p-2.5 transition-transform active:scale-[0.985]"
  >
    <span
      class="flex h-[60px] w-[61px] shrink-0 items-center justify-center overflow-hidden rounded-2xl"
      :style="{ background: product.tint ?? '#eef0f3' }"
    >
      <img v-if="cover" :src="cover" :alt="product.name" class="size-full object-cover">
      <span v-else class="text-[16px] font-extrabold text-black/45">{{ productInitials(product.name) }}</span>
    </span>
    <span class="min-w-0 grow">
      <span class="block truncate text-[16px] leading-tight font-extrabold text-ink">{{ product.name }}</span>
      <span class="mt-1 block truncate text-[11.5px] text-muted">{{ sub }}</span>
    </span>
    <span class="shrink-0 pr-1 text-right">
      <span class="block text-[16px] leading-tight font-extrabold text-ink">{{ formatSom(product.price) }}</span>
      <span class="mt-1 block text-[12.5px] font-bold" :style="{ color: tone.color }">{{ product.stock }} {{ product.unit }}</span>
    </span>
  </NuxtLink>
</template>
