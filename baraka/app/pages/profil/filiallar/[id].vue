<script setup lang="ts">
// Filial / ombor tahrirlash (Profile.md §5, sub='branchEdit'). id = mavjud yozuv yoki `new?type=branch|warehouse`
import type { Branch, Warehouse, WorkDay } from '~/data/types'

const route = useRoute()
const router = useRouter()
const { branches, warehouses } = useStore()
const { show } = useToast()
const { deleteBranch, deleteWarehouse } = useLedger()

const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')
const existingBranch = computed(() => branches.value.find(b => b.id === id.value))
const existingWh = computed(() => warehouses.value.find(w => w.id === id.value))
const kind = computed<'branch' | 'warehouse'>(() =>
  existingWh.value ? 'warehouse' : existingBranch.value ? 'branch' : route.query.type === 'warehouse' ? 'warehouse' : 'branch')
const isBranch = computed(() => kind.value === 'branch')
const notFound = computed(() => !isNew.value && !existingBranch.value && !existingWh.value)

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

/** bf — tahrir formasi */
const f = reactive({
  name: '', address: '', lat: '', lng: '', manager: '', main: false,
  hours: DAYS.map(day => ({ day, open: '09:00', close: '21:00', off: false })) as WorkDay[],
})

function load() {
  const b = existingBranch.value
  const w = existingWh.value
  if (b) Object.assign(f, { name: b.name, address: b.address, lat: String(b.lat), lng: String(b.lng), manager: b.manager, main: !!b.main, hours: b.hours.map(h => ({ ...h })) })
  else if (w) Object.assign(f, { name: w.name, address: w.address, lat: w.lat != null ? String(w.lat) : '', lng: w.lng != null ? String(w.lng) : '', manager: w.manager, main: false })
  else f.main = isBranch.value && !branches.value.length
}
load()

const title = computed(() => isNew.value ? (isBranch.value ? 'Yangi filial' : 'Yangi ombor') : (existingBranch.value?.name ?? existingWh.value?.name ?? ''))
const backTo = computed(() => `/profil/filiallar?tab=${isBranch.value ? 'filial' : 'ombor'}`)

// Koordinata: faqat raqam, nuqta va minus
const num = (v: string) => v.replace(',', '.').replace(/[^\d.-]/g, '')
watch(() => f.lat, (v) => { const n = num(v); if (n !== v) f.lat = n })
watch(() => f.lng, (v) => { const n = num(v); if (n !== v) f.lng = n })

