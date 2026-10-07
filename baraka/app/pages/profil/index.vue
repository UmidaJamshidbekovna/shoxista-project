<script setup lang="ts">
// Profil (Profile.md §1, §10): foydalanuvchi kartasi, tarif / ish joyi kartasi, menyu guruhlari, Chiqish
import type { IconName } from '~/components/AppIcon.vue'
import { permissionList, roleLabel } from '~/data/labels'
import { ONBOARDED_KEY } from '~/middleware/onboarding.global'

definePageMeta({ tab: true })

const store = useStore()
const { business, branches, warehouses, employees, chats, role } = store
const { me } = useProfMe()
const { show } = useToast()

const owner = computed(() => role.value === 'owner')
const qrOpen = ref(false)

const daysLeft = computed(() => profDaysLeft(business.value.planUntil))
const myBranch = computed(() => branches.value.find(b => b.id === me.value?.branchId))
const myPerms = computed(() => permissionList.filter(p => me.value?.permissions.includes(p.id)))
const supportId = computed(() => chats.value.find(c => c.kind === 'support')?.id)

interface Item { label: string, sub: string, icon: IconName, to: string }
const groups = computed(() => {
  const g: { title: string, items: Item[] }[] = []
  if (owner.value) {
    const manage: Item[] = [
      { label: 'Biznes akkaunt', sub: `${business.value.name} · ${business.value.owner}`, icon: 'store', to: '/profil/biznes' },
    ]
    if (branches.value.length > 1)
      manage.push({ label: 'Filiallar', sub: `${branches.value.length} ta filial · ish vaqti`, icon: 'store', to: '/profil/filiallar?tab=filial' })
    manage.push(
      { label: 'Omborlar', sub: `${warehouses.value.length} ta ombor`, icon: 'box', to: '/profil/filiallar?tab=ombor' },
      { label: 'Xodimlar', sub: `${employees.value.length} ta xodim · rollar va ruxsatlar`, icon: 'users', to: '/profil/xodimlar' },
      { label: 'Ijtimoiy tarmoqlar', sub: 'Instagram, Telegram · AI yordamchi', icon: 'link', to: '/profil/ijtimoiy' },
      { label: 'Do\'kon sozlamalari', sub: 'Valyuta, savdo, hisobot', icon: 'sliders', to: '/profil/sozlamalar?mode=store' },
    )
    g.push({ title: 'Boshqaruv', items: manage })
    g.push({ title: 'Hisob', items: [{ label: 'Obuna', sub: `${business.value.plan} tarif · ${daysLeft.value} kun qoldi`, icon: 'crown', to: '/profil/obuna' }] })
  }
  g.push({
    title: 'Umumiy',
    items: [
      { label: 'Ilova sozlamalari', sub: 'Mavzu, til, bildirishnomalar', icon: 'mobile', to: '/profil/sozlamalar?mode=app' },
      { label: 'Yordam', sub: 'Tizim admini bilan chat', icon: 'help', to: supportId.value ? `/chat/${supportId.value}` : '/chat' },
    ],
  })
  return g
})

function logout() {
  show('Hisobdan chiqildi')
  setTimeout(() => {
    try { localStorage.removeItem(ONBOARDED_KEY) }
    catch {}
    navigateTo('/onboarding', { replace: true })
  }, 700)
}

const roles = [{ value: 'owner', label: 'Egasi' }, { value: 'staff', label: 'Xodim' }] as const
</script>

