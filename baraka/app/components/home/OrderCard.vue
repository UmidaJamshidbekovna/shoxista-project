<script setup lang="ts">
// Bosh sahifadagi buyurtma kartasi (Home Page spetsifikatsiyasi §5)
import type { IconName } from '~/components/AppIcon.vue'
import type { Channel, OrderStatus, Transaction } from '~/data/types'
import { channelIcon, statusLabel } from '~/data/labels'

const props = defineProps<{ tx: Transaction }>()
const { customerById, orgById } = useStore()

/** Kanal ranglari: matn / fon */
const CHANNEL: Record<Channel, [string, string]> = {
  offline: ['#5b616b', '#eef0f3'],
  instagram: ['#d6246e', '#fdeaf2'],
  telegram: ['#229ed9', '#e6f5fc'],
  app: ['#15803d', '#e7f7ec'],
}
/** Aktiv holat ranglari: matn / fon */
const STATUS: Partial<Record<OrderStatus, [string, string]>> = {
  pending: ['#2f6fed', '#eaf1ff'],
  processing: ['#b45309', '#fff4e0'],
  shipping: ['#7c3aed', '#f1ebfe'],
}

const who = computed(() => customerById(props.tx.customerId)?.name ?? orgById(props.tx.orgId)?.name ?? 'Umumiy mijoz')
const channel = computed(() => CHANNEL[props.tx.channel] ?? CHANNEL.offline)
const status = computed(() => STATUS[props.tx.status] ?? ['#4a5a52', '#eef0f3'])
</script>

<template>
  <NuxtLink
    :to="`/tarix/${tx.id}`"
    class="flex w-[252px] shrink-0 flex-col gap-3 rounded-[22px] bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]"
  >
    <div class="flex items-center gap-2.5">
      <span
        class="flex size-[38px] shrink-0 items-center justify-center rounded-xl"
        :style="{ background: channel[1], color: channel[0] }"
      >
        <AppIcon :name="channelIcon[tx.channel] as IconName" :size="18" :stroke="1.9" />
      </span>
      <span class="min-w-0 grow">
        <span class="block truncate text-[14px] font-extrabold text-ink">{{ who }}</span>
        <span class="block truncate text-[11px] font-semibold text-muted">{{ tx.no }} · {{ formatTime(tx.date) }}</span>
      </span>
      <AppIcon name="chevron-right" :size="18" :stroke="2.2" class="shrink-0 text-muted" />
    </div>
    <div class="flex items-center justify-between gap-2">
      <span class="min-w-0 truncate text-[17px] font-extrabold tracking-[-0.01em] text-ink">{{ formatSom(tx.total) }}</span>
      <span
        class="shrink-0 rounded-[10px] px-2.5 py-1 text-[11px] font-extrabold"
        :style="{ background: status[1], color: status[0] }"
      >{{ statusLabel[tx.status] }}</span>
    </div>
  </NuxtLink>
</template>
