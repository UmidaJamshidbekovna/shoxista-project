<script setup lang="ts">
// Xodim sheet (Profile.md §6): "Yangi xodim" / "Xodimni tahrirlash" — ism, telefon, lavozim (bitta chip), ruxsatlar (ko'p chip)
import type { Role } from '~/data/types'
import { permissionList, roleLabel } from '~/data/labels'

const props = defineProps<{ employeeId?: string }>()
const open = defineModel<boolean>({ default: false })
const store = useStore()
const { employees } = store
const { show } = useToast()

type StaffRole = Exclude<Role, 'owner'>
const ROLES: StaffRole[] = ['cashier', 'storekeeper', 'courier', 'manager']
const roleOpts = ROLES.map(r => ({ value: r, label: roleLabel[r] }))
const permOpts = permissionList.map(p => ({ value: p.id, label: p.label }))

const editing = computed(() => employees.value.find(e => e.id === props.employeeId))

/** sf — forma, sfErr — xato */
const sf = reactive({ name: '', phone: '', role: 'cashier' as StaffRole, permissions: ['kassa'] as string[] })
const sfErr = ref('')

watch(open, (v) => {
  if (!v) return
  sfErr.value = ''
  const e = editing.value
  if (e && e.role !== 'owner') Object.assign(sf, { name: e.name, phone: e.phone, role: e.role, permissions: [...e.permissions] })
  else Object.assign(sf, { name: '', phone: '', role: 'cashier', permissions: ['kassa'] })
}, { immediate: true })

watch(() => [sf.name, sf.phone, sf.permissions.length], () => { sfErr.value = '' }, { flush: 'sync' })

function save() {
  if (!sf.name.trim() || !profPhoneValid(sf.phone)) {
    sfErr.value = 'Ism va telefon raqamni kiriting'
    return
  }
  if (!sf.permissions.length) {
    sfErr.value = 'Kamida bitta ruxsat tanlang'
    return
  }
  const data = { name: sf.name.trim(), phone: profFormatPhone(sf.phone), role: sf.role, permissions: [...sf.permissions] }
  if (editing.value) {
    employees.value = employees.value.map(e => e.id === editing.value!.id ? { ...e, ...data } : e)
    show('Saqlandi')
  }
  else {
    employees.value = [...employees.value, { ...data, id: `e${Date.now()}`, branchId: store.currentBranchId.value, active: true }]
    show('Xodim qo\'shildi')
  }
  open.value = false
}

function remove() {
  if (!editing.value) return
  employees.value = employees.value.filter(e => e.id !== editing.value!.id)
  show('Xodim o\'chirildi')
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" :title="editing ? 'Xodimni tahrirlash' : 'Yangi xodim'" tone="card">
    <div class="grid gap-4 pb-1">
      <ProfField v-model="sf.name" label="Ism familiya" placeholder="Masalan: Nodira Yusupova" />
      <ProfField v-model="sf.phone" label="Telefon" type="tel" inputmode="tel" placeholder="+998 __ ___ __ __" />
      <div class="grid gap-2">
        <span class="text-[12.5px] font-bold text-[#5b616b]">Lavozim</span>
        <ProfChips v-model="sf.role" :options="roleOpts" />
      </div>
      <div class="grid gap-2">
        <span class="text-[12.5px] font-bold text-[#5b616b]">Ruxsatlar</span>
        <ProfChips v-model="sf.permissions" :options="permOpts" multiple />
      </div>
      <ProfError v-if="sfErr">{{ sfErr }}</ProfError>
    </div>
    <template #footer>
      <div class="flex gap-2.5">
        <ProfBtn v-if="editing" variant="danger" icon="trash" class="h-[54px]! flex-1" @click="remove">O'chirish</ProfBtn>
        <ProfBtn class="flex-1" @click="save">Saqlash</ProfBtn>
      </div>
    </template>
  </BSheet>
</template>
