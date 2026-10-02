<script setup lang="ts">
import type { Branch, WorkDay } from '~/data/types'
import { planLimits } from '~/data/labels'

const store = useStore()
const { branches, employees, business, warehouses } = store
const { show } = useToast()
const { selection } = useTelegram()

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
const limit = computed(() => planLimits[business.value.plan].branches)
const atLimit = computed(() => branches.value.length >= limit.value)

const todayIdx = (new Date().getDay() + 6) % 7
function todayText(b: Branch) {
  const d = b.hours[todayIdx]
  return !d || d.off ? 'Bugun dam olish kuni' : `Bugun ${d.open}–${d.close}`
}
function isOpenNow(b: Branch) {
  const d = b.hours[todayIdx]
  if (!d || d.off) return false
  const now = new Date()
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return t >= d.open && t < d.close
}

// --- tahrirlash ---
const open = ref(false)
const limitOpen = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', address: '', lat: '', lng: '', manager: '', phone: '', hours: [] as WorkDay[] })
const tried = ref(false)

function startEdit(b?: Branch) {
  selection()
  if (!b && atLimit.value) return (limitOpen.value = true)
  editId.value = b?.id ?? null
  Object.assign(form, b
    ? { name: b.name, address: b.address, lat: String(b.lat), lng: String(b.lng), manager: b.manager, phone: b.phone, hours: b.hours.map(h => ({ ...h })) }
    : { name: '', address: '', lat: '', lng: '', manager: '', phone: '', hours: DAYS.map(day => ({ day, open: '09:00', close: '20:00', off: day === 'Yakshanba' })) })
  tried.value = false
  open.value = true
}

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v.replace(',', '.')))
const errors = computed(() => {
  const lat = num(form.lat), lng = num(form.lng)
  return {
    name: form.name.trim().length < 2 ? 'Filial nomini kiriting' : '',
    address: form.address.trim().length < 5 ? 'To\'liq manzilni kiriting' : '',
    lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? '' : 'Kenglik −90…90 oralig\'ida',
    lng: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? '' : 'Uzunlik −180…180 oralig\'ida',
    manager: form.manager ? '' : 'Mas\'ul shaxsni tanlang',
    phone: profPhoneValid(form.phone) ? '' : 'Telefon: +998 XX XXX XX XX',
    hours: form.hours.some(h => !h.off && (!h.open || !h.close || h.open >= h.close)) ? 'Yopilish vaqti ochilishdan keyin bo\'lishi kerak' : '',
  }
})
const e = (k: keyof typeof errors.value) => (tried.value || (k !== 'hours' && (form as any)[k] !== '')) ? errors.value[k] : ''
const valid = computed(() => Object.values(errors.value).every(x => !x))
const coordsOk = computed(() => !errors.value.lat && !errors.value.lng)
const mapUrl = computed(() => `https://maps.google.com/?q=${num(form.lat)},${num(form.lng)}`)
const managerOptions = computed(() => {
  const names = employees.value.filter(x => x.active).map(x => x.name)
  if (form.manager && !names.includes(form.manager)) names.push(form.manager)
  return names.map(n => ({ value: n, label: n }))
})

function copyMonday() {
  const m = form.hours[0]!
  form.hours.forEach((h, i) => { if (i > 0 && i < 6) Object.assign(h, { open: m.open, close: m.close, off: m.off }) })
  selection()
}

function save() {
  tried.value = true
  if (!valid.value) return show('Maydonlarni tekshiring', 'error')
  const data = { name: form.name.trim(), address: form.address.trim(), lat: num(form.lat), lng: num(form.lng), manager: form.manager, phone: profFormatPhone(form.phone), hours: form.hours.map(h => ({ ...h })) }
  if (editId.value) {
    const b = store.branchById(editId.value)
    if (b) Object.assign(b, data)
    show('Filial saqlandi')
  }
  else {
    branches.value = [...branches.value, { id: `b${Date.now()}`, ...data }]
    show('Yangi filial qo\'shildi')
  }
  open.value = false
}
</script>

