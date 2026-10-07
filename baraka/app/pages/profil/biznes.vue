<script setup lang="ts">
// Biznes akkaunt (Profile.md §4): ko'rish / tahrirlash (mcDraft), username jonli tekshiruvi, filial bloki
const { business, branches, warehouses } = useStore()
const { show } = useToast()

/** Band username'lar (simulyatsiya; backendda GET /merchant/username-available) */
const TAKEN = ['baraka', 'admin', 'market', 'shop', 'store', 'korzinka', 'makro', 'havas', 'support', 'barakashop', 'test']

type Draft = { username: string, name: string, activity: string, owner: string, phone: string, inn: string, description: string }
const draft = ref<Draft | null>(null)

function edit() {
  const b = business.value
  draft.value = draft.value
    ? null
    : { username: b.username, name: b.name, activity: b.activity ?? '', owner: b.owner, phone: b.phone, inn: b.inn, description: b.description }
}

// Kichik harfga o'tkaziladi; boshqa belgilar qoladi va xato ko'rsatiladi
watch(() => draft.value?.username, (v) => {
  if (draft.value && v != null && v !== v.toLowerCase()) draft.value.username = v.toLowerCase()
})
watch(() => draft.value?.inn, (v) => {
  if (draft.value && v != null && /\D/.test(v)) draft.value.inn = v.replace(/\D/g, '')
})

type UState = 'empty' | 'invalid' | 'taken' | 'ok'
const uState = computed<UState>(() => {
  const u = draft.value?.username.replace(/^@/, '') ?? ''
  if (!u) return 'empty'
  if (!/^[a-z0-9_]{4,24}$/.test(u)) return 'invalid'
  if (u !== business.value.username && TAKEN.includes(u)) return 'taken'
  return 'ok'
})
const U_UI: Record<UState, { color: string, border: string }> = {
  empty: { color: '#8b9099', border: '#e4e7eb' },
  invalid: { color: '#d93036', border: '#f3b4b6' },
  taken: { color: '#d93036', border: '#f3b4b6' },
  ok: { color: '#15803d', border: '#b7dfc3' },
}
const uText = computed(() => ({
  empty: 'Username kiriting',
  invalid: '4–24 belgi: kichik lotin harflar, raqam va _',
  taken: 'Bu username band',
  ok: `@${draft.value?.username.replace(/^@/, '')} bo'sh — faqat sizga tegishli bo'ladi`,
}[uState.value]))
const hasError = computed(() => uState.value !== 'ok' || !draft.value?.name.trim())

function save() {
  const d = draft.value
  if (!d) return
  if (uState.value !== 'ok') return show('Username to\'g\'ri emas', 'error')
  if (!d.name.trim()) return show('Nomini kiriting', 'error')
  business.value = {
    ...business.value,
    username: d.username.replace(/^@/, ''),
    name: d.name.trim(),
    activity: d.activity.trim(),
    owner: d.owner.trim(),
    phone: d.phone.trim() ? formatUzPhone(d.phone, { completeOnly: true }) : '',
    inn: d.inn.trim(),
    description: d.description.trim(),
  }
  draft.value = null
  show('Saqlandi')
}

function setLogo(src: string) {
  business.value = { ...business.value, logo: src }
}

const single = computed(() => branches.value.length === 1 ? branches.value[0] : undefined)
const coords = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`
</script>

<template>
  <ProfPage>
    <ProfHeader>
      <template #title>
        <ProfAvatar
          :name="business.name" :src="business.logo" :size="48" :radius="15" :font="16" :bg="business.logoColor" color="#fff"
          :upload="!!draft" @pick="setLogo"
        />
        <div class="min-w-0 grow">
          <h1 class="truncate text-[17px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{{ business.name }}</h1>
          <p class="truncate text-[12.5px] font-bold text-brand">@{{ business.username }}</p>
        </div>
      </template>
      <ProfIconBtn :icon="draft ? 'x' : 'edit'" :label="draft ? 'Bekor qilish' : 'Tahrirlash'" :tone="draft ? 'danger' : 'white'" @click="edit" />
    </ProfHeader>

    <!-- Ko'rish rejimi -->
    <template v-if="!draft">
      <ProfSection title="Merchant">
        <ProfCard class="px-4 py-1">
          <ProfKv k="Faoliyat turi" :v="business.activity" />
          <ProfKv k="Egasi" :v="business.owner" />
          <ProfKv k="Telefon" :v="business.phone" />
          <ProfKv k="STIR (INN)" :v="business.inn" />
        </ProfCard>
      </ProfSection>

      <ProfSection title="Tavsif">
        <ProfCard class="p-4">
          <p class="text-[13.5px] leading-[1.55] whitespace-pre-line text-[#374151]">{{ business.description || 'Tavsif kiritilmagan' }}</p>
        </ProfCard>
      </ProfSection>

      <ProfSection v-if="single" title="Filial">
        <ProfCard class="px-4 py-1">
          <ProfKv k="Filial nomi" :v="single.name" />
          <ProfKv k="Manzil" :v="single.address" />
          <ProfKv k="Koordinata" :v="coords(single.lat, single.lng)" />
          <ProfKv k="Mas'ul shaxs" :v="single.manager" />
          <ProfKv k="Ish vaqti" :v="profTodayText(single)" chevron @click="navigateTo(`/profil/filiallar/${single.id}`)" />
        </ProfCard>
        <ProfBtn variant="soft" icon="plus" @click="navigateTo('/profil/filiallar/new?type=branch')">Filial qo'shish</ProfBtn>
      </ProfSection>

      <NuxtLink v-else to="/profil/filiallar?tab=filial" class="flex items-center gap-3 rounded-[22px] bg-card p-4 shadow-[0_2px_10px_rgba(5,71,42,0.05)] active:opacity-80">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-soft text-brand">
          <AppIcon name="store" :size="18" :stroke="1.8" />
        </span>
        <span class="min-w-0 grow">
          <span class="block text-[14px] font-bold text-ink">Filiallar</span>
          <span class="block truncate text-[11.5px] text-muted">{{ branches.length }} ta filial · {{ warehouses.length }} ta ombor · ish vaqti</span>
        </span>
        <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#a3a8b0]" />
      </NuxtLink>
    </template>

    <!-- Tahrirlash rejimi -->
    <template v-else>
      <ProfCard class="grid gap-3.5 p-4">
        <ProfField v-model="draft.username" label="Username" prefix="@" placeholder="barakamarket" :maxlength="24" :border="U_UI[uState].border">
          <template #below>
            <span class="px-1 text-[11.5px] font-bold" :style="{ color: U_UI[uState].color }">{{ uText }}</span>
          </template>
        </ProfField>
        <ProfField v-model="draft.name" label="Do'kon nomi" placeholder="Masalan: Baraka Market" />
        <ProfField v-model="draft.activity" label="Faoliyat turi" placeholder="Masalan: Oziq-ovqat do'koni" />
        <ProfField v-model="draft.owner" label="Egasi" placeholder="Ism familiya" />
        <ProfField v-model="draft.phone" label="Telefon" type="tel" inputmode="tel" placeholder="+998 __ ___ __ __" />
        <ProfField v-model="draft.inn" label="STIR (INN)" inputmode="numeric" placeholder="9 xonali raqam" :maxlength="14" />
        <ProfField v-model="draft.description" label="Tavsif" multiline :rows="4" placeholder="Do'koningiz haqida qisqacha" />
      </ProfCard>
      <ProfBtn :dim="hasError" @click="save">Saqlash</ProfBtn>
    </template>
  </ProfPage>
</template>
