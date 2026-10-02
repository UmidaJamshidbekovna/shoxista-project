<script setup lang="ts">
const { business } = useStore()
const { show } = useToast()
const { share, selection } = useTelegram()

const COLORS = ['#05472a', '#0e8a5f', '#1d5bd8', '#7c3aed', '#c2410c', '#d92d20', '#12211a']
const TAKEN = ['baraka', 'admin', 'shop', 'market', 'store', 'support', 'test']

const form = reactive({ ...business.value })
const logoSrc = ref<string>()
const fileInput = ref<HTMLInputElement>()

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) return show('Faqat rasm fayl tanlang', 'error')
  if (logoSrc.value) URL.revokeObjectURL(logoSrc.value)
  logoSrc.value = URL.createObjectURL(f)
}

// --- username: format + jonli tekshiruv ---
const uState = ref<'idle' | 'checking' | 'free' | 'taken'>('free')
let timer: ReturnType<typeof setTimeout> | undefined
const uFormatError = computed(() => {
  const u = form.username
  if (u.length < 4) return 'Kamida 4 ta belgi'
  if (u.length > 24) return 'Ko\'pi bilan 24 ta belgi'
  if (!/^[a-z0-9_]+$/.test(u)) return 'Faqat kichik lotin harflari, raqam va _'
  return ''
})
watch(() => form.username, (u) => {
  clearTimeout(timer)
  if (uFormatError.value) return (uState.value = 'idle')
  if (u === business.value.username) return (uState.value = 'free')
  uState.value = 'checking'
  timer = setTimeout(() => {
    if (form.username !== u) return
    uState.value = TAKEN.includes(u) ? 'taken' : 'free'
  }, 500)
})
function onUsernameInput(v: string | number) {
  form.username = String(v).toLowerCase().replace(/\s+/g, '_')
}

const errors = computed(() => ({
  name: form.name.trim().length < 2 ? 'Biznes nomini kiriting' : '',
  username: uFormatError.value || (uState.value === 'taken' ? 'Bu nom band, boshqasini tanlang' : ''),
  inn: /^\d{9}$/.test(form.inn) ? '' : 'STIR 9 ta raqamdan iborat bo\'lishi kerak',
  phone: profPhoneValid(form.phone) ? '' : 'Telefon: +998 XX XXX XX XX',
  description: form.description.length > 300 ? 'Juda uzun' : '',
}))
watch(() => form.inn, v => { const d = v.replace(/\D/g, '').slice(0, 9); if (d !== v) form.inn = d })
const touched = reactive<Record<string, boolean>>({})
const err = (k: keyof typeof errors.value) => touched[k] ? errors.value[k] : ''
const valid = computed(() => Object.values(errors.value).every(e => !e) && uState.value === 'free')
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(business.value) || !!logoSrc.value)

