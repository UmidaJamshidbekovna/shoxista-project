<script setup lang="ts">
// Tarix: buyurtma kartasi (Stock and History.md §II.6)
import type { IconName } from '~/components/AppIcon.vue'
import type { Transaction } from '~/data/types'
import { channelIcon } from '~/data/labels'

const props = defineProps<{ tx: Transaction }>()
defineEmits<{ open: [] }>()
const { settings, countsInTotal } = useStore()
const party = useTxParty()
const { amount } = useMoney()

const name = computed(() => party(props.tx))
const isSale = computed(() => props.tx.kind === 'sale')
const ch = computed(() => HIST_CHANNEL[props.tx.channel] ?? HIST_CHANNEL.offline)
const logo = computed(() => histSupplierColors(name.value))
const inactive = computed(() => !countsInTotal(props.tx))
const pay = computed(() => HIST_PAY[props.tx.payStatus])
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-[20px] bg-card p-3 text-left shadow-[0_2px_10px_rgba(5,71,42,.05)] transition-transform active:scale-[0.98]"
    @click="$emit('open')"
  >
    <span
      v-if="isSale"
      class="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]"
      :style="{ background: ch.bg, color: ch.c }"
    >
      <AppIcon :name="channelIcon[tx.channel] as IconName" :size="20" :stroke="1.9" />
    </span>
    <span
      v-else
      class="flex size-[46px] shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold"
      :style="{ background: logo.bg, color: logo.c }"
    >{{ histInitials(name) }}</span>

    <span class="flex min-w-0 grow flex-col gap-[3px]">
      <span class="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <span class="shrink-0 text-[14.5px] leading-[18px] font-extrabold text-ink">#{{ tx.no }}</span>
        <span
          v-if="isSale && settings.b2b && tx.segment === 'B2B'"
          class="hist-tag bg-[#eaf1ff] text-[#2f6fed]"
        >Korxona</span>
        <span v-if="tx.status === 'cancelled'" class="hist-tag bg-[#fdecec] text-[#d93036]">
          <AppIcon name="x" :size="11" :stroke="2.6" />Bekor qilindi
        </span>
        <span v-else-if="tx.status === 'returned'" class="hist-tag bg-[#fbefdc] text-[#9a5b0b]">
          <AppIcon name="undo" :size="11" :stroke="2.6" />Qaytarildi
        </span>
        <span v-else class="hist-tag" :style="{ background: pay.bg, color: pay.c }">{{ pay.label }}</span>
      </span>
      <span class="truncate text-[12px] font-medium text-muted">{{ name }} · {{ formatTime(tx.date) }} · {{ histChannelLabel(tx.channel) }}</span>
    </span>

    <span class="flex shrink-0 flex-col items-end gap-[3px]">
      <span
        class="text-[15px] leading-[18px] font-extrabold whitespace-nowrap"
        :class="inactive ? 'text-[#a3a8b0] line-through' : 'text-brand'"
      >{{ amount(tx.total) }}</span>
      <span class="text-[11.5px] font-semibold text-[#a3a8b0]">{{ tx.items.length }} ta</span>
    </span>
  </button>
</template>

<style scoped>
.hist-tag {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .03em;
  white-space: nowrap;
}
</style>
