<script setup lang="ts">
import type { Organization } from '~/data/types'

// Tashkilot yaratish / tahrirlash
const props = defineProps<{ org?: Organization }>()
const emit = defineEmits<{ saved: [id: string] }>()
const open = defineModel<boolean>({ default: false })

const { organizations } = useStore()
const { show } = useToast()

const name = ref('')
const type = ref<'supplier' | 'client'>('supplier')
const inn = ref('')
const phone = ref('')
const contact = ref('')
const address = ref('')
const blur = reactive({ phone: false, inn: false })
usePhoneMask(phone)
watch(inn, (v) => {
  const d = String(v).replace(/\D/g, '').slice(0, 9)
  if (d !== v) inn.value = d
})

watch(open, (v) => {
  if (!v) return
  blur.phone = false
  blur.inn = false
  name.value = props.org?.name ?? ''
  type.value = props.org?.type ?? 'supplier'
  inn.value = props.org?.inn ?? ''
  phone.value = props.org?.phone ?? ''
  contact.value = props.org?.contact ?? ''
  address.value = props.org?.address ?? ''
})

const nameErr = computed(() => name.value.trim().length < 2 ? 'Tashkilot nomini kiriting' : '')
const innErr = computed(() => {
  if (!/^\d{9}$/.test(inn.value)) return 'INN 9 ta raqamdan iborat bo\'lishi kerak'
  if (organizations.value.some(o => o.inn === inn.value && o.id !== props.org?.id)) return 'Bu INN bilan tashkilot allaqachon bor'
  return ''
})
const phoneErr = computed(() => isUzPhone(phone.value) ? '' : 'Raqam to\'liq emas: +998 XX XXX XX XX')
const valid = computed(() => !nameErr.value && !innErr.value && !phoneErr.value)

function save() {
  if (!valid.value) return
  const data = {
    name: name.value.trim(), type: type.value, inn: inn.value, phone: phone.value,
    contact: contact.value.trim(), address: address.value.trim(),
  }
  let id = props.org?.id
  if (props.org) {
    Object.assign(props.org, data)
    show('Tashkilot ma\'lumotlari saqlandi')
  }
  else {
    id = `o${Date.now()}`
    const logoColor = orgColors[organizations.value.length % orgColors.length]!
    organizations.value = [{ id, ...data, balance: 0, ownCreated: true, categories: [], logoColor }, ...organizations.value]
    show('Tashkilot qo\'shildi')
  }
  open.value = false
  emit('saved', id!)
}
</script>

<template>
  <BSheet v-model="open" :title="org ? 'Tashkilotni tahrirlash' : 'Yangi tashkilot'">
    <div class="flex flex-col gap-3.5">
      <Segmented v-model="type" :options="[{ value: 'supplier', label: 'Ta\'minotchi' }, { value: 'client', label: 'Mijoz (B2B)' }]" />
      <BInput v-model="name" label="Tashkilot nomi" placeholder="Masalan: Oq Suv Sut MChJ" icon="building" :maxlength="80" :error="!!name && nameErr" />
      <div @focusout="blur.inn = true">
        <BInput
          v-model="inn" label="INN (STIR)" placeholder="9 ta raqam" icon="file" inputmode="numeric" :maxlength="9"
          :hint="`${inn.length}/9 raqam`" :error="((blur.inn && !!inn) || inn.length === 9) && innErr"
        />
      </div>
      <div @focusout="blur.phone = true">
        <BInput
          v-model="phone" label="Telefon raqam" placeholder="+998 71 123 45 67" icon="phone" type="tel" inputmode="tel"
          hint="Format: +998 XX XXX XX XX" :error="((blur.phone && !!phone) || phone.length === 17) && phoneErr"
        />
      </div>
      <BInput v-model="contact" label="Mas'ul shaxs" placeholder="Ism (ixtiyoriy)" icon="user" :maxlength="60" />
      <BInput v-model="address" label="Manzil" placeholder="Shahar, tuman, ko'cha (ixtiyoriy)" icon="map-pin" :maxlength="120" />
      <p v-if="!org" class="flex items-start gap-2 rounded-2xl bg-soft px-3.5 py-3 text-xs font-semibold text-muted-2">
        <AppIcon name="info" :size="16" class="mt-px shrink-0 text-brand" />
        Siz yaratgan tashkilot platformada ro'yxatdan o'tmagan bo'ladi: unda faqat buyurtmalar va to'lovlar tarixi yuritiladi.
      </p>
    </div>
    <template #footer>
      <PillButton block :disabled="!valid" icon="check" @click="save">{{ org ? 'Saqlash' : 'Tashkilot qo\'shish' }}</PillButton>
    </template>
  </BSheet>
</template>
