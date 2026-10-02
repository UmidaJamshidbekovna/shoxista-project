<script setup lang="ts">
import type { HistFilters } from '~/composables/useHistFilters'
import { channelLabel, methodLabel, payStatusLabel, statusLabel } from '~/data/labels'

const open = defineModel<boolean>({ default: false })
const { filters } = useHistFilters()
const { selection } = useTelegram()

// Sheet ichida qoralama; "Qo'llash" bosilganda saqlanadi
const draft = ref<HistFilters>(emptyHistFilters())
watch(open, (v) => { if (v) draft.value = JSON.parse(JSON.stringify(filters.value)) })

const toOpts = (r: Record<string, string>) => Object.entries(r).map(([value, label]) => ({ value, label }))
const channelOpts = toOpts(channelLabel)
const statusOpts = toOpts(statusLabel)
const payOpts = toOpts(payStatusLabel)
const methodOpts = toOpts(methodLabel)
const segOpts = [{ value: '', label: 'Hammasi' }, { value: 'B2C', label: 'B2C' }, { value: 'B2B', label: 'B2B' }]

const draftCount = computed(() => {
  const f = draft.value
  return f.channels.length + (f.segment ? 1 : 0) + f.statuses.length + f.payStatuses.length + f.methods.length
})

function toggle<K extends keyof Omit<HistFilters, 'segment'>>(key: K, v: string) {
  selection()
  const arr = draft.value[key] as string[]
  draft.value[key] = (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]) as HistFilters[K]
}
function apply() {
  filters.value = JSON.parse(JSON.stringify(draft.value))
  open.value = false
}
function clear() {
  draft.value = emptyHistFilters()
  selection()
}
const groups = [
  { key: 'channels', title: 'Kanal', opts: channelOpts },
  { key: 'statuses', title: 'Buyurtma holati', opts: statusOpts },
  { key: 'payStatuses', title: 'To\'lov holati', opts: payOpts },
  { key: 'methods', title: 'To\'lov turi', opts: methodOpts },
] as const
</script>

<template>
  <BSheet v-model="open" title="Filtr">
    <div class="flex flex-col gap-5">
      <section class="flex flex-col gap-2.5">
        <h3 class="text-[13px] font-extrabold text-muted-2">Segment</h3>
        <Segmented v-model="draft.segment" :options="segOpts" />
      </section>
      <section v-for="g in groups" :key="g.key" class="flex flex-col gap-2.5">
        <h3 class="text-[13px] font-extrabold text-muted-2">{{ g.title }}</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="o in g.opts" :key="o.value" type="button"
            class="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors"
            :class="(draft[g.key] as string[]).includes(o.value) ? 'bg-brand text-white' : 'bg-card text-muted-2 shadow-card'"
            @click="toggle(g.key, o.value)"
          >
            <AppIcon v-if="(draft[g.key] as string[]).includes(o.value)" name="check" :size="14" :stroke="2.6" />
            {{ o.label }}
          </button>
        </div>
      </section>
    </div>
    <template #footer>
      <div class="grid grid-cols-[auto_1fr] gap-2.5">
        <PillButton variant="field" :disabled="!draftCount" @click="clear">Tozalash</PillButton>
        <PillButton block @click="apply">Qo'llash<span v-if="draftCount" class="rounded-full bg-white/20 px-2 text-xs">{{ draftCount }}</span></PillButton>
      </div>
    </template>
  </BSheet>
</template>
