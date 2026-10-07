<script setup lang="ts">
// Shaxsiy ma'lumotlar (Profile.md §2): ko'rish / tahrirlash (meDraft), avatar sloti
const { business } = useStore()
const { me } = useProfMe()
const { show } = useToast()

/** null = ko'rish rejimi */
const draft = ref<{ name: string, phone: string } | null>(null)

function edit() {
  draft.value = draft.value ? null : { name: me.value?.name ?? '', phone: me.value?.phone ?? '' }
}

function save() {
  const d = draft.value
  if (!d || !me.value) return
  if (!d.name.trim() || !profPhoneValid(d.phone)) return show('Ism va telefonni kiriting', 'error')
  const wasOwner = me.value.role === 'owner'
  const prevName = me.value.name
  me.value.name = d.name.trim()
  me.value.phone = profFormatPhone(d.phone)
  if (wasOwner && business.value.owner === prevName) business.value.owner = me.value.name
  draft.value = null
  show('Saqlandi')
}

function setAvatar(src: string) {
  if (me.value) me.value.avatar = src
}
</script>

<template>
  <ProfPage>
    <ProfHeader title="Shaxsiy ma'lumotlar">
      <ProfIconBtn :icon="draft ? 'x' : 'edit'" :label="draft ? 'Bekor qilish' : 'Tahrirlash'" :tone="draft ? 'danger' : 'white'" @click="edit" />
    </ProfHeader>

    <ProfCard class="flex flex-col items-center px-4 py-5 text-center">
      <ProfAvatar :name="me?.name ?? ''" :src="me?.avatar" :size="84" :font="26" upload @pick="setAvatar" />
      <p class="mt-3 text-[18px] font-extrabold text-ink">{{ me?.name }}</p>
      <p class="mt-0.5 text-[12.5px] text-muted">{{ profRoleText(me) }}</p>
    </ProfCard>

    <ProfCard v-if="!draft" class="px-4 py-1">
      <ProfKv k="Ism" :v="me?.name" />
      <ProfKv k="Telefon" :v="me?.phone" />
      <ProfKv k="Lavozim" :v="profRoleText(me)" />
    </ProfCard>

    <template v-else>
      <ProfCard class="grid gap-3.5 p-4">
        <ProfField v-model="draft.name" label="Ism familiya" placeholder="Masalan: Aziz Rahimov" />
        <ProfField v-model="draft.phone" label="Telefon" type="tel" inputmode="tel" placeholder="+998 __ ___ __ __" />
      </ProfCard>
      <ProfBtn @click="save">Saqlash</ProfBtn>
    </template>
  </ProfPage>
</template>
