<script setup lang="ts">
import type { Customer } from '~/data/types'

// Mijoz tanlash yoki joyida yaratish
const open = defineModel<boolean>({ default: false })
const props = defineProps<{ selectedId?: string }>()
const emit = defineEmits<{ select: [id: string | undefined] }>()
const { customers } = useStore()
const { show } = useToast()

const mode = ref<'list' | 'create'>('list')
const q = ref('')
const name = ref('')
const phone = ref('+998 ')
const touched = ref(false)

watch(open, (v) => {
  if (v) { mode.value = 'list'; q.value = ''; name.value = ''; phone.value = '+998 '; touched.value = false }
})
watch(phone, (v) => {
  const f = formatUzPhone(v, { keepPrefix: true })
  if (f !== v) phone.value = f
})

const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  const digits = s.replace(/\D/g, '')
  return customers.value.filter(c => !s
    || c.name.toLowerCase().includes(s)
    || (digits.length >= 2 && c.phone.replace(/\D/g, '').includes(digits)))
})

const nameError = computed(() => {
  const n = name.value.trim()
  if (!n) return 'Ismni kiriting'
  if (n.length < 2) return 'Ism juda qisqa'
  if (/\d/.test(n)) return 'Ismda raqam bo\'lmasin'
  return ''
})
const phoneError = computed(() => {
  if (!isUzPhone(phone.value)) return 'Format: +998 90 123 45 67'
  if (customers.value.some(c => c.phone === phone.value)) return 'Bu raqam bilan mijoz allaqachon bor'
  return ''
})
const valid = computed(() => !nameError.value && !phoneError.value)

function pick(c: Customer) {
  emit('select', c.id)
  open.value = false
}
function startCreate() {
  mode.value = 'create'
  const s = q.value.trim()
  if (s && /\d/.test(s)) phone.value = formatUzPhone(s, { keepPrefix: true })
  else if (s) name.value = s.replace(/\b\w/g, m => m.toUpperCase())
}
function create() {
  touched.value = true
  if (!valid.value) return
  const c: Customer = {
    id: uid('u'), name: name.value.trim(), phone: phone.value, debt: 0, totalSpent: 0, purchases: 0,
    lastVisit: new Date().toISOString(), channel: 'offline',
  }
  customers.value = [c, ...customers.value]
  show('Mijoz yaratildi')
  pick(c)
}

function debtText(c: Customer) {
  if (c.debt > 0) return { text: `Qarz ${formatSom(c.debt)}`, tone: 'danger' as const }
  if (c.debt < 0) return { text: `Balans ${formatSom(-c.debt)}`, tone: 'brand' as const }
  return null
}
</script>

<template>
  <BSheet v-model="open" :title="mode === 'list' ? 'Mijoz tanlash' : 'Yangi mijoz'" :full="mode === 'list'">
    <div v-if="mode === 'list'" class="flex flex-col gap-3">
      <BInput v-model="q" placeholder="Ism yoki telefon" icon="search" inputmode="search" />
      <button type="button" class="flex items-center gap-3 rounded-[18px] bg-soft px-3 py-3 text-left" @click="startCreate">
        <span class="flex size-10 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="plus" /></span>
        <span class="grow">
          <span class="block text-[15px] font-extrabold text-brand">Yangi mijoz yaratish</span>
          <span class="block text-xs font-semibold text-muted-2">{{ q.trim() ? `«${q.trim()}» bilan` : 'Ism va telefon raqami' }}</span>
        </span>
      </button>
      <div class="card px-3">
        <ListRow
          v-for="c in list" :key="c.id" :title="c.name" :subtitle="c.phone" :chevron="false" @click="pick(c)"
        >
          <template #start><Avatar :name="c.name" :size="40" /></template>
          <template #end>
            <Badge v-if="debtText(c)" :tone="debtText(c)!.tone">{{ debtText(c)!.text }}</Badge>
            <span v-if="c.id === props.selectedId" class="flex size-6 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="check" :size="14" :stroke="3" /></span>
          </template>
        </ListRow>
        <EmptyState v-if="!list.length" icon="users" title="Mijoz topilmadi" text="Yangi mijoz sifatida qo'shing" />
      </div>
    </div>

    <form v-else class="flex flex-col gap-3" @submit.prevent="create" @focusout="touched = true">
      <BInput v-model="name" label="Ism familiya" placeholder="Masalan: Aziza Karimova" icon="user" :error="touched && nameError" :maxlength="60" />
      <BInput v-model="phone" label="Telefon" placeholder="+998 90 123 45 67" icon="phone" inputmode="tel" :error="touched && phoneError" :maxlength="17" hint="Mijozga chek va qarz eslatmasi shu raqamga yuboriladi" />
    </form>

    <template #footer>
      <PillButton v-if="mode === 'list'" block variant="field" :disabled="!props.selectedId" @click="emit('select', undefined); open = false">
        Mijozsiz davom etish
      </PillButton>
      <div v-else class="flex gap-2">
        <PillButton variant="field" class="basis-1/3" @click="mode = 'list'">Orqaga</PillButton>
        <PillButton block icon="check" :disabled="!valid" @click="create">Saqlash</PillButton>
      </div>
    </template>
  </BSheet>
</template>
