<script setup lang="ts">
import type { Employee, Role } from '~/data/types'
import { permissionList, planLimits, roleLabel } from '~/data/labels'

const store = useStore()
const { employees, branches, business } = store
const { show } = useToast()
const { selection } = useTelegram()

const ROLES: Exclude<Role, 'owner'>[] = ['manager', 'cashier', 'storekeeper', 'courier']
const PRESETS: Record<Exclude<Role, 'owner'>, string[]> = {
  manager: ['sales', 'inventory', 'reports', 'customers', 'orders', 'chat'],
  cashier: ['sales', 'customers'],
  storekeeper: ['inventory'],
  courier: ['orders', 'chat'],
}
const roleTone: Record<Role, 'solid' | 'brand' | 'info' | 'warn' | 'neutral'> = { owner: 'solid', manager: 'brand', cashier: 'info', storekeeper: 'warn', courier: 'neutral' }
const roleColor: Record<Role, string> = { owner: '#05472a', manager: '#0e8a5f', cashier: '#1d5bd8', storekeeper: '#b54708', courier: '#4a5a52' }

const limit = computed(() => planLimits[business.value.plan].employees)
const atLimit = computed(() => employees.value.length >= limit.value)
const filter = ref('all')
const filterOptions = computed(() => [
  { value: 'all', label: `Barchasi · ${employees.value.length}` },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
  ...ROLES.map(r => ({ value: r, label: roleLabel[r] })),
])
const list = computed(() => employees.value.filter(x =>
  filter.value === 'all' || (filter.value === 'active' ? x.active : filter.value === 'inactive' ? !x.active : x.role === filter.value)))

const open = ref(false)
const limitOpen = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', phone: '', role: 'cashier' as Exclude<Role, 'owner'>, branchId: '', permissions: [] as string[], active: true })

function startEdit(x?: Employee) {
  selection()
  if (x?.role === 'owner') return show('Egasi ma\'lumotlari Biznes akkauntda', 'info')
  if (!x && atLimit.value) return (limitOpen.value = true)
  editId.value = x?.id ?? null
  Object.assign(form, x
    ? { name: x.name, phone: x.phone, role: x.role, branchId: x.branchId, permissions: [...x.permissions], active: x.active }
    : { name: '', phone: '', role: 'cashier', branchId: store.currentBranchId.value, permissions: [...PRESETS.cashier], active: true })
  open.value = true
}

function setRole(r: Exclude<Role, 'owner'>) {
  form.role = r
  form.permissions = [...PRESETS[r]]
  selection()
}
function togglePerm(id: string) {
  form.permissions = form.permissions.includes(id) ? form.permissions.filter(p => p !== id) : [...form.permissions, id]
  selection()
}
const isPreset = computed(() => [...PRESETS[form.role]].sort().join() === [...form.permissions].sort().join())

const errors = computed(() => ({
  name: form.name.trim().split(/\s+/).filter(Boolean).length < 2 ? 'Ism va familiyani kiriting' : '',
  phone: !profPhoneValid(form.phone)
    ? 'Telefon: +998 XX XXX XX XX'
    : employees.value.some(x => x.id !== editId.value && x.phone.replace(/\D/g, '') === form.phone.replace(/\D/g, '')) ? 'Bu raqam boshqa xodimda bor' : '',
  branchId: form.branchId ? '' : 'Filialni tanlang',
  permissions: form.permissions.length ? '' : 'Kamida bitta ruxsat bering',
}))
const e = (k: 'name' | 'phone') => (form[k] !== '' ? errors.value[k] : '')
const valid = computed(() => Object.values(errors.value).every(x => !x))
const branchOptions = computed(() => branches.value.map(b => ({ value: b.id, label: b.name })))

function save() {
  if (!valid.value) return
  const data = { name: form.name.trim(), phone: profFormatPhone(form.phone), role: form.role, branchId: form.branchId, permissions: [...form.permissions], active: form.active }
  if (editId.value) {
    const x = employees.value.find(y => y.id === editId.value)
    if (x) Object.assign(x, data)
    show('Xodim saqlandi')
  }
  else {
    if (atLimit.value) return (limitOpen.value = true)
    employees.value = [...employees.value, { id: `e${Date.now()}`, ...data }]
    show('Xodim qo\'shildi')
  }
  open.value = false
}

const removeOpen = ref(false)
function remove() {
  employees.value = employees.value.filter(x => x.id !== editId.value)
  removeOpen.value = false
  open.value = false
  show('Xodim o\'chirildi')
}

function setActive(x: Employee, v: boolean) {
  x.active = v
  show(v ? `${x.name} faollashtirildi` : `${x.name} nofaol qilindi`, 'info')
}
</script>

