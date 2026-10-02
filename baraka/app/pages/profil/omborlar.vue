<script setup lang="ts">
import type { Warehouse } from '~/data/types'

const store = useStore()
const { warehouses, branches, employees, products } = store
const { show } = useToast()
const { selection } = useTelegram()

const stats = (id: string) => {
  const list = products.value.filter(p => p.warehouseId === id)
  return { count: list.length, units: list.reduce((s, p) => s + Math.max(0, p.stock), 0), low: list.filter(p => store.stockState(p) !== 'ok').length }
}

const open = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', branchId: '', address: '', manager: '' })

function startEdit(w?: Warehouse) {
  selection()
  editId.value = w?.id ?? null
  Object.assign(form, w ? { name: w.name, branchId: w.branchId, address: w.address, manager: w.manager } : { name: '', branchId: branches.value[0]?.id ?? '', address: '', manager: '' })
  open.value = true
}

const errors = computed(() => ({
  name: form.name.trim().length < 2 ? 'Ombor nomini kiriting' : '',
  branchId: form.branchId ? '' : 'Filialni tanlang',
  address: form.address.trim().length < 5 ? 'Manzilni kiriting' : '',
  manager: form.manager ? '' : 'Mas\'ul shaxsni tanlang',
}))
const e = (k: keyof typeof errors.value) => (form[k] !== '' ? errors.value[k] : '')
const valid = computed(() => Object.values(errors.value).every(x => !x))

const branchOptions = computed(() => branches.value.map(b => ({ value: b.id, label: b.name })))
const managerOptions = computed(() => {
  const names = employees.value.filter(x => x.active).map(x => x.name)
  if (form.manager && !names.includes(form.manager)) names.push(form.manager)
  return names.map(n => ({ value: n, label: n }))
})

function useBranchAddress() {
  const b = store.branchById(form.branchId)
  if (b) form.address = b.address
}

function save() {
  if (!valid.value) return
  const data = { name: form.name.trim(), branchId: form.branchId, address: form.address.trim(), manager: form.manager }
  if (editId.value) {
    const w = warehouses.value.find(x => x.id === editId.value)
    if (w) Object.assign(w, data)
    show('Ombor saqlandi')
  }
  else {
    warehouses.value = [...warehouses.value, { id: `w${Date.now()}`, ...data }]
    show('Yangi ombor qo\'shildi')
  }
  open.value = false
}
</script>

<template>
  <PageHeader title="Omborlar" :subtitle="`${warehouses.length} ta ombor`" back="/profil">
    <RoundButton icon="plus" label="Ombor qo'shish" variant="brand" @click="startEdit()" />
  </PageHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3 overflow-y-auto px-5 pb-6">
    <button v-for="w in warehouses" :key="w.id" type="button" class="card flex flex-col gap-3 p-4 text-left active:scale-[0.99]" @click="startEdit(w)">
      <div class="flex items-center gap-3">
        <Avatar icon="warehouse" :size="44" color="#1d5bd8" />
        <div class="min-w-0 grow">
          <p class="truncate text-[15px] font-extrabold">{{ w.name }}</p>
          <p class="truncate text-xs font-medium text-muted">{{ store.branchById(w.branchId)?.name ?? '—' }}</p>
        </div>
        <AppIcon name="edit" :size="18" class="text-muted" />
      </div>
      <div class="flex flex-col gap-1.5 text-xs font-semibold text-muted-2">
        <span class="flex items-center gap-1.5"><AppIcon name="map-pin" :size="14" class="shrink-0 text-muted" /><span class="truncate">{{ w.address }}</span></span>
        <span class="flex items-center gap-1.5"><AppIcon name="user" :size="14" class="shrink-0 text-muted" />{{ w.manager }}</span>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-2xl bg-field px-3 py-2">
          <p class="text-[17px] font-extrabold">{{ stats(w.id).count }}</p>
          <p class="text-[11px] font-bold text-muted">mahsulot</p>
        </div>
        <div class="rounded-2xl bg-field px-3 py-2">
          <p class="text-[17px] font-extrabold">{{ formatSom(stats(w.id).units) }}</p>
          <p class="text-[11px] font-bold text-muted">birlik</p>
        </div>
        <div class="rounded-2xl px-3 py-2" :class="stats(w.id).low ? 'bg-warn-soft text-warn' : 'bg-field'">
          <p class="text-[17px] font-extrabold">{{ stats(w.id).low }}</p>
          <p class="text-[11px] font-bold" :class="stats(w.id).low ? 'text-warn' : 'text-muted'">kam qolgan</p>
        </div>
      </div>
    </button>

    <EmptyState v-if="!warehouses.length" icon="warehouse" title="Omborlar yo'q" text="Birinchi omboringizni qo'shing" />
  </div>

  <BSheet v-model="open" :title="editId ? 'Omborni tahrirlash' : 'Yangi ombor'">
    <div class="flex flex-col gap-3.5">
      <BInput v-model="form.name" label="Ombor nomi" placeholder="Masalan: Asosiy ombor" icon="warehouse" :error="e('name')" />
      <ProfSelect v-model="form.branchId" label="Filial" placeholder="Filialni tanlang" icon="store" :options="branchOptions" :error="e('branchId')" />
      <BInput v-model="form.address" label="Manzil" placeholder="Ombor manzili" icon="map-pin" :error="e('address')">
        <template #end>
          <button v-if="form.branchId" type="button" class="shrink-0 text-xs font-extrabold text-brand" @click.prevent="useBranchAddress">Filialniki</button>
        </template>
      </BInput>
      <ProfSelect v-model="form.manager" label="Mas'ul shaxs" placeholder="Xodimni tanlang" icon="user" :options="managerOptions" :error="e('manager')" />
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!valid" @click="save">{{ editId ? 'Saqlash' : 'Qo\'shish' }}</PillButton>
    </template>
  </BSheet>
</template>
