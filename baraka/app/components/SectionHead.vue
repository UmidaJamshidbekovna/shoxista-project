<script setup lang="ts">
// Bo'lim sarlavhasi 16px / 800 + ixtiyoriy "Barchasi" havolasi
defineProps<{ title: string, to?: string, action?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <h2 class="text-base font-extrabold text-ink">{{ title }}</h2>
    <NuxtLink v-if="to" :to="to" class="text-[13px] font-bold text-brand">{{ action ?? 'Barchasi' }}</NuxtLink>
    <button v-else-if="action" type="button" class="text-[13px] font-bold text-brand" @click="$emit('action')">{{ action }}</button>
  </div>
</template>
