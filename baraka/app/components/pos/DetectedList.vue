<script setup lang="ts">
import type { PosDetected } from '~/composables/usePos'

// AI kamera / ovoz natijalari: belgilash va miqdorni tasdiqlash
const items = defineModel<PosDetected[]>({ required: true })
const { productById } = useStore()
const { qtyInCart } = usePos()
const { show } = useToast()
const maxFor = (id: string) => Math.max(0, (productById(id)?.stock ?? 0) - qtyInCart(id))
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="it in items" :key="it.productId"
      class="flex items-center gap-3 rounded-[18px] bg-card p-2.5 shadow-card"
      :class="!maxFor(it.productId) && 'opacity-55'"
    >
      <button
        type="button" class="flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
        :class="it.on ? 'border-brand bg-brand text-white' : 'border-line bg-card'"
        :aria-label="it.on ? 'Tanlovni bekor qilish' : 'Tanlash'"
        :disabled="!maxFor(it.productId)"
        @click="it.on = !it.on"
      >
        <AppIcon v-if="it.on" name="check" :size="14" :stroke="3" />
      </button>
      <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-field text-2xl">{{ productById(it.productId)?.emoji }}</span>
      <span class="min-w-0 grow">
        <span class="block truncate text-[14px] font-bold">{{ productById(it.productId)?.name }}</span>
        <span class="flex items-center gap-1.5 text-xs font-semibold text-muted">
          {{ formatSom(productById(it.productId)?.price ?? 0) }} so'm
          <template v-if="!maxFor(it.productId)"><span class="text-danger">· qoldiq yo'q</span></template>
          <template v-else-if="it.confidence"><span class="text-brand">· {{ it.confidence }}%</span></template>
        </span>
      </span>
      <PosStepper
        v-if="maxFor(it.productId)" v-model="it.qty" :min="1" :max="maxFor(it.productId)" size="sm"
        @limit="show(`Omborda faqat ${maxFor(it.productId)} ta bor`, 'error')"
      />
    </div>
  </div>
</template>
