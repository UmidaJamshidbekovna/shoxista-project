<script setup lang="ts">
import type { Product } from '~/data/types'

// Shtrix-kod: Telegram'dan tashqarida kodni qo'lda kiritish (yoki USB skaner bilan yozish)
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ found: [p: Product] }>()
const { findByCode } = usePos()
const { products } = useStore()

const code = ref('')
const error = ref('')
const added = ref<{ name: string, emoji: string, t: string }[]>([])
const samples = computed(() => products.value.filter(p => p.stock > 0).slice(0, 3))

watch(open, (v) => { if (v) { code.value = ''; error.value = ''; added.value = [] } })
watch(code, () => { error.value = '' })

function submit(v = code.value) {
  const c = v.trim()
  if (!c) return (error.value = 'Kodni kiriting')
  if (!/^[\dA-Za-z-]{3,20}$/.test(c)) return (error.value = 'Kod faqat raqam, harf va "-" dan iborat bo\'lishi kerak')
  const p = findByCode(c)
  if (!p) return (error.value = 'Bu kod bilan mahsulot topilmadi')
  if (p.stock <= 0) return (error.value = `${p.name} — omborda qolmagan`)
  emit('found', p)
  added.value = [{ name: p.name, emoji: p.emoji, t: uid('scan') }, ...added.value].slice(0, 4)
  code.value = ''
}
</script>

<template>
  <BSheet v-model="open" title="Shtrix-kod">
    <div class="flex flex-col gap-4">
      <div class="relative flex h-36 items-center justify-center overflow-hidden rounded-[22px] bg-ink-2">
        <div class="absolute inset-6 rounded-2xl border-2 border-dashed border-white/25" />
        <div class="pos-scanline absolute inset-x-8 h-0.5 rounded-full bg-[#4ade80] shadow-[0_0_12px_#4ade80]" />
        <div class="relative flex flex-col items-center gap-1 text-white/80">
          <AppIcon name="barcode" :size="34" />
          <span class="text-xs font-bold">Kamera faqat Telegram ilovasida ishlaydi</span>
        </div>
      </div>

      <form class="flex items-end gap-2" @submit.prevent="submit()">
        <div class="grow">
          <BInput v-model="code" label="Kodni qo'lda kiriting" placeholder="4780001000011 yoki GR-001" icon="barcode" inputmode="text" :error="error" :maxlength="20" />
        </div>
      </form>
      <div class="flex flex-wrap gap-2">
        <span class="w-full text-xs font-semibold text-muted">Demo kodlar:</span>
        <button
          v-for="p in samples" :key="p.id" type="button"
          class="h-8 rounded-full bg-card px-3 text-xs font-bold text-muted-2 shadow-card"
          @click="submit(p.barcode)"
        >
          {{ p.emoji }} {{ p.barcode }}
        </button>
      </div>

      <div v-if="added.length" class="flex flex-col gap-1.5">
        <span class="text-xs font-bold text-muted-2">Qo'shildi</span>
        <div v-for="a in added" :key="a.t" class="animate-fade-in flex items-center gap-2 rounded-2xl bg-soft-2 px-3 py-2 text-[13px] font-bold text-brand">
          <AppIcon name="check" :size="16" /> {{ a.emoji }} {{ a.name }}
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2">
        <PillButton variant="field" class="basis-1/3" @click="open = false">Yopish</PillButton>
        <PillButton block icon="plus" :disabled="!code.trim()" @click="submit()">Qo'shish</PillButton>
      </div>
    </template>
  </BSheet>
</template>

<style scoped>
.pos-scanline { animation: pos-scan 1.8s ease-in-out infinite alternate; }
@keyframes pos-scan { from { top: 22%; } to { top: 76%; } }
</style>