<template>
  <ProfPage tab>
    <h1 class="text-[25px] leading-tight font-extrabold tracking-[-0.02em] text-ink">Profil</h1>

    <!-- 1.2 Foydalanuvchi kartasi -->
    <div
      role="link" tabindex="0" aria-label="Shaxsiy ma'lumotlar"
      class="flex cursor-pointer items-center gap-[14px] rounded-3xl bg-card p-4 shadow-[0_2px_10px_rgba(5,71,42,0.05)] transition-transform active:scale-[0.99]"
      @click="navigateTo('/profil/shaxsiy')" @keydown.enter="navigateTo('/profil/shaxsiy')"
    >
      <ProfAvatar :name="me?.name ?? ''" :src="me?.avatar" :size="62" :font="20" />
      <span class="min-w-0 grow">
        <span class="block truncate text-[17px] font-extrabold text-ink">{{ me?.name }}</span>
        <span class="mt-0.5 block truncate text-[12.5px] text-muted">{{ profRoleText(me) }} · {{ me?.phone }}</span>
      </span>
      <button
        type="button" aria-label="Do'kon QR kodi"
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand transition-transform active:scale-95"
        @click.stop="qrOpen = true"
      >
        <AppIcon name="qr" :size="18" :stroke="1.8" />
      </button>
    </div>

    <!-- 1.3 Tarif kartasi (faqat egasi) -->
    <NuxtLink v-if="owner" to="/profil/obuna" class="flex items-center gap-3 rounded-[22px] bg-brand p-4 text-white transition-transform active:scale-[0.99]">
      <span class="flex size-[42px] shrink-0 items-center justify-center rounded-[13px] bg-white/12 text-[#4ade80]">
        <AppIcon name="crown" :size="20" :stroke="1.9" />
      </span>
      <span class="min-w-0 grow">
        <span class="block truncate text-[14px] font-extrabold">{{ business.plan }} tarif faol</span>
        <span class="mt-0.5 block truncate text-[12px] text-[#aab0b8]">Keyingi to'lov {{ profDateUz(business.planUntil) }} · {{ daysLeft }} kun qoldi</span>
      </span>
      <AppIcon name="chevron-right" :size="16" :stroke="2.2" class="shrink-0 text-[#aab0b8]" />
    </NuxtLink>

    <!-- 1.4 Ish joyi kartasi (faqat xodim) -->
    <ProfSection v-else title="Ish joyi">
      <ProfCard class="grid gap-3 p-4">
        <div class="flex items-center gap-3">
          <ProfAvatar :name="business.name" :src="business.logo" :size="46" :radius="14" :font="15" :bg="business.logoColor" color="#fff" />
          <div class="min-w-0 grow">
            <p class="truncate text-[15.5px] font-extrabold text-ink">{{ business.name }}</p>
            <p class="truncate text-[12px] text-muted">{{ myBranch?.name ?? '—' }}</p>
          </div>
          <span v-if="me" class="shrink-0 rounded-full bg-soft px-2.5 py-1 text-[11px] font-extrabold text-brand">{{ roleLabel[me.role] }}</span>
        </div>
        <div class="grid gap-2 border-t border-[#f0f1f4] pt-3">
          <p class="text-[12.5px] font-bold text-[#5b616b]">Ruxsatlar</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="p in myPerms" :key="p.id" class="rounded-[10px] bg-[#f4f6f9] px-2.5 py-1 text-[12px] font-bold text-[#374151]">{{ p.label }}</span>
            <span v-if="!myPerms.length" class="text-[12px] text-muted">Ruxsat berilmagan</span>
          </div>
          <p class="text-[11.5px] text-muted">Ruxsatlarni do'kon egasi boshqaradi.</p>
        </div>
      </ProfCard>
    </ProfSection>

    <!-- 1.5 Menyu guruhlari -->
    <ProfSection v-for="g in groups" :key="g.title" :title="g.title">
      <ProfCard class="px-[14px] py-1">
        <ProfMenuRow v-for="i in g.items" :key="i.label" v-bind="i" />
      </ProfCard>
    </ProfSection>

    <!-- 1.6 Chiqish -->
    <button type="button" class="h-[50px] rounded-full bg-[#fdecec] text-[14px] font-extrabold text-[#d93036] transition-transform active:scale-[0.98]" @click="logout">
      Chiqish
    </button>

    <!-- Demo: rolni almashtirish (Egasi / Xodim ko'rinishini sinash uchun) -->
    <div class="flex items-center justify-center gap-2 text-[11.5px] text-muted">
      <span>Demo: rol</span>
      <span class="flex rounded-full bg-field p-0.5">
        <button
          v-for="r in roles" :key="r.value" type="button"
          class="h-6 rounded-full px-2.5 text-[11px] font-bold transition-colors"
          :class="role === r.value ? 'bg-card text-ink shadow-sm' : 'text-muted'"
          @click="role = r.value"
        >{{ r.label }}</button>
      </span>
    </div>

    <ProfQrSheet v-model="qrOpen" />
  </ProfPage>
</template>
