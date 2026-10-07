<script setup lang="ts">
// Filiallar va Omborlar ro'yxati (Profile.md §5). ?tab=filial|ombor (brTab)
const route = useRoute()
const router = useRouter()
const { branches, warehouses } = useStore()

const tab = computed<'filial' | 'ombor'>({
  get: () => route.query.tab === 'ombor' ? 'ombor' : 'filial',
  set: v => router.replace({ query: { ...route.query, tab: v } }),
})
const isBranch = computed(() => tab.value === 'filial')

/** Asosiy filial birinchi */
const branchList = computed(() => [...branches.value].sort((a, b) => Number(!!b.main) - Number(!!a.main)))

const tabs = [{ value: 'filial', label: 'Filiallar' }, { value: 'ombor', label: 'Omborlar' }] as const
</script>

<template>
  <ProfPage>
    <ProfHeader :title="isBranch ? 'Filiallar' : 'Omborlar'" :size="22">
      <ProfIconBtn
        icon="plus" :label="isBranch ? 'Yangi filial' : 'Yangi ombor'" tone="brand"
        @click="navigateTo(`/profil/filiallar/new?type=${isBranch ? 'branch' : 'warehouse'}`)"
      />
    </ProfHeader>

    <ProfSeg v-model="tab" :options="tabs" />

    <div v-if="isBranch" class="grid gap-2.5">
      <NuxtLink
        v-for="b in branchList" :key="b.id" :to="`/profil/filiallar/${b.id}`"
        class="grid gap-3 rounded-[20px] border-[1.5px] bg-card p-[14px] transition-transform active:scale-[0.99]"
        :class="b.main ? 'border-brand' : 'border-transparent'"
      >
        <div class="flex items-center gap-3">
          <span class="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-soft text-brand">
            <AppIcon name="store" :size="20" :stroke="1.8" />
          </span>
          <span class="min-w-0 grow">
            <span class="flex items-center gap-1.5">
              <span class="truncate text-[15px] font-extrabold text-ink">{{ b.name }}</span>
              <span v-if="b.main" class="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-extrabold text-white">Asosiy</span>
            </span>
            <span class="mt-0.5 block truncate text-[12px] text-muted">Filial · {{ b.address }}</span>
          </span>
          <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#a3a8b0]" />
        </div>
        <div class="flex items-center gap-2 rounded-[13px] bg-[#f6f7f9] px-3 py-2.5 text-[12.5px]">
          <span class="size-2 shrink-0 rounded-full" :class="profIsOpen(b) ? 'bg-[#16a34a]' : 'bg-[#d93036]'" />
          <span class="font-extrabold" :class="profIsOpen(b) ? 'text-[#15803d]' : 'text-[#d93036]'">{{ profIsOpen(b) ? 'Ochiq' : 'Yopiq' }}</span>
          <span class="ml-auto font-semibold text-[#5b616b]">{{ profTodayText(b) }}</span>
        </div>
        <div v-if="b.manager" class="flex items-center gap-1.5 text-[12.5px] text-[#5b616b]">
          <AppIcon name="user" :size="14" :stroke="2.2" class="text-muted" />
          Mas'ul: <b class="font-extrabold text-ink">{{ b.manager }}</b>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="grid gap-2.5">
      <NuxtLink
        v-for="w in warehouses" :key="w.id" :to="`/profil/filiallar/${w.id}`"
        class="grid gap-3 rounded-[20px] border-[1.5px] border-transparent bg-card p-[14px] transition-transform active:scale-[0.99]"
      >
        <div class="flex items-center gap-3">
          <span class="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-soft text-brand">
            <AppIcon name="box" :size="20" :stroke="1.8" />
          </span>
          <span class="min-w-0 grow">
            <span class="block truncate text-[15px] font-extrabold text-ink">{{ w.name }}</span>
            <span class="mt-0.5 block truncate text-[12px] text-muted">Ombor · {{ w.address }}</span>
          </span>
          <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#a3a8b0]" />
        </div>
        <div v-if="w.manager" class="flex items-center gap-1.5 text-[12.5px] text-[#5b616b]">
          <AppIcon name="user" :size="14" :stroke="2.2" class="text-muted" />
          Mas'ul: <b class="font-extrabold text-ink">{{ w.manager }}</b>
        </div>
      </NuxtLink>
      <p v-if="!warehouses.length" class="py-8 text-center text-[13px] text-muted">Hali ombor qo'shilmagan</p>
    </div>
  </ProfPage>
</template>