const locating = ref(false)
function locate() {
  if (!navigator.geolocation) return show('Joylashuvni aniqlab bo\'lmadi', 'error')
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (p) => {
      f.lat = p.coords.latitude.toFixed(6)
      f.lng = p.coords.longitude.toFixed(6)
      locating.value = false
      show('Joylashuv aniqlandi')
    },
    () => {
      locating.value = false
      show('Joylashuvni aniqlab bo\'lmadi', 'error')
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function mondayToAll() {
  const m = f.hours[0]!
  f.hours = f.hours.map(h => ({ ...h, open: m.open, close: m.close, off: m.off }))
  show('Dushanba vaqti hamma kunlarga qo\'llandi')
}

function leave() {
  if (window.history.state?.back) router.back()
  else router.replace(backTo.value)
}

function save() {
  if (!f.name.trim()) return show('Nomini kiriting', 'error')
  const lat = Number(f.lat) || 0
  const lng = Number(f.lng) || 0
  if (isBranch.value) {
    const data: Omit<Branch, 'id' | 'phone'> = { name: f.name.trim(), address: f.address.trim(), lat, lng, manager: f.manager.trim(), hours: f.hours.map(h => ({ ...h })), main: f.main }
    // Asosiy filial doim bitta
    let list = f.main ? branches.value.map(b => ({ ...b, main: false })) : [...branches.value]
    if (existingBranch.value) list = list.map(b => b.id === id.value ? { ...b, ...data } : b)
    else list = [...list, { ...data, id: uid('b'), phone: '' }]
    if (!list.some(b => b.main) && list[0]) list[0].main = true
    branches.value = list
  }
  else {
    const data: Omit<Warehouse, 'id' | 'branchId'> = { name: f.name.trim(), address: f.address.trim(), manager: f.manager.trim(), lat: f.lat ? lat : undefined, lng: f.lng ? lng : undefined }
    if (existingWh.value) warehouses.value = warehouses.value.map(w => w.id === id.value ? { ...w, ...data } : w)
    else warehouses.value = [...warehouses.value, { ...data, id: uid('w'), branchId: branches.value.find(b => b.main)?.id ?? branches.value[0]?.id ?? '' }]
  }
  show(isNew.value ? (isBranch.value ? 'Filial qo\'shildi' : 'Ombor qo\'shildi') : 'Saqlandi')
  leave()
}

const canDelete = computed(() => !isNew.value && !(existingBranch.value?.main))
function remove() {
  // Ledger: joriy filial almashtiriladi, omborlar/xodimlar/mahsulotlar boshqa filial/omborga o'tkaziladi
  const ok = existingBranch.value ? deleteBranch(id.value) : deleteWarehouse(id.value)
  if (!ok) return
  show(isBranch.value ? 'Filial o\'chirildi' : 'Ombor o\'chirildi')
  leave()
}
</script>

<template>
  <ProfPage>
    <ProfHeader :title="title" :back="backTo">
      <button
        v-if="!notFound" type="button"
        class="h-11 shrink-0 rounded-full bg-brand px-5 text-[14px] font-extrabold text-white transition-transform active:scale-95"
        @click="save"
      >
        Saqlash
      </button>
    </ProfHeader>

    <p v-if="notFound" class="py-10 text-center text-[13px] text-muted">Yozuv topilmadi</p>

    <template v-else>
      <ProfCard class="grid gap-3.5 p-4">
        <ProfField v-model="f.name" label="Nomi" :placeholder="isBranch ? 'Masalan: Yunusobod filiali' : 'Masalan: Markaziy ombor'" />
        <ProfField v-model="f.address" label="Manzil" placeholder="Shahar, ko'cha, uy" />
        <div class="grid gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[12.5px] font-bold text-[#5b616b]">Koordinata</span>
            <button type="button" class="flex items-center gap-1 text-[12.5px] font-extrabold text-brand disabled:opacity-50" :disabled="locating" @click="locate">
              <AppIcon name="crosshair" :size="15" :stroke="2.2" />{{ locating ? 'Aniqlanmoqda…' : 'Joriy joylashuv' }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <ProfField v-model="f.lat" inputmode="decimal" placeholder="Latitude" />
            <ProfField v-model="f.lng" inputmode="decimal" placeholder="Longitude" />
          </div>
        </div>
        <ProfField v-model="f.manager" label="Mas'ul shaxs (ixtiyoriy)" placeholder="Ism familiya" />
      </ProfCard>

      <template v-if="isBranch">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-model="f.main" label="Asosiy filial" hint="Hisobotlar va QR kodda birinchi ko'rsatiladi" />
        </ProfCard>

        <ProfCard class="p-4">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-[14px] font-extrabold text-ink">Ish vaqti</span>
            <button type="button" class="text-[12.5px] font-extrabold text-brand" @click="mondayToAll">Dushanbani hammasiga</button>
          </div>
          <div v-for="h in f.hours" :key="h.day" class="flex h-[52px] items-center gap-2 border-b border-[#f0f1f4] last:border-b-0">
            <span class="w-[74px] shrink-0 truncate text-[12.5px] font-bold text-ink">{{ h.day }}</span>
            <template v-if="!h.off">
              <input v-model="h.open" type="time" :aria-label="`${h.day} ochilish`" class="h-9 min-w-0 grow basis-0 rounded-[11px] bg-[#f4f6f9] px-1 text-center text-[13px] font-bold text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden">
              <span class="text-muted">–</span>
              <input v-model="h.close" type="time" :aria-label="`${h.day} yopilish`" class="h-9 min-w-0 grow basis-0 rounded-[11px] bg-[#f4f6f9] px-1 text-center text-[13px] font-bold text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden">
            </template>
            <span v-else class="grow text-[13px] font-bold text-muted">Yopiq</span>
            <ProfToggle :model-value="!h.off" :label="`${h.day} ish kuni`" @update:model-value="h.off = !$event" />
          </div>
        </ProfCard>
      </template>

      <ProfBtn v-if="canDelete" variant="danger" icon="trash" @click="remove">O'chirish</ProfBtn>
    </template>
  </ProfPage>
</template>
