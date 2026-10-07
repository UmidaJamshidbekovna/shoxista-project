<script setup lang="ts">
import type { Channel, Customer } from '~/data/types'
import { channelLabel } from '~/data/labels'

// Mijoz yaratish / tahrirlash
const props = defineProps<{ customer?: Customer }>()
const emit = defineEmits<{ saved: [id: string] }>()
const open = defineModel<boolean>({ default: false })

const { customers } = useStore()
const { show } = useToast()

const name = ref('')
const phone = ref('')
const channel = ref<Channel>('offline')
const note = ref('')
const phoneBlur = ref(false)
usePhoneMask(phone)

watch(open, (v) => {
  if (!v) return
  phoneBlur.value = false
  name.value = props.customer?.name ?? ''
  phone.value = props.customer?.phone ?? ''
  channel.value = props.customer?.channel ?? 'offline'
  note.value = props.customer?.note ?? ''
})

const channelOpts = (Object.keys(channelLabel) as Channel[]).map(c => ({ value: c, label: channelLabel[c] }))

const nameErr = computed(() => name.value.trim().length < 2 ? 'Ismni kiriting (kamida 2 harf)' : '')
const phoneErr = computed(() => {
  if (!isUzPhone(phone.value)) return 'Raqam to\'liq emas: +998 XX XXX XX XX'
  if (customers.value.some(c => c.phone === phone.value && c.id !== props.customer?.id)) return 'Bu raqam bilan mijoz allaqachon bor'
  return ''
})
const valid = computed(() => !nameErr.value && !phoneErr.value)

function save() {
  if (!valid.value) return
  const data = { name: name.value.trim(), phone: phone.value, channel: channel.value, note: note.value.trim() || undefined }
  let id = props.customer?.id
  if (props.customer) {
    Object.assign(props.customer, data)
    show('Mijoz ma\'lumotlari saqlandi')
  }
  else {
    id = uid('u')
    customers.value = [{ id, ...data, debt: 0, totalSpent: 0, purchases: 0, lastVisit: new Date().toISOString() }, ...customers.value]
    show('Yangi mijoz qo\'shildi')
  }
  open.value = false
  emit('saved', id!)
}
</script>

<template>
  <BSheet v-model="open" :title="customer ? 'Mijozni tahrirlash' : 'Yangi mijoz'">
    <div class="flex flex-col gap-3.5">
      <BInput v-model="name" label="Ism familiya" placeholder="Masalan: Dilnoza Karimova" icon="user" :maxlength="60" :error="!!name && nameErr" />
      <div @focusout="phoneBlur = true">
        <BInput
          v-model="phone" label="Telefon raqam" placeholder="+998 90 123 45 67" icon="phone" type="tel" inputmode="tel"
          hint="Format: +998 XX XXX XX XX" :error="((phoneBlur && !!phone) || phone.length === 17) && phoneErr"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[13px] font-bold text-muted-2">Kanal</span>
        <Chips v-model="channel" :options="channelOpts" />
      </div>
      <BInput v-model="note" label="Izoh" placeholder="Mijoz haqida eslatma (ixtiyoriy)" multiline :maxlength="200" />
    </div>
    <template #footer>
      <PillButton block :disabled="!valid" icon="check" @click="save">{{ customer ? 'Saqlash' : 'Mijoz qo\'shish' }}</PillButton>
    </template>
  </BSheet>
</template>
