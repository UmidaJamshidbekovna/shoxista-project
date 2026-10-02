<script setup lang="ts">
import type { Product } from '~/data/types'

// Mahsulot kartasi (POS panjarasi): bosilganda savatga qo'shiladi
const props = defineProps<{ product: Product, inCart: number }>()
const emit = defineEmits<{ add: [], dec: [] }>()
const { stockState, categoryById } = useStore()
const state = computed(() => stockState(props.product))
const color = computed(() => categoryById(props.product.categoryId)?.color ?? '#05472a')
const left = computed(() => props.product.stock - props.inCart)
</script>

<template>
  <button
    type="button"
    class="relative flex flex-col gap-1.5 rounded-[18px] bg-card p-2 text-left shadow-card transition active:scale-[0.97] disabled:active:scale-100"
    :class="[state === 'out' && 'opacity-55', inCart && 'ring-2 ring-brand']"
    :disabled="state === 'out'"
    :aria-label="`${product.name} qo'shish`"
    @click="emit('add')"
  >
    <span class="relative flex h-[58px] items-center justify-center rounded-[14px] text-[30px]" :style="{ background: `${color}14` }">
      {{ product.emoji }}
      <span
        v-if="inCart"
        class="absolute top-1.5 right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-extrabold text-white"
      >{{ inCart }}</span>
      <span
        v-if="inCart" role="button" aria-label="Bittasini olib tashlash"
        class="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-card text-ink shadow-card"
        @click.stop="emit('dec')"
      ><AppIcon name="minus" :size="14" /></span>
    </span>
    <span class="line-clamp-2 min-h-8 text-[12px] leading-4 font-bold text-ink">{{ product.name }}</span>
    <span class="flex items-end justify-between gap-1">
      <span class="text-[13px] leading-none font-extrabold text-ink">{{ formatSom(product.price) }}</span>
      <span
        class="text-[10px] leading-none font-bold"
        :class="state === 'out' ? 'text-danger' : state === 'low' ? 'text-warn' : 'text-muted'"
      >{{ state === 'out' ? 'Tugagan' : `${left} ${product.unit}` }}</span>
    </span>
  </button>
</template>