<template>
  <PageHeader title="Xodimlar" :subtitle="`${employees.filter(x => x.active).length} ta faol`" back="/profil">
    <RoundButton icon="plus" label="Xodim qo'shish" variant="brand" @click="startEdit()" />
  </PageHeader>

  <div class="flex shrink-0 flex-col gap-3 px-5 pb-3">
    <div class="card p-4">
      <ProfLimitBar :label="`${business.plan} tarifi limiti`" :used="employees.length" :limit="limit" />
      <p v-if="atLimit" class="mt-2 text-xs font-semibold text-warn">
        Limit to'lgan. <NuxtLink to="/profil/obuna" class="font-extrabold underline">Tarifni oshiring</NuxtLink>
      </p>
      <p v-else class="mt-2 text-xs font-medium text-muted">{{ employees.length }}/{{ profLimitText(limit) }} xodim · yana {{ profUnlimited(limit) ? 'cheksiz' : limit - employees.length }} ta qo'shish mumkin</p>
    </div>
    <Chips v-model="filter" :options="filterOptions" />
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-2.5 overflow-y-auto px-5 pb-6">
    <div v-for="x in list" :key="x.id" class="card flex items-center gap-3 p-3.5" :class="!x.active && 'opacity-70'">
      <button type="button" class="flex min-w-0 grow items-center gap-3 text-left" @click="startEdit(x)">
        <Avatar :name="x.name" :color="roleColor[x.role]" :size="46" />
        <span class="min-w-0 grow">
          <span class="flex items-center gap-1.5">
            <span class="truncate text-[15px] font-extrabold">{{ x.name }}</span>
          </span>
          <span class="mt-0.5 flex items-center gap-1.5">
            <Badge :tone="roleTone[x.role]">{{ roleLabel[x.role] }}</Badge>
            <span class="truncate text-xs font-semibold text-muted">{{ store.branchById(x.branchId)?.name ?? '—' }}</span>
          </span>
        </span>
      </button>
      <div class="flex shrink-0 flex-col items-center gap-1">
        <Toggle v-if="x.role !== 'owner'" :model-value="x.active" :label="`${x.name} faol`" @update:model-value="setActive(x, $event)" />
        <AppIcon v-else name="crown" class="text-brand" />
        <span class="text-[10px] font-bold" :class="x.active ? 'text-brand' : 'text-muted'">{{ x.active ? 'Faol' : 'Nofaol' }}</span>
      </div>
    </div>
    <EmptyState v-if="!list.length" icon="users" title="Xodim topilmadi" text="Filtrni o'zgartiring yoki yangi xodim qo'shing" />
  </div>

  <BSheet v-model="open" :title="editId ? 'Xodimni tahrirlash' : 'Yangi xodim'" full>
    <div class="flex flex-col gap-3.5">
      <BInput v-model="form.name" label="Ism familiya" placeholder="Masalan: Kamola Ergasheva" icon="user" :error="e('name')" />
      <BInput v-model="form.phone" label="Telefon" placeholder="+998 90 123 45 67" type="tel" inputmode="tel" icon="phone" :error="e('phone')" />
      <ProfSelect v-model="form.branchId" label="Filial" placeholder="Filialni tanlang" icon="store" :options="branchOptions" />

      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Rol</span>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="r in ROLES" :key="r" type="button"
            class="flex h-12 items-center gap-2 rounded-2xl border-2 px-3 text-sm font-extrabold transition-colors"
            :class="form.role === r ? 'border-brand bg-soft text-brand' : 'border-transparent bg-field text-ink'"
            @click="setRole(r)"
          >
            <span class="size-2.5 rounded-full" :style="{ background: roleColor[r] }" />{{ roleLabel[r] }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-[13px] font-bold text-muted-2">Ruxsatlar</span>
        <button v-if="!isPreset" type="button" class="text-xs font-extrabold text-brand" @click="setRole(form.role)">{{ roleLabel[form.role] }} andozasi</button>
        <span v-else class="text-xs font-bold text-muted">{{ roleLabel[form.role] }} andozasi</span>
      </div>
      <div class="card -mt-1.5 px-4 py-1">
        <button
          v-for="p in permissionList" :key="p.id" type="button"
          class="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
          role="checkbox" :aria-checked="form.permissions.includes(p.id)"
          @click="togglePerm(p.id)"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
            :class="form.permissions.includes(p.id) ? 'border-brand bg-brand text-white' : 'border-[#cfd5dc] bg-card text-transparent'"
          >
            <AppIcon name="check" :size="14" :stroke="3" />
          </span>
          <span class="grow text-sm font-bold">{{ p.label }}</span>
        </button>
      </div>
      <p v-if="errors.permissions" class="-mt-2 text-xs font-semibold text-danger">{{ errors.permissions }}</p>

      <div class="card flex items-center gap-3 px-4 py-3">
        <div class="grow">
          <p class="text-[15px] font-bold">Faol</p>
          <p class="text-xs font-medium text-muted">Nofaol xodim tizimga kira olmaydi</p>
        </div>
        <Toggle v-model="form.active" label="Faol" />
      </div>
      <button v-if="editId" type="button" class="flex items-center justify-center gap-2 py-2 text-sm font-extrabold text-danger" @click="removeOpen = true">
        <AppIcon name="trash" :size="18" />Xodimni o'chirish
      </button>
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!valid" @click="save">{{ editId ? 'Saqlash' : 'Qo\'shish' }}</PillButton>
    </template>
  </BSheet>

  <BSheet v-model="removeOpen" title="Xodimni o'chirish">
    <p class="py-2 text-[15px] font-semibold text-muted-2"><b class="text-ink">{{ form.name }}</b> ro'yxatdan o'chiriladi. Bu amalni qaytarib bo'lmaydi.</p>
    <template #footer>
      <div class="flex gap-2.5">
        <PillButton variant="field" class="grow basis-0" @click="removeOpen = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" @click="remove">O'chirish</PillButton>
      </div>
    </template>
  </BSheet>

  <BSheet v-model="limitOpen" title="Limit to'lgan">
    <div class="flex flex-col items-center gap-2 py-3 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-warn-soft text-warn"><AppIcon name="alert" :size="26" /></span>
      <p class="text-base font-extrabold">{{ business.plan }} tarifida {{ limit }} ta xodim</p>
      <p class="text-[13px] font-medium text-muted">Yangi xodim qo'shish uchun tarifingizni oshiring yoki nofaol xodimni o'chiring.</p>
    </div>
    <template #footer>
      <PillButton block icon="crown" to="/profil/obuna">Tarifni oshirish</PillButton>
    </template>
  </BSheet>
</template>
