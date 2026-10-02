<script setup lang="ts">
import type { Product } from '~/data/types'

const props = defineProps<{ product: Product }>()
const store = useStore()
const { stockPct } = useInv()
const cat = computed(() => store.categoryById(props.product.categoryId))
const state = computed(() => store.stockState(props.product))
const barColor = computed(() => ({ ok: 'bg-brand', low: 'bg-warn', out: 'bg-danger' })[state.value])
</script>

<template>
  <NuxtLink :to="`/ombor/${product.id}`" class="card flex items-center gap-3 p-3 transition active:scale-[0.99]">
    <span
      class="flex size-14 shrink-0 items-center justify-center rounded-2xl text-[28px]"
      :style="{ background: `${cat?.color ?? '#05472a'}14` }"
    >{{ product.emoji }}</span>
    <span class="flex min-w-0 grow flex-col gap-1">
      <span class="flex items-start gap-2">
        <span class="min-w-0 grow truncate text-[15px] font-extrabold text-ink">{{ product.name }}</span>
        <Badge :tone="invStockTone[state]">{{ invStockLabel[state] }}</Badge>
      </span>
      <span class="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: cat?.color }" />
        <span class="truncate">{{ cat?.name ?? 'Kategoriyasiz' }}</span>
        <span class="text-line">•</span>
        <span class="shrink-0 font-extrabold text-ink">{{ formatSom(product.price) }} so'm</span>
      </span>
      <span class="flex items-center gap-2">
        <span class="h-1.5 grow overflow-hidden rounded-full bg-field">
          <span class="block h-full rounded-full transition-all" :class="barColor" :style="{ width: `${stockPct(product)}%` }" />
        </span>
        <span class="shrink-0 text-xs font-bold" :class="state === 'ok' ? 'text-muted-2' : state === 'low' ? 'text-warn' : 'text-danger'">
          {{ product.stock }} {{ product.unit }}
        </span>
      </span>
    </span>
  </NuxtLink>
</template>
