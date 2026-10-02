<script setup lang="ts">
import { permissionList, planLimits, roleLabel } from '~/data/labels'

definePageMeta({ tab: true })

const store = useStore()
const { business, branches, employees, products, role, currentBranchId } = store
const { user, selection, haptic } = useTelegram()

const userName = computed(() => user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : business.value.owner)
const userHandle = computed(() => user?.username ? `@${user.username}` : business.value.phone)

const limits = computed(() => planLimits[business.value.plan])
const daysLeft = computed(() => Math.max(0, Math.ceil((new Date(business.value.planUntil).getTime() - Date.now()) / 86400000)))

const branch = computed(() => store.branchById(currentBranchId.value))
const staffPerms = ['sales', 'customers', 'orders', 'chat']

const ownerMenu = computed(() => [
  { icon: 'store', title: 'Biznes akkaunt', subtitle: `@${business.value.username}`, to: '/profil/biznes' },
  { icon: 'map-pin', title: 'Filiallar', subtitle: 'Manzil, ish vaqti, mas\'ul', value: String(branches.value.length), to: '/profil/filiallar' },
  { icon: 'warehouse', title: 'Omborlar', subtitle: 'Ombor va mas\'ullar', value: String(store.warehouses.value.length), to: '/profil/omborlar' },
  { icon: 'users', title: 'Xodimlar', subtitle: 'Rollar va ruxsatlar', value: String(employees.value.length), to: '/profil/xodimlar' },
  { icon: 'telegram', title: 'Ijtimoiy tarmoqlar', subtitle: 'Telegram, Instagram', to: '/profil/ijtimoiy' },
  { icon: 'settings', title: 'Do\'kon sozlamalari', subtitle: 'Valyuta, B2B, hisobotlar', to: '/profil/dokon' },
  { icon: 'crown', title: 'Obuna', subtitle: `${business.value.plan} tarifi`, to: '/profil/obuna' },
] as const)

const logoutOpen = ref(false)
function logout() {
  haptic('medium')
  try { localStorage.removeItem('baraka:onboarded') } catch {}
  logoutOpen.value = false
  navigateTo('/onboarding')
}
</script>

