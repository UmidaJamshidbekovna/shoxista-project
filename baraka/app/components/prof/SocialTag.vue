<script setup lang="ts">
// Holat tegi (Profile.md §7): 10.5/800 UPPERCASE; Ulangan #e7f7ec/#15803d, Ulanmagan #f1f3f6/#8b9099
defineProps<{ on: boolean }>()
</script>

<template>
  <span
    class="shrink-0 rounded-full px-2 py-1 text-[10.5px] font-extrabold tracking-[0.04em] uppercase"
    :class="on ? 'bg-[#e7f7ec] text-[#15803d]' : 'bg-field text-muted'"
  >{{ on ? 'Ulangan' : 'Ulanmagan' }}</span>
</template>
