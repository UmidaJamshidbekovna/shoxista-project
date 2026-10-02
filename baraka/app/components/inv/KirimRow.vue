<script setup lang="ts">
// Kirim qatori: miqdor va kirim narxini tahrirlash
export interface KirimLine { productId: string, qty: string, cost: string, flag?: string, rawName?: string }

const props = defineProps<{ line: KirimLine }>()
defineEmits<{ remove: [] }>()
const store = useStore()
const { selection } = useTelegram()

const p = computed(() => store.productById(props.line.productId))
const qtyN = computed(() => invParseNum(props.line.qty))
const costN = computed(() => invParseNum(props.line.cost))
const qtyErr = computed(() => !(qtyN.value > 0))
const costErr = computed(() => Number.isNaN(costN.value) || costN.value < 0)
const sum = computed(() => (qtyErr.value || costErr.value) ? 0 : qtyN.value * costN.value)
const diff = computed(() => {
  if (!p.value || costErr.value || !p.value.cost) return 0
  return Math.round(((costN.value - p.value.cost) / p.value.cost) * 100)
})

function step(d: number) {
  const cur = Number.isNaN(qtyN.value) ? 0 : qtyN.value
  // eslint-disable-next-line vue/no-mutating-props
  props.line.qty = String(Math.max(1, cur + d))
  selection()
}
</script>

<template>
  <div class="card flex flex-col gap-2.5 p-3" :class="line.flag && 'ring-2 ring-warn/50'">
    <div class="flex items-center gap-3">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-field text-2xl">{{ p?.emoji ?? '📦' }}</span>
      <span class="min-w-0 grow">
        <span class="block truncate text-sm font-extrabold">{{ p?.name ?? line.rawName }}</span>
        <span class="block truncate text-xs font-semibold text-muted">
          Qoldiq: {{ p?.stock ?? 0 }} {{ p?.unit }} · oxirgi narx {{ formatSom(p?.cost ?? 0) }}
        </span>
      </span>
      <button type="button" aria-label="Olib tashlash" class="flex size-8 shrink-0 items-center justify-center rounded-full bg-field text-muted" @click="$emit('remove')">
        <AppIcon name="x" :size="16" />
      </button>
    </div>
    <div v-if="line.flag" class="flex items-center gap-1.5 rounded-xl bg-warn-soft px-2.5 py-1.5 text-xs font-bold text-warn">
      <AppIcon name="alert" :size="14" />{{ line.flag }}
    </div>
    <div class="flex items-end gap-2">
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-bold text-muted">Miqdor</span>
        <div class="flex h-10 items-center rounded-full bg-field" :class="qtyErr && 'ring-2 ring-danger'">
          <button type="button" aria-label="Kamaytirish" class="flex size-10 items-center justify-center" @click="step(-1)"><AppIcon name="minus" :size="16" /></button>
          <!-- eslint-disable-next-line vue/no-mutating-props -->
          <input v-model="line.qty" inputmode="decimal" aria-label="Miqdor" class="w-10 bg-transparent text-center text-sm font-extrabold outline-none">
          <button type="button" aria-label="Ko'paytirish" class="flex size-10 items-center justify-center" @click="step(1)"><AppIcon name="plus" :size="16" /></button>
        </div>
      </div>
      <div class="flex min-w-0 grow flex-col gap-1">
        <span class="text-[11px] font-bold text-muted">Kirim narxi
          <span v-if="diff" :class="diff > 0 ? 'text-danger' : 'text-brand'">({{ diff > 0 ? '+' : '' }}{{ diff }}%)</span>
        </span>
        <div class="flex h-10 items-center gap-1 rounded-full bg-field px-3" :class="costErr && 'ring-2 ring-danger'">
          <!-- eslint-disable-next-line vue/no-mutating-props -->
          <input v-model="line.cost" inputmode="numeric" aria-label="Kirim narxi" class="min-w-0 grow bg-transparent text-sm font-extrabold outline-none">
          <span class="text-[11px] font-bold text-muted">so'm</span>
        </div>
      </div>
    </div>
    <div class="flex justify-between border-t border-line pt-2 text-xs font-bold">
      <span class="text-muted">Jami</span>
      <span>{{ formatSom(sum) }} so'm</span>
    </div>
  </div>
</template>
