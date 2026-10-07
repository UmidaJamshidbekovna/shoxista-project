<script setup lang="ts">
// Kalit–qiymat qatori (Profile.md §0): padding 13px 0, chegara #f0f1f4; kalit 13px #8b9099; qiymat 13.5/800 ellipsis
defineProps<{ k: string, v?: string, chevron?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="chevron ? 'button' : 'div'" :type="chevron ? 'button' : undefined"
    class="flex w-full items-center gap-3 border-b border-[#f0f1f4] py-[13px] text-left last:border-b-0"
    @click="$emit('click')"
  >
    <span class="shrink-0 text-[13px] text-muted">{{ k }}</span>
    <span class="min-w-0 grow truncate text-right text-[13.5px] font-extrabold text-ink"><slot>{{ v || '—' }}</slot></span>
    <AppIcon v-if="chevron" name="chevron-right" :size="16" :stroke="2.2" class="-mr-0.5 shrink-0 text-[#a3a8b0]" />
  </component>
</template>
