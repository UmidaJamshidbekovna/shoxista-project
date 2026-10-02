<script setup lang="ts">
import type { Transaction } from '~/data/types'
import type { IconName } from '../AppIcon.vue'
import { channelIcon, channelLabel, payStatusLabel, payStatusTone, statusLabel, statusTone } from '~/data/labels'

const props = defineProps<{ tx: Transaction }>()
const { countsInTotal } = useStore()
const party = useTxParty()
const excluded = computed(() => !countsInTotal(props.tx))
const itemCount = computed(() => props.tx.items.reduce((s, i) => s + i.qty, 0))
const chColor: Record<string, string> = { offline: 'bg-soft text-brand', telegram: 'bg-info-soft text-info', instagram: 'bg-[#fdeef6] text-[#c13584]', app: 'bg-warn-soft text-warn' }
</script>

<template>
  <NuxtLink :to="`/tarix/${tx.id}`" class="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-field">
    <span class="relative flex size-11 shrink-0 items-center justify-center rounded-full" :class="chColor[tx.channel]" :title="channelLabel[tx.channel]">
      <AppIcon :name="channelIcon[tx.channel] as IconName" :size="20" />
    </span>
    <span class="min-w-0 grow">
      <span class="flex items-center gap-1.5">
        <span class="truncate text-[15px] font-bold" :class="excluded ? 'text-muted' : 'text-ink'">{{ party(tx) }}</span>
        <span v-if="tx.segment === 'B2B'" class="shrink-0 rounded-md bg-field px-1.5 text-[10px] leading-4 font-extrabold text-muted-2">B2B</span>
      </span>
      <span class="block truncate text-xs font-medium text-muted">{{ tx.no }} · {{ formatTime(tx.date) }} · {{ itemCount }} ta mahsulot</span>
      <span class="mt-1.5 flex gap-1.5">
        <Badge :tone="statusTone[tx.status]">{{ statusLabel[tx.status] }}</Badge>
        <Badge v-if="!excluded" :tone="payStatusTone[tx.payStatus]">{{ payStatusLabel[tx.payStatus] }}</Badge>
      </span>
    </span>
    <span class="shrink-0 self-start pt-0.5 text-right">
      <span class="block text-[15px] font-extrabold whitespace-nowrap" :class="excluded ? 'text-muted line-through' : tx.kind === 'purchase' ? 'text-ink' : 'text-brand'">
        {{ tx.kind === 'purchase' ? '−' : '+' }}{{ formatSom(tx.total) }}
      </span>
      <span class="block text-[11px] font-semibold text-muted">so'm</span>
    </span>
  </NuxtLink>
</template>
