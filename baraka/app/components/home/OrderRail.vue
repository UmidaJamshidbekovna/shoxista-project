<script setup lang="ts">
// Buyurtmalar karuseli (Home Page spetsifikatsiyasi §5 va §6)
import type { IconName } from '~/components/AppIcon.vue'
import type { Transaction } from '~/data/types'

defineProps<{
  title: string
  items: Transaction[]
  /** "Barchasi" kartasi qayerga olib boradi */
  allTo: string
  emptyIcon: IconName
  emptyTitle: string
  emptyText: string
  /** Boshida "Yangi buyurtma" kartasi ko'rsatilsinmi */
  newCard?: boolean
}>()
defineEmits<{ new: [] }>()
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="flex items-center gap-2 text-base font-extrabold text-ink">
      {{ title }}
      <span v-if="items.length" class="rounded-[10px] bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white">{{ items.length }}</span>
    </h2>

    <div v-if="items.length" class="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
      <button
        v-if="newCard" type="button"
        class="flex w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-[#9cc4ad] bg-soft transition-transform active:scale-95"
        @click="$emit('new')"
      >
        <span class="flex size-11 items-center justify-center rounded-full bg-card text-brand shadow-card"><AppIcon name="plus" :size="20" :stroke="2.2" /></span>
        <span class="px-1 text-center text-[11px] leading-tight font-bold text-brand">Yangi buyurtma</span>
      </button>

      <HomeOrderCard v-for="t in items" :key="t.id" :tx="t" />

      <NuxtLink
        :to="allTo"
        class="flex w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] bg-card shadow-card transition-transform active:scale-95"
      >
        <span class="flex size-11 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="arrow-right" :size="20" :stroke="2.2" /></span>
        <span class="text-[11px] font-bold text-muted-2">Barchasi</span>
      </NuxtLink>
    </div>

    <div v-else class="card px-4 py-1">
      <EmptyState :icon="emptyIcon" :title="emptyTitle" :text="emptyText">
        <PillButton v-if="newCard" size="sm" variant="soft" icon="plus" class="mt-1" @click="$emit('new')">Yangi buyurtma</PillButton>
      </EmptyState>
    </div>
  </section>
</template>
