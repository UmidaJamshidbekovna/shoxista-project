<script setup lang="ts">
// Ta'minotchi tashkilotni tanlash (gorizontal kartalar)
const model = defineModel<string>({ default: '' })
const store = useStore()
const { selection } = useTelegram()
const suppliers = computed(() => store.organizations.value.filter(o => o.type === 'supplier'))
</script>

<template>
  <div class="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 py-1">
    <button
      v-for="o in suppliers" :key="o.id" type="button"
      class="flex w-[150px] shrink-0 flex-col items-start gap-2 rounded-[18px] border-2 bg-card p-3 text-left shadow-card transition-colors"
      :class="model === o.id ? 'border-brand' : 'border-transparent'"
      @click="model = o.id; selection()"
    >
      <span class="flex w-full items-center justify-between">
        <Avatar :name="o.name.replace(/[^\p{L}\s]/gu, '')" :color="o.logoColor" :size="36" square />
        <span v-if="model === o.id" class="flex size-5 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="check" :size="12" :stroke="3" /></span>
      </span>
      <span class="line-clamp-2 min-h-[34px] text-[13px] leading-tight font-extrabold">{{ o.name }}</span>
      <span class="text-[11px] font-bold" :class="o.balance > 0 ? 'text-danger' : 'text-muted'">
        {{ o.balance > 0 ? `Qarzimiz: ${formatSom(o.balance)}` : 'Qarz yo\'q' }}
      </span>
    </button>
  </div>
</template>
