<script setup lang="ts">
// O'chirish kabi qaytarib bo'lmaydigan amallarni tasdiqlash
defineProps<{ title: string, text?: string, confirm?: string }>()
const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>({ default: false })
const { haptic } = useTelegram()
function ok() {
  haptic('medium')
  open.value = false
  emit('confirm')
}
</script>

<template>
  <BSheet v-model="open">
    <div class="flex flex-col items-center gap-2 pt-4 pb-2 text-center">
      <span class="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="trash" :size="28" /></span>
      <h2 class="mt-2 text-lg font-extrabold">{{ title }}</h2>
      <p v-if="text" class="text-sm font-medium text-muted">{{ text }}</p>
    </div>
    <template #footer>
      <div class="flex gap-3">
        <PillButton variant="field" class="grow basis-0" @click="open = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" icon="trash" @click="ok">{{ confirm ?? 'O\'chirish' }}</PillButton>
      </div>
    </template>
  </BSheet>
</template>
