<script setup lang="ts">
import type { Category } from '~/data/types'

const store = useStore()
const { show } = useToast()
const { haptic, selection } = useTelegram()

const sorted = computed(() => [...store.categories.value].sort((a, b) => a.order - b.order))
const countOf = (id: string) => store.products.value.filter(p => p.categoryId === id).length

// --- Drag-and-drop (pointer events: sichqoncha va sensor ekran) ---
const GAP = 10
const drag = reactive({ id: '', from: -1, to: -1, dy: 0, startY: 0, h: 0 })
const settling = ref(false)

function onDown(e: PointerEvent, idx: number) {
  const handle = e.currentTarget as HTMLElement
  const row = handle.closest('[data-row]') as HTMLElement | null
  if (!row) return
  e.preventDefault()
  try { handle.setPointerCapture(e.pointerId) }
  catch {}
  Object.assign(drag, { id: sorted.value[idx]!.id, from: idx, to: idx, dy: 0, startY: e.clientY, h: row.getBoundingClientRect().height + GAP })
  haptic('light')
}
function onMove(e: PointerEvent) {
  if (!drag.id) return
  const n = sorted.value.length
  const min = -drag.from * drag.h - 12
  const max = (n - 1 - drag.from) * drag.h + 12
  drag.dy = Math.max(min, Math.min(max, e.clientY - drag.startY))
  const to = Math.max(0, Math.min(n - 1, drag.from + Math.round(drag.dy / drag.h)))
  if (to !== drag.to) {
    drag.to = to
    selection()
  }
}
function onUp() {
  if (!drag.id) return
  const { from, to } = drag
  settling.value = true
  if (from !== to) {
    const arr = [...sorted.value]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved!)
    arr.forEach((c, i) => { c.order = i + 1 })
    haptic('medium')
    show('Tartib saqlandi')
  }
  Object.assign(drag, { id: '', from: -1, to: -1, dy: 0 })
  requestAnimationFrame(() => requestAnimationFrame(() => { settling.value = false }))
}
function rowStyle(idx: number) {
  if (settling.value) return { transition: 'none' }
  if (!drag.id) return {}
  if (idx === drag.from) return { transform: `translateY(${drag.dy}px) scale(1.02)`, transition: 'none', zIndex: 10 }
  if (drag.from < drag.to && idx > drag.from && idx <= drag.to) return { transform: `translateY(${-drag.h}px)` }
  if (drag.from > drag.to && idx >= drag.to && idx < drag.from) return { transform: `translateY(${drag.h}px)` }
  return {}
}

// --- Yaratish / tahrirlash ---
const formOpen = ref(false)
const editing = ref<Category | null>(null)
const name = ref('')
const color = ref(INV_CATEGORY_COLORS[0]!)
const nameDirty = ref(false)
const deleteOpen = ref(false)

function openCreate() {
  editing.value = null
  name.value = ''
  color.value = INV_CATEGORY_COLORS[store.categories.value.length % INV_CATEGORY_COLORS.length]!
  nameDirty.value = false
  formOpen.value = true
}
function openEdit(c: Category) {
  if (drag.id) return
  editing.value = c
  name.value = c.name
  color.value = c.color
  nameDirty.value = false
  formOpen.value = true
}

const nameError = computed(() => {
  const v = name.value.trim()
  if (!v) return 'Kategoriya nomini kiriting'
  if (v.length < 2) return 'Nom juda qisqa'
  if (store.categories.value.some(c => c.id !== editing.value?.id && c.name.toLowerCase() === v.toLowerCase())) return 'Bunday kategoriya allaqachon bor'
  return ''
})

function save() {
  if (nameError.value) return
  if (editing.value) {
    editing.value.name = name.value.trim()
    editing.value.color = color.value
    show('Kategoriya saqlandi')
  }
  else {
    const order = Math.max(0, ...store.categories.value.map(c => c.order)) + 1
    store.categories.value = [...store.categories.value, { id: `c${Date.now()}`, name: name.value.trim(), color: color.value, order }]
    show('Kategoriya qo\'shildi')
  }
  haptic('medium')
  formOpen.value = false
}

const editingCount = computed(() => editing.value ? countOf(editing.value.id) : 0)
function remove() {
  const c = editing.value
  if (!c || editingCount.value) return
  store.categories.value = store.categories.value.filter(x => x.id !== c.id)
  sorted.value.forEach((x, i) => { x.order = i + 1 })
  deleteOpen.value = false
  formOpen.value = false
  haptic('heavy')
  show('Kategoriya o\'chirildi')
}
</script>

