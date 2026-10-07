<script setup lang="ts">
// Tarix: Filtr sheet (Stock and History.md §II.7). Tanlovlar avval hfDraft ga yoziladi,
// faqat "Ko'rsatish (N)" bosilganda hf ga qo'llanadi.
const open = defineModel<boolean>({ default: false })
const { settings } = useStore()
const { dir, hf, hfDraft } = useHistFilters()
const { run } = useHistList()
const { selection, haptic } = useTelegram()

watch(open, (v) => { if (v) hfDraft.value = { ...hf.value } }, { immediate: true })

const groups = computed(() => HIST_GROUPS.filter(g => histKeyApplies(g.k, dir.value, settings.value.b2b)))
const count = computed(() => run(hfDraft.value).length)

function pick(k: HistKey, v: string) {
  selection()
  hfDraft.value = { ...hfDraft.value, [k]: v }
}
function clear() {
  selection()
  hfDraft.value = emptyHistFilters()
}
function apply() {
  haptic('light')
  hf.value = { ...hfDraft.value }
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" tone="card">
    <div class="flex items-center justify-between gap-3 pt-2 pb-4">
      <h2 class="text-[19px] font-extrabold text-ink">Filtrlar</h2>
      <button type="button" class="text-[13px] font-bold text-muted" @click="clear">Tozalash</button>
    </div>

    <div class="flex flex-col gap-[18px]">
      <section v-for="g in groups" :key="g.k" class="flex flex-col gap-2.5">
        <h3 class="text-[13px] font-bold text-[#5C6576]">{{ g.title }}</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in g.opts" :key="o" type="button"
            class="rounded-[18px] border px-[13px] py-2 text-[12.5px] leading-4 font-bold transition-colors"
            :class="hfDraft[g.k] === o ? 'border-brand bg-brand text-white' : 'border-[#e4e7eb] bg-card text-ink'"
            @click="pick(g.k, o)"
          >
            {{ o }}
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-[54px] w-full rounded-full bg-brand text-[15px] font-extrabold text-white transition active:scale-[0.98]"
        @click="apply"
      >
        Ko'rsatish ({{ count }})
      </button>
    </template>
  </BSheet>
</template>
