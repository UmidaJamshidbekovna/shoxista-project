<script setup lang="ts">
import type { Transaction } from '~/data/types'
import type { IconName } from '~/components/AppIcon.vue'
import { channelIcon, channelLabel, payStatusLabel, payStatusTone, statusLabel, statusTone } from '~/data/labels'

// Bosh sahifadagi buyurtma qatori (online buyurtma yoki ta'minotchiga buyurtma)
const props = defineProps<{ tx: Transaction, supplier?: boolean }>()
const { customerById, orgById } = useStore()

const CHANNEL_COLOR: Record<string, string> = { telegram: '#229ED9', instagram: '#d62976', app: '#05472a', offline: '#4a5a52' }

const org = computed(() => orgById(props.tx.orgId))
const who = computed(() => customerById(props.tx.customerId)?.name ?? org.value?.name ?? 'Mijoz')
const qty = computed(() => props.tx.items.reduce((s, i) => s + i.qty, 0))
const meta = computed(() => props.supplier
  ? `${props.tx.no} · ${formatDay(props.tx.date)} · ${qty.value} dona`
  : `${props.tx.no} · ${channelLabel[props.tx.channel]} · ${formatTime(props.tx.date)}`)
</script>

<template>
  <NuxtLink :to="`/tarix/${tx.id}`" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0 active:opacity-70">
    <Avatar v-if="supplier" :name="who" :color="org?.logoColor ?? '#05472a'" :size="44" square />
    <span v-else class="flex size-11 shrink-0 items-center justify-center rounded-2xl" :style="{ background: `${CHANNEL_COLOR[tx.channel]}1a`, color: CHANNEL_COLOR[tx.channel] }">
      <AppIcon :name="channelIcon[tx.channel] as IconName" :size="21" />
    </span>
    <span class="min-w-0 grow">
      <span class="block truncate text-[15px] font-bold text-ink">{{ who }}</span>
      <span class="block truncate text-xs font-medium text-muted">{{ meta }}</span>
    </span>
    <span class="flex shrink-0 flex-col items-end gap-1">
      <span class="text-[14px] font-extrabold text-ink">{{ formatSom(tx.total) }}</span>
      <Badge v-if="supplier" :tone="payStatusTone[tx.payStatus]">{{ payStatusLabel[tx.payStatus] }}</Badge>
      <Badge v-else :tone="statusTone[tx.status]">{{ statusLabel[tx.status] }}</Badge>
    </span>
  </NuxtLink>
</template>
