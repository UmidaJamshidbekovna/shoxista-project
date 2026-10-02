<script setup lang="ts">
import type { ChatThread } from '~/data/types'
import { statusLabel, statusTone } from '~/data/labels'

const props = defineProps<{ thread: ChatThread, linked: string[] }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ pick: [id: string] }>()
const { transactions } = useStore()
const { selection } = useTelegram()
const picked = ref('')

watch(open, (v) => { if (v) picked.value = '' })

const list = computed(() => transactions.value
  .filter(t => props.thread.kind === 'org' ? t.orgId === props.thread.refId : t.customerId === props.thread.refId)
  .sort((a, b) => b.date.localeCompare(a.date)))

function confirm() {
  if (!picked.value) return
  emit('pick', picked.value)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="Buyurtmaga bog'lash">
    <p class="mb-3 text-[13px] font-medium text-muted">{{ thread.title }} bilan bog'liq tranzaksiyani tanlang</p>
    <EmptyState v-if="!list.length" icon="cart" title="Tranzaksiya yo'q" text="Bu suhbat tomoni hali xarid qilmagan" />
    <div v-else class="flex flex-col gap-2">
      <button
        v-for="t in list" :key="t.id" type="button"
        class="flex items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left transition-colors"
        :class="picked === t.id ? 'border-brand' : 'border-transparent shadow-card'"
        @click="picked = t.id; selection()"
      >
        <span class="flex size-6 shrink-0 items-center justify-center rounded-full border-2" :class="picked === t.id ? 'border-brand bg-brand text-white' : 'border-line'">
          <AppIcon v-if="picked === t.id" name="check" :size="13" :stroke="3" />
        </span>
        <span class="min-w-0 grow">
          <span class="flex items-center gap-1.5 text-sm font-bold">
            {{ t.no }}
            <span v-if="linked.includes(t.id)" class="rounded-md bg-soft px-1.5 text-[10px] leading-4 font-extrabold text-brand">bog'langan</span>
          </span>
          <span class="block text-xs font-medium text-muted">{{ formatDay(t.date) }} · {{ formatTime(t.date) }} · {{ t.items.length }} xil</span>
        </span>
        <span class="flex flex-col items-end gap-1">
          <span class="text-sm font-extrabold" :class="(t.status === 'cancelled' || t.status === 'returned') && 'text-muted line-through'">{{ formatSom(t.total) }}</span>
          <Badge :tone="statusTone[t.status]">{{ statusLabel[t.status] }}</Badge>
        </span>
      </button>
    </div>
    <template #footer>
      <PillButton block icon="link" :disabled="!picked" @click="confirm">Bog'lash</PillButton>
    </template>
  </BSheet>
</template>
