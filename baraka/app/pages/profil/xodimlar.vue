<script setup lang="ts">
// Xodimlar (Profile.md §6): statistika, xodim kartalari, xodim sheet (staffEdit)
import { permissionList, planLimits, roleLabel } from '~/data/labels'

const { employees, business } = useStore()
const { show } = useToast()

const activeCount = computed(() => employees.value.filter(e => e.active).length)
/** Tarif limiti egasidan tashqari xodimlarga qo'llanadi */
const staffCount = computed(() => employees.value.filter(e => e.role !== 'owner').length)
const limit = computed(() => planLimits[business.value.plan].employees)

const list = computed(() => [...employees.value].sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner')))
const permLabel = (id: string) => permissionList.find(p => p.id === id)?.label ?? id

const sheetOpen = ref(false)
const editId = ref<string>()

function add() {
  if (staffCount.value >= limit.value) return show(`${business.value.plan} tarifida ${profLimit(limit.value)} ta xodim — tarifni yangilang`, 'error')
  editId.value = undefined
  sheetOpen.value = true
}
function edit(id: string) {
  editId.value = id
  sheetOpen.value = true
}
</script>

<template>
  <ProfPage>
    <ProfHeader title="Xodimlar">
      <ProfIconBtn icon="plus" label="Yangi xodim" tone="brand" @click="add" />
    </ProfHeader>

    <div class="grid grid-cols-2 gap-2.5">
      <div class="rounded-[18px] bg-card p-4 shadow-[0_2px_10px_rgba(5,71,42,0.05)]">
        <p class="text-[20px] leading-tight font-extrabold text-ink">{{ activeCount }}</p>
        <p class="mt-0.5 text-[12px] text-muted">Faol xodimlar</p>
      </div>
      <NuxtLink to="/profil/obuna" class="rounded-[18px] bg-card p-4 shadow-[0_2px_10px_rgba(5,71,42,0.05)]">
        <p class="text-[20px] leading-tight font-extrabold text-ink">{{ staffCount }} / {{ profLimit(limit) }}</p>
        <p class="mt-0.5 text-[12px] text-muted">Tarif limiti</p>
      </NuxtLink>
    </div>

    <div class="grid gap-2.5">
      <article v-for="e in list" :key="e.id" class="grid gap-3 rounded-[22px] bg-card p-[14px] shadow-[0_2px_10px_rgba(5,71,42,0.05)]" :class="!e.active && 'opacity-70'">
        <div class="flex items-center gap-3">
          <ProfAvatar :name="e.name" :src="e.avatar" :size="46" :font="15" />
          <div class="min-w-0 grow">
            <p class="truncate text-[14px] font-extrabold text-ink">{{ e.name }}</p>
            <p class="truncate text-[12px] text-muted">{{ e.phone }}</p>
          </div>
          <span v-if="e.role === 'owner'" class="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-white">Egasi</span>
          <template v-else>
            <ProfIconBtn icon="edit" label="Tahrirlash" tone="field" :size="36" :icon-size="16" @click="edit(e.id)" />
            <ProfToggle v-model="e.active" :label="e.active ? 'Faol' : 'Nofaol'" />
          </template>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span class="rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[11.5px] font-extrabold text-[#15803d]">{{ e.role === 'owner' ? 'Do\'kon egasi' : roleLabel[e.role] }}</span>
          <span v-if="e.role === 'owner'" class="rounded-full bg-field px-2.5 py-1 text-[11.5px] font-semibold text-[#5b616b]">Barcha ruxsatlar</span>
          <template v-else>
            <span v-for="p in e.permissions" :key="p" class="rounded-full bg-field px-2.5 py-1 text-[11.5px] font-semibold text-[#5b616b]">{{ permLabel(p) }}</span>
          </template>
        </div>
      </article>
    </div>

    <ProfStaffSheet v-model="sheetOpen" :employee-id="editId" />
  </ProfPage>
</template>