const link = computed(() => `baraka.app/@${form.username}`)
const qrValue = computed(() => `https://${link.value}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(qrValue.value)
    show('Havola nusxalandi')
  }
  catch { show('Nusxalab bo\'lmadi', 'error') }
}

function save() {
  Object.keys(errors.value).forEach(k => (touched[k] = true))
  if (!valid.value) return show('Maydonlarni tekshiring', 'error')
  business.value = { ...business.value, ...form, phone: profFormatPhone(form.phone) }
  form.phone = business.value.phone
  show('Biznes ma\'lumotlari saqlandi')
}
</script>

<template>
  <PageHeader title="Biznes akkaunt" subtitle="Ommaviy profil va QR kod" back="/profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <!-- Logotip -->
    <div class="card flex flex-col items-center gap-3 p-5">
      <div class="relative">
        <Avatar :name="form.name || 'B'" :src="logoSrc" :color="form.logoColor" square :size="88" />
        <button
          type="button" aria-label="Logotipni o'zgartirish"
          class="absolute -right-1.5 -bottom-1.5 flex size-9 items-center justify-center rounded-full border-[3px] border-card bg-brand text-white"
          @click="fileInput?.click()"
        >
          <AppIcon name="camera" :size="16" />
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile">
      </div>
      <div class="flex gap-2">
        <button
          v-for="c in COLORS" :key="c" type="button" :aria-label="`Rang ${c}`"
          class="size-7 rounded-full ring-offset-2 transition"
          :class="form.logoColor === c && !logoSrc ? 'ring-2 ring-brand' : ''"
          :style="{ background: c }"
          @click="form.logoColor = c; logoSrc = undefined; selection()"
        />
      </div>
      <p class="text-xs font-medium text-muted">Rasm yuklang yoki rang tanlang</p>
    </div>

    <div class="card flex flex-col gap-3.5 p-4">
      <BInput v-model="form.name" label="Biznes nomi" placeholder="Masalan: Baraka Market" icon="store" :error="err('name')" @focusout="touched.name = true" />

      <BInput
        :model-value="form.username" label="Username" placeholder="barakamarket" :maxlength="24"
        :error="(form.username || touched.username) ? errors.username : ''"
        @update:model-value="onUsernameInput" @focusout="touched.username = true"
      >
        <template #end>
          <span v-if="uState === 'checking'" class="size-5 shrink-0 animate-spin rounded-full border-[2.5px] border-brand/20 border-t-brand" aria-label="Tekshirilmoqda" />
          <span v-else-if="uState === 'free'" class="flex size-6 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="check" :size="14" :stroke="3" /></span>
          <span v-else-if="uState === 'taken'" class="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="x" :size="14" :stroke="3" /></span>
        </template>
      </BInput>
      <p v-if="uState === 'free' && !uFormatError" class="-mt-2 text-xs font-bold text-brand">✓ {{ form.username === business.username ? 'Joriy username' : `@${form.username} bo'sh` }}</p>
      <p v-else-if="uState === 'checking'" class="-mt-2 text-xs font-semibold text-muted">Tekshirilmoqda…</p>
      <p v-else-if="!form.username" class="-mt-2 text-xs font-medium text-muted">4–24 belgi: a–z, 0–9, _</p>

      <BInput v-model="form.inn" label="STIR (INN)" placeholder="9 ta raqam" inputmode="numeric" :maxlength="9" icon="file" :error="err('inn')" @focusout="touched.inn = true" />
      <BInput v-model="form.phone" label="Telefon" placeholder="+998 90 123 45 67" inputmode="tel" type="tel" icon="phone" :error="err('phone')" @focusout="touched.phone = true" />
      <div>
        <BInput v-model="form.description" label="Tavsif" placeholder="Biznesingiz haqida qisqacha" multiline :maxlength="300" />
        <p class="mt-1 text-right text-[11px] font-bold" :class="form.description.length > 270 ? 'text-warn' : 'text-muted'">{{ form.description.length }}/300</p>
      </div>
    </div>

    <!-- QR -->
    <div class="card flex flex-col items-center gap-3 p-5">
      <SectionHead title="QR kod" class="w-full" />
      <div class="rounded-[22px] border border-line bg-white p-2 shadow-card">
        <ProfQrCode :value="qrValue" :size="196" color="#05472a" />
      </div>
      <p class="text-[15px] font-extrabold text-brand">{{ link }}</p>
      <p class="-mt-2 text-center text-xs font-medium text-muted">Mijozlar skanerlab do'koningiz sahifasini ochadi</p>
      <div class="flex w-full gap-2.5">
        <PillButton variant="soft" size="sm" icon="link" class="grow basis-0" @click="copy">Nusxalash</PillButton>
        <PillButton variant="soft" size="sm" icon="share" class="grow basis-0" @click="share(qrValue)">Ulashish</PillButton>
      </div>
    </div>
  </div>

  <div class="pb-safe shrink-0 bg-card px-5 pt-3 pb-4 shadow-[0_-4px_14px_rgba(5,71,42,0.06)]">
    <PillButton block icon="check" :disabled="!dirty || !valid" @click="save">Saqlash</PillButton>
  </div>
</template>
