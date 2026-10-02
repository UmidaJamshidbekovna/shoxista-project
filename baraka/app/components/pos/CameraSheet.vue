<script setup lang="ts">
import type { PosDetected } from '~/composables/usePos'

// AI kamera: rasmdan mahsulotlarni aniqlash (demo — natija simulyatsiya qilinadi)
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ confirm: [items: PosDetected[]] }>()
const { products } = useStore()
const { haptic } = useTelegram()

const stage = ref<'idle' | 'analyzing' | 'done'>('idle')
const photo = ref<string>()
const items = ref<PosDetected[]>([])
const progress = ref(0)
const fileInput = ref<HTMLInputElement>()
let timer: ReturnType<typeof setInterval> | undefined

watch(open, (v) => {
  if (v) { stage.value = 'idle'; photo.value = undefined; items.value = [] }
  else clearInterval(timer)
})
onBeforeUnmount(() => clearInterval(timer))

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) return
  if (photo.value) URL.revokeObjectURL(photo.value)
  photo.value = URL.createObjectURL(f)
  analyze()
}

function analyze() {
  haptic('medium')
  stage.value = 'analyzing'
  progress.value = 0
  clearInterval(timer)
  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 7 + Math.random() * 9)
    if (progress.value >= 100) {
      clearInterval(timer)
      const pool = [...products.value].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2))
      items.value = pool.map(p => ({
        productId: p.id,
        qty: 1 + Math.floor(Math.random() * 2),
        confidence: 86 + Math.floor(Math.random() * 13),
        on: p.stock > 0,
      }))
      stage.value = 'done'
    }
  }, 140)
}

const selected = computed(() => items.value.filter(i => i.on))
function confirm() {
  emit('confirm', selected.value)
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="AI kamera">
    <div class="flex flex-col gap-4">
      <div class="relative flex h-48 items-center justify-center overflow-hidden rounded-[22px] bg-ink-2">
        <img v-if="photo" :src="photo" alt="Olingan rasm" class="absolute inset-0 size-full object-cover" :class="stage === 'analyzing' && 'opacity-70'">
        <div v-else class="flex flex-col items-center gap-2 px-6 text-center text-white/80">
          <AppIcon name="camera" :size="34" />
          <span class="text-[13px] font-bold">Mahsulotlarni kadrga joylashtiring</span>
          <span class="text-xs font-medium text-white/55">AI bir nechta mahsulotni bir vaqtda aniqlaydi</span>
        </div>
        <template v-if="stage !== 'done'">
          <span v-for="c in ['top-4 left-4 border-t-3 border-l-3', 'top-4 right-4 border-t-3 border-r-3', 'bottom-4 left-4 border-b-3 border-l-3', 'bottom-4 right-4 border-b-3 border-r-3']" :key="c" class="absolute size-7 rounded-md border-[#4ade80]" :class="c" />
        </template>
        <div v-if="stage === 'analyzing'" class="pos-sweep absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#4ade80]/35 to-transparent" />
        <div v-if="stage === 'analyzing'" class="absolute inset-x-4 bottom-4 flex flex-col gap-1.5">
          <span class="flex items-center gap-1.5 text-xs font-bold text-white"><AppIcon name="sparkle" :size="14" /> Tahlil qilinmoqda... {{ Math.round(progress) }}%</span>
          <span class="h-1.5 overflow-hidden rounded-full bg-white/20"><span class="block h-full rounded-full bg-[#4ade80] transition-all" :style="{ width: `${progress}%` }" /></span>
        </div>
        <span v-if="stage === 'done'" class="absolute top-3 left-3"><Badge tone="solid"><AppIcon name="sparkle" :size="12" /> {{ items.length }} ta mahsulot aniqlandi</Badge></span>
      </div>

      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile">

      <template v-if="stage === 'done'">
        <SectionHead title="Natijani tasdiqlang" />
        <PosDetectedList v-model="items" />
        <button type="button" class="self-center text-[13px] font-bold text-brand" @click="analyze">Qayta tahlil qilish</button>
      </template>
      <p v-else-if="stage === 'idle'" class="text-center text-xs font-medium text-muted">
        Rasm oling yoki galereyadan tanlang. Demo rejimda natija namunaviy bo'ladi.
      </p>
    </div>
    <template #footer>
      <PillButton v-if="stage === 'done'" block icon="check" :disabled="!selected.length" @click="confirm">
        Savatga qo'shish ({{ selected.length }})
      </PillButton>
      <div v-else class="flex gap-2">
        <PillButton variant="field" icon="image" class="basis-2/5" :disabled="stage === 'analyzing'" @click="fileInput?.click()">Galereya</PillButton>
        <PillButton block icon="camera" :disabled="stage === 'analyzing'" @click="analyze">
          {{ stage === 'analyzing' ? 'Aniqlanmoqda...' : 'Rasmga olish' }}
        </PillButton>
      </div>
    </template>
  </BSheet>
</template>

<style scoped>
.pos-sweep { animation: pos-sweep 1.2s linear infinite; }
@keyframes pos-sweep { from { top: -20%; } to { top: 100%; } }
</style>
