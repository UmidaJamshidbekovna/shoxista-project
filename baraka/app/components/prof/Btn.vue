<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

// Tugmalar (Profile.md §0): primary 54px #05472a/oq 15/800; danger 50px #fdecec/#d93036 14/800;
// soft 50px #e6efe9/#05472a 14/800. `dim` — xato holatida opacity .45 (bosilsa ham ishlaydi)
withDefaults(defineProps<{ variant?: 'primary' | 'danger' | 'soft', icon?: IconName, dim?: boolean }>(), { variant: 'primary' })
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-2 rounded-full font-extrabold whitespace-nowrap transition-[transform,opacity] duration-200 active:scale-[0.98]"
    :class="[
      {
        'h-[54px] bg-brand text-[15px] text-white': variant === 'primary',
        'h-[50px] bg-[#fdecec] text-[14px] text-[#d93036]': variant === 'danger',
        'h-[50px] bg-soft text-[14px] text-brand': variant === 'soft',
      },
      dim && 'opacity-45',
    ]"
  >
    <AppIcon v-if="icon" :name="icon" :size="18" :stroke="2" />
    <slot />
  </button>
</template>