<template>
  <PageHeader title="Kategoriyalar" :subtitle="`${sorted.length} ta kategoriya`" back="/ombor">
    <RoundButton icon="plus" label="Yangi kategoriya" variant="brand" @click="openCreate" />
  </PageHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-6">
    <div class="flex items-center gap-2 rounded-2xl bg-soft px-3.5 py-2.5 text-xs font-semibold text-muted-2">
      <AppIcon name="drag" :size="16" class="shrink-0 text-brand" />
      Tartibni o'zgartirish uchun chapdagi tutqichni bosib turib suring. Shu tartib POS va do'konda ko'rinadi.
    </div>

    <div class="relative flex flex-col" :style="{ gap: `${GAP}px` }">
      <div
        v-for="(c, idx) in sorted" :key="c.id" data-row
        class="card relative flex items-center gap-3 py-3 pr-3 pl-1 transition-[transform,box-shadow] duration-200"
        :class="drag.id === c.id && 'shadow-float'"
        :style="rowStyle(idx)"
      >
        <button
          type="button" aria-label="Surib tartiblash"
          class="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-muted active:cursor-grabbing"
          @pointerdown="onDown($event, idx)" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
        >
          <AppIcon name="drag" :size="20" />
        </button>
        <button type="button" class="flex min-w-0 grow items-center gap-3 text-left" @click="openEdit(c)">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white" :style="{ background: c.color }">
            {{ c.name.slice(0, 1).toUpperCase() }}
          </span>
          <span class="min-w-0 grow">
            <span class="block truncate text-[15px] font-extrabold">{{ c.name }}</span>
            <span class="block text-xs font-semibold text-muted">{{ countOf(c.id) }} ta mahsulot</span>
          </span>
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-field text-muted-2"><AppIcon name="edit" :size="16" /></span>
        </button>
      </div>
    </div>

    <EmptyState v-if="!sorted.length" icon="tag" title="Kategoriyalar yo'q" text="Mahsulotlarni guruhlash uchun kategoriya yarating">
      <PillButton size="sm" variant="soft" icon="plus" class="mt-2" @click="openCreate">Kategoriya qo'shish</PillButton>
    </EmptyState>
  </div>

  <BSheet v-model="formOpen" :title="editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3 rounded-[20px] bg-card p-3 shadow-card">
        <span class="flex size-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white transition-colors" :style="{ background: color }">
          {{ (name.trim() || '?').slice(0, 1).toUpperCase() }}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-[15px] font-extrabold">{{ name.trim() || 'Kategoriya nomi' }}</span>
          <span class="block text-xs font-semibold text-muted">{{ editing ? `${editingCount} ta mahsulot` : 'Ko\'rinish namunasi' }}</span>
        </span>
      </div>

      <BInput v-model="name" label="Nomi *" placeholder="Masalan: Non mahsulotlari" :maxlength="30" :error="nameDirty && nameError" @input="nameDirty = true" />

      <div class="flex flex-col gap-2">
        <span class="text-[13px] font-bold text-muted-2">Rang</span>
        <div class="grid grid-cols-6 gap-2.5">
          <button
            v-for="col in INV_CATEGORY_COLORS" :key="col" type="button" :aria-label="`Rang ${col}`"
            class="flex aspect-square items-center justify-center rounded-full text-white transition-transform active:scale-90"
            :class="color === col && 'ring-4 ring-offset-2 ring-offset-app'"
            :style="{ background: col, '--tw-ring-color': `${col}55` }"
            @click="color = col; selection()"
          >
            <AppIcon v-if="color === col" name="check" :size="18" :stroke="3" />
          </button>
        </div>
      </div>

      <button
        v-if="editing" type="button"
        class="flex items-center gap-2 self-start rounded-full px-1 text-[13px] font-extrabold text-danger disabled:text-muted"
        :disabled="editingCount > 0" @click="deleteOpen = true"
      >
        <AppIcon name="trash" :size="16" />Kategoriyani o'chirish
      </button>
      <p v-if="editing && editingCount > 0" class="-mt-3 text-xs font-medium text-muted">
        Bu kategoriyada {{ editingCount }} ta mahsulot bor. Avval ularni boshqa kategoriyaga o'tkazing.
      </p>
    </div>
    <template #footer>
      <PillButton block :disabled="!!nameError" @click="save">{{ editing ? 'Saqlash' : 'Qo\'shish' }}</PillButton>
    </template>
  </BSheet>

  <BSheet v-model="deleteOpen" title="Kategoriyani o'chirish">
    <div class="flex flex-col items-center gap-2 py-2 text-center">
      <span class="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="trash" :size="28" /></span>
      <p class="text-[15px] font-extrabold">"{{ editing?.name }}" o'chirilsinmi?</p>
      <p class="text-[13px] font-medium text-muted">Bu amalni qaytarib bo'lmaydi.</p>
    </div>
    <template #footer>
      <div class="flex gap-3">
        <PillButton variant="field" class="grow basis-0" @click="deleteOpen = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" icon="trash" @click="remove">O'chirish</PillButton>
      </div>
    </template>
  </BSheet>
</template>
