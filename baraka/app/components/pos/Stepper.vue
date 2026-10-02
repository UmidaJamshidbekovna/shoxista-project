<script setup lang="ts">
// Miqdor boshqaruvi: − qty +
const props = withDefaults(defineProps<{ max?: number, min?: number, size?: 'sm' | 'md' }>(), { min: 0, size: 'md' })
const qty = defineModel<number>({ required: true })
const emit = defineEmits<{ limit: [] }>()
const { selection } = useTelegram()

function step(d: number) {
  const n = qty.value + d
  if (n < props.min) return
  if (props.max !== undefined && n > props.max) return emit('limit')
  selection()
  qty.value = n
}
</script>

<template>
  <div class="flex shrink-0 items-center rounded-full bg-field p-1" :class="size === 'sm' ? 'gap-1' : 'gap-2'">
    <button
      type="button" aria-label="Kamaytirish" class="flex items-center justify-center rounded-full bg-card text-ink shadow-card transition active:scale-90 disabled:opacity-40"
      :class="size === 'sm' ? 'size-7' : 'size-9'" :disabled="qty <= min" @click.stop="step(-1)"
    >
      <AppIcon :name="qty <= 1 && min === 0 ? 'trash' : 'minus'" :size="size === 'sm' ? 14 : 16" />
    </button>
    <span class="min-w-6 text-center font-extrabold" :class="size === 'sm' ? 'text-[13px]' : 'text-[15px]'">{{ qty }}</span>
    <button
      type="button" aria-label="Ko'paytirish" class="flex items-center justify-center rounded-full bg-brand text-white transition active:scale-90"
      :class="[size === 'sm' ? 'size-7' : 'size-9', max !== undefined && qty >= max && 'opacity-40']" @click.stop="step(1)"
    >
      <AppIcon name="plus" :size="size === 'sm' ? 14 : 16" />
    </button>
  </div>
</template>
