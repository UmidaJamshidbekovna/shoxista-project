<script setup lang="ts">
// Avatar (Profile.md §1.2, §2, §6): doira #dfe7f1, bosh harflar 800. `upload` — rasm yuklash sloti
const props = withDefaults(defineProps<{
  name: string
  src?: string
  size?: number
  font?: number
  upload?: boolean
  /** Doira o'rniga kvadrat burchak radiusi (logo uchun) */
  radius?: number
  bg?: string
  color?: string
}>(), { size: 46, bg: '#dfe7f1', color: '#121212' })
const emit = defineEmits<{ pick: [dataUrl: string] }>()
const input = ref<HTMLInputElement>()
const { show } = useToast()
const r = computed(() => props.radius != null ? `${props.radius}px` : '9999px')

async function onFile(e: Event) {
  const el = e.target as HTMLInputElement
  const f = el.files?.[0]
  el.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) return show('Rasm faylini tanlang', 'error')
  emit('pick', await profReadImage(f))
}
</script>

<template>
  <component
    :is="upload ? 'button' : 'span'" :type="upload ? 'button' : undefined" :aria-label="upload ? 'Rasm yuklash' : undefined"
    class="relative flex shrink-0 items-center justify-center font-extrabold"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: r, fontSize: `${props.font ?? Math.round(size * 0.32)}px`, background: bg, color }"
    @click="upload && input?.click()"
  >
    <img v-if="src" :src="src" alt="" class="size-full object-cover" :style="{ borderRadius: r }">
    <template v-else>{{ profInitials(name) }}</template>
    <span v-if="upload" class="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-card bg-brand text-white">
      <AppIcon name="camera" :size="14" :stroke="2.2" />
    </span>
    <input v-if="upload" ref="input" type="file" accept="image/*" class="hidden" @change="onFile">
  </component>
</template>