<template>
  <PageHeader title="Profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <!-- Foydalanuvchi -->
    <div class="card flex items-center gap-3 p-4">
      <Avatar :name="userName" :src="user?.photo_url" :size="56" />
      <div class="min-w-0 grow">
        <p class="truncate text-[17px] font-extrabold">{{ userName }}</p>
        <p class="truncate text-[13px] font-medium text-muted">{{ userHandle }}</p>
      </div>
      <Badge :tone="role === 'owner' ? 'solid' : 'info'">{{ role === 'owner' ? 'Egasi' : 'Kassir' }}</Badge>
    </div>

    <!-- Demo rol almashtirish -->
    <div class="flex items-center gap-3 rounded-[18px] border border-dashed border-[#c9d6ce] px-4 py-2.5">
      <span class="shrink-0 text-xs font-bold text-muted-2">Rol (demo):</span>
      <Segmented v-model="role" class="grow" :options="[{ value: 'owner', label: 'Egasi' }, { value: 'staff', label: 'Xodim' }]" />
    </div>

    <template v-if="role === 'owner'">
      <!-- Tarif kartasi -->
      <NuxtLink to="/profil/obuna" class="relative overflow-hidden rounded-[24px] bg-brand p-5 text-white shadow-float" @click="selection()">
        <span class="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-white/8" />
        <span class="pointer-events-none absolute -right-2 bottom-[-40px] size-24 rounded-full bg-white/6" />
        <div class="relative flex items-center gap-3">
          <span class="flex size-11 items-center justify-center rounded-full bg-white/15"><AppIcon name="crown" :size="22" /></span>
          <div class="grow">
            <p class="text-xs font-bold text-white/70">Joriy tarif</p>
            <p class="text-[22px] leading-tight font-extrabold">{{ business.plan }}</p>
          </div>
          <span class="rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold">{{ formatDate(business.planUntil) }} gacha</span>
        </div>
        <div class="relative mt-4 flex flex-col gap-3">
          <ProfLimitBar dark label="Xodimlar" :used="employees.length" :limit="limits.employees" />
          <ProfLimitBar dark label="Filiallar" :used="branches.length" :limit="limits.branches" />
          <ProfLimitBar dark label="Mahsulotlar" :used="products.length" :limit="limits.products" />
        </div>
        <div class="relative mt-4 flex items-center justify-between text-[13px] font-bold">
          <span class="text-white/75">{{ daysLeft }} kun qoldi</span>
          <span class="flex items-center gap-1">Tarifni boshqarish <AppIcon name="chevron-right" :size="16" /></span>
        </div>
      </NuxtLink>

      <div class="card px-4 py-1">
        <ListRow v-for="m in ownerMenu" :key="m.to" v-bind="m" @click="selection()" />
      </div>
    </template>

    <template v-else>
      <!-- Ish joyi (faqat ko'rish) -->
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <Avatar :name="business.name" :color="business.logoColor" square :size="52" />
          <div class="min-w-0 grow">
            <p class="text-xs font-bold text-muted">Ish joyi</p>
            <p class="truncate text-[17px] font-extrabold">{{ business.name }}</p>
          </div>
          <Badge><AppIcon name="eye" :size="12" />Faqat ko'rish</Badge>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2.5">
          <div class="rounded-2xl bg-field p-3">
            <p class="text-[11px] font-bold text-muted">Filial</p>
            <p class="text-sm font-extrabold">{{ branch?.name ?? '—' }}</p>
          </div>
          <div class="rounded-2xl bg-field p-3">
            <p class="text-[11px] font-bold text-muted">Rol</p>
            <p class="text-sm font-extrabold">{{ roleLabel.cashier }}</p>
          </div>
        </div>
        <p class="mt-4 mb-2 text-[13px] font-bold text-muted-2">Ruxsatlar</p>
        <ul class="flex flex-col gap-2">
          <li v-for="p in permissionList" :key="p.id" class="flex items-center gap-2.5 text-sm font-semibold" :class="staffPerms.includes(p.id) ? 'text-ink' : 'text-muted'">
            <span class="flex size-6 items-center justify-center rounded-full" :class="staffPerms.includes(p.id) ? 'bg-soft text-brand' : 'bg-field text-muted'">
              <AppIcon :name="staffPerms.includes(p.id) ? 'check' : 'x'" :size="14" :stroke="2.6" />
            </span>
            {{ p.label }}
          </li>
        </ul>
        <p class="mt-3 flex items-start gap-1.5 text-xs font-medium text-muted">
          <AppIcon name="info" :size="14" class="mt-px shrink-0" />Ruxsatlarni faqat biznes egasi o'zgartira oladi.
        </p>
      </div>
    </template>

    <SectionHead title="Umumiy" class="mt-1" />
    <div class="card px-4 py-1">
      <ListRow icon="settings" title="Ilova sozlamalari" subtitle="Mavzu, til, bildirishnomalar" to="/profil/sozlamalar" />
      <ListRow icon="headset" title="Yordam" subtitle="Qo'llab-quvvatlash bilan chat" to="/chat" />
      <ListRow icon="logout" title="Chiqish" danger :chevron="false" @click="logoutOpen = true" />
    </div>
    <p class="text-center text-[11px] font-semibold text-muted">Baraka Store Manager · v1.0.0</p>
  </div>

  <BSheet v-model="logoutOpen" title="Chiqish">
    <div class="flex flex-col items-center gap-2 py-3 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="logout" :size="26" /></span>
      <p class="text-base font-extrabold">Hisobdan chiqasizmi?</p>
      <p class="text-[13px] font-medium text-muted">Qayta kirish uchun onboarding bosqichidan o'tishingiz kerak bo'ladi.</p>
    </div>
    <template #footer>
      <div class="flex gap-2.5">
        <PillButton variant="field" class="grow basis-0" @click="logoutOpen = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" @click="logout">Chiqish</PillButton>
      </div>
    </template>
  </BSheet>
</template>