<template>
  <PageHeader title="Filiallar" :subtitle="`${branches.length} / ${profLimitText(limit)} filial`" back="/profil">
    <RoundButton icon="plus" label="Filial qo'shish" variant="brand" @click="startEdit()" />
  </PageHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3 overflow-y-auto px-5 pb-6">
    <div v-if="atLimit" class="flex items-start gap-3 rounded-[18px] bg-warn-soft p-3.5">
      <AppIcon name="alert" class="mt-0.5 shrink-0 text-warn" />
      <div class="grow text-[13px] font-semibold text-warn">
        {{ business.plan }} tarifida {{ limit }} ta filial limiti to'lgan.
        <NuxtLink to="/profil/obuna" class="font-extrabold underline">Tarifni oshirish</NuxtLink>
      </div>
    </div>

    <button v-for="b in branches" :key="b.id" type="button" class="card flex flex-col gap-3 p-4 text-left active:scale-[0.99]" @click="startEdit(b)">
      <div class="flex items-center gap-3">
        <Avatar icon="store" :size="44" />
        <div class="min-w-0 grow">
          <p class="truncate text-[15px] font-extrabold">{{ b.name }}</p>
          <p class="truncate text-xs font-medium text-muted">{{ b.address }}</p>
        </div>
        <Badge :tone="isOpenNow(b) ? 'brand' : 'neutral'">{{ isOpenNow(b) ? 'Ochiq' : 'Yopiq' }}</Badge>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-2">
        <span class="flex items-center gap-1.5"><AppIcon name="user" :size="14" class="text-muted" />{{ b.manager }}</span>
        <span class="flex items-center gap-1.5"><AppIcon name="clock" :size="14" class="text-muted" />{{ todayText(b) }}</span>
        <span class="flex items-center gap-1.5"><AppIcon name="phone" :size="14" class="text-muted" />{{ b.phone }}</span>
        <span class="flex items-center gap-1.5"><AppIcon name="warehouse" :size="14" class="text-muted" />{{ warehouses.filter(w => w.branchId === b.id).length }} ta ombor</span>
      </div>
    </button>

    <EmptyState v-if="!branches.length" icon="map-pin" title="Filiallar yo'q" text="Birinchi filialingizni qo'shing" />
  </div>

  <BSheet v-model="open" :title="editId ? 'Filialni tahrirlash' : 'Yangi filial'" full>
    <div class="flex flex-col gap-3.5">
      <BInput v-model="form.name" label="Filial nomi" placeholder="Masalan: Chilonzor filiali" icon="store" :error="e('name')" />
      <BInput v-model="form.address" label="Manzil" placeholder="Shahar, tuman, ko'cha, uy" icon="map-pin" :error="e('address')" />
      <div class="grid grid-cols-2 gap-2.5">
        <BInput v-model="form.lat" label="Kenglik (lat)" placeholder="41.2995" inputmode="decimal" :error="e('lat')" />
        <BInput v-model="form.lng" label="Uzunlik (lng)" placeholder="69.2401" inputmode="decimal" :error="e('lng')" />
      </div>
      <a
        :href="coordsOk ? mapUrl : undefined" target="_blank" rel="noopener"
        class="-mt-1 flex items-center gap-2 self-start rounded-full px-3.5 py-2 text-[13px] font-bold"
        :class="coordsOk ? 'bg-soft text-brand' : 'pointer-events-none bg-field text-muted'"
      >
        <AppIcon name="map-pin" :size="16" />Xaritada ochish
      </a>
      <ProfSelect v-model="form.manager" label="Mas'ul shaxs" placeholder="Xodimni tanlang" icon="user" :options="managerOptions" :error="e('manager')" />
      <BInput v-model="form.phone" label="Telefon" placeholder="+998 90 123 45 67" type="tel" inputmode="tel" icon="phone" :error="e('phone')" />

      <div class="mt-1 flex items-center justify-between">
        <h3 class="text-base font-extrabold">Ish vaqti</h3>
        <button type="button" class="text-[13px] font-bold text-brand" @click="copyMonday">Dushanbani ish kunlariga</button>
      </div>
      <div class="card px-4 py-1">
        <div v-for="h in form.hours" :key="h.day" class="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold" :class="h.off ? 'bg-field text-muted' : 'bg-soft text-brand'" :title="h.day">{{ h.day.slice(0, 2) }}</span>
          <template v-if="!h.off">
            <input v-model="h.open" type="time" :aria-label="`${h.day} ochilish`" class="h-9 w-[92px] min-w-0 rounded-xl bg-field px-2 [&::-webkit-calendar-picker-indicator]:hidden text-center text-[13px] font-bold outline-none focus:ring-2 focus:ring-brand" :class="h.open >= h.close && 'ring-2 ring-danger'">
            <span class="text-muted">–</span>
            <input v-model="h.close" type="time" :aria-label="`${h.day} yopilish`" class="h-9 w-[92px] min-w-0 rounded-xl bg-field px-2 [&::-webkit-calendar-picker-indicator]:hidden text-center text-[13px] font-bold outline-none focus:ring-2 focus:ring-brand" :class="h.open >= h.close && 'ring-2 ring-danger'">
          </template>
          <span v-else class="text-[13px] font-bold text-muted">{{ h.day }} — dam olish</span>
          <span class="grow" />
          <Toggle :model-value="!h.off" :label="`${h.day} ish kuni`" @update:model-value="h.off = !$event" />
        </div>
      </div>
      <p v-if="errors.hours" class="-mt-1.5 text-xs font-semibold text-danger">{{ errors.hours }}</p>
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!valid" @click="save">{{ editId ? 'Saqlash' : 'Qo\'shish' }}</PillButton>
    </template>
  </BSheet>

  <BSheet v-model="limitOpen" title="Limit to'lgan">
    <div class="flex flex-col items-center gap-2 py-3 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-warn-soft text-warn"><AppIcon name="alert" :size="26" /></span>
      <p class="text-base font-extrabold">{{ business.plan }} tarifida {{ limit }} ta filial</p>
      <p class="text-[13px] font-medium text-muted">Yangi filial qo'shish uchun tarifingizni oshiring.</p>
    </div>
    <template #footer>
      <PillButton block icon="crown" to="/profil/obuna">Tarifni oshirish</PillButton>
    </template>
  </BSheet>
</template>
