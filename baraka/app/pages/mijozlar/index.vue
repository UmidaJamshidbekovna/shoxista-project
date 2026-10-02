<script setup lang="ts">
import type { Channel } from '~/data/types'
import { channelLabel } from '~/data/labels'

const route = useRoute()
const router = useRouter()
const { customers, organizations, transactions, countsInTotal } = useStore()
const { selection } = useTelegram()

const tab = ref<'customers' | 'org'>(route.query.tab === 'org' ? 'org' : 'customers')
watch(tab, (v) => {
  router.replace({ query: { ...route.query, tab: v === 'org' ? 'org' : undefined } })
  filter.value = 'all'
  sort.value = 'name'
})
watch(() => route.query.tab, (v) => { tab.value = v === 'org' ? 'org' : 'customers' })

const q = ref('')
const filter = ref('all')
const sort = ref('name')
const sortOpen = ref(false)
const createCustomer = ref(false)
const createOrg = ref(false)

const customerFilters = [
  { value: 'all', label: 'Hammasi' },
  { value: 'debt', label: 'Qarzdorlar' },
  { value: 'balance', label: 'Balansi bor' },
  ...(Object.keys(channelLabel) as Channel[]).map(c => ({ value: `ch:${c}`, label: channelLabel[c] })),
]
const orgFilters = [
  { value: 'all', label: 'Hammasi' },
  { value: 'supplier', label: 'Ta\'minotchilar' },
  { value: 'client', label: 'Mijozlar' },
  { value: 'owesUs', label: 'Bizga qarz' },
  { value: 'weOwe', label: 'Biz qarzmiz' },
  { value: 'own', label: 'O\'zim yaratgan' },
]
const customerSorts = [
  { value: 'name', label: 'Ism bo\'yicha (A–Z)', icon: 'user' },
  { value: 'debt', label: 'Qarz bo\'yicha (ko\'pdan)', icon: 'wallet' },
  { value: 'last', label: 'Oxirgi xarid (yangidan)', icon: 'clock' },
  { value: 'total', label: 'Jami xarid (ko\'pdan)', icon: 'trend' },
] as const
const orgSorts = [
  { value: 'name', label: 'Nomi bo\'yicha (A–Z)', icon: 'building' },
  { value: 'debt', label: 'Balans bo\'yicha (kattadan)', icon: 'wallet' },
  { value: 'last', label: 'Oxirgi buyurtma (yangidan)', icon: 'clock' },
  { value: 'total', label: 'Jami aylanma (ko\'pdan)', icon: 'trend' },
] as const
const sorts = computed(() => tab.value === 'org' ? orgSorts : customerSorts)
const sortLabel = computed(() => sorts.value.find(s => s.value === sort.value)?.label.split(' (')[0])

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-я]/g, '')
const match = (...fields: string[]) => {
  const k = norm(q.value)
  return !k || fields.some(f => norm(f).includes(k))
}

const shownCustomers = computed(() => {
  const list = customers.value.filter((c) => {
    if (!match(c.name, c.phone)) return false
    if (filter.value === 'debt') return c.debt > 0
    if (filter.value === 'balance') return c.debt < 0
    if (filter.value.startsWith('ch:')) return c.channel === filter.value.slice(3)
    return true
  })
  return [...list].sort((a, b) => {
    if (sort.value === 'debt') return b.debt - a.debt
    if (sort.value === 'last') return b.lastVisit.localeCompare(a.lastVisit)
    if (sort.value === 'total') return b.totalSpent - a.totalSpent
    return a.name.localeCompare(b.name)
  })
})

const orgStats = computed(() => {
  const m: Record<string, { total: number, count: number, last: string }> = {}
  for (const t of transactions.value) {
    if (!t.orgId || !countsInTotal(t)) continue
    const s = (m[t.orgId] ??= { total: 0, count: 0, last: '' })
    s.total += t.total
    s.count++
    if (t.date > s.last) s.last = t.date
  }
  return m
})

const shownOrgs = computed(() => {
  const list = organizations.value.filter((o) => {
    if (!match(o.name, o.phone, o.inn, o.contact)) return false
    if (filter.value === 'supplier' || filter.value === 'client') return o.type === filter.value
    if (filter.value === 'owesUs') return o.balance < 0
    if (filter.value === 'weOwe') return o.balance > 0
    if (filter.value === 'own') return o.ownCreated
    return true
  })
  const st = orgStats.value
  return [...list].sort((a, b) => {
    if (sort.value === 'debt') return Math.abs(b.balance) - Math.abs(a.balance)
    if (sort.value === 'last') return (st[b.id]?.last ?? '').localeCompare(st[a.id]?.last ?? '')
    if (sort.value === 'total') return (st[b.id]?.total ?? 0) - (st[a.id]?.total ?? 0)
    return a.name.localeCompare(b.name)
  })
})

const summary = computed(() => tab.value === 'org'
  ? {
      owesUs: organizations.value.reduce((s, o) => s + Math.max(0, -o.balance), 0),
      weOwe: organizations.value.reduce((s, o) => s + Math.max(0, o.balance), 0),
      owesUsCount: organizations.value.filter(o => o.balance < 0).length,
      weOweCount: organizations.value.filter(o => o.balance > 0).length,
    }
  : {
      owesUs: customers.value.reduce((s, c) => s + Math.max(0, c.debt), 0),
      weOwe: customers.value.reduce((s, c) => s + Math.max(0, -c.debt), 0),
      owesUsCount: customers.value.filter(c => c.debt > 0).length,
      weOweCount: customers.value.filter(c => c.debt < 0).length,
    })

const count = computed(() => tab.value === 'org' ? shownOrgs.value.length : shownCustomers.value.length)

function onCreate() {
  selection()
  if (tab.value === 'org') createOrg.value = true
  else createCustomer.value = true
}
function pickSort(v: string) {
  sort.value = v
  sortOpen.value = false
  selection()
}
const lastLabel = (iso: string) => `${formatDay(iso)}, ${formatTime(iso)}`
</script>

<template>
  <div class="flex min-h-0 grow flex-col">
  <PageHeader title="Mijozlar" :subtitle="tab === 'org' ? 'Tashkilotlar va hamkorlar' : 'Xaridorlar, qarz va balanslar'" back="/">
    <RoundButton icon="plus" label="Qo'shish" variant="brand" @click="onCreate" />
  </PageHeader>

  <div class="flex shrink-0 flex-col gap-3 px-5 pb-3">
    <Segmented v-model="tab" :options="[{ value: 'customers', label: 'Mijozlar' }, { value: 'org', label: 'Tashkilotlar' }]" />

    <div class="grid grid-cols-2 gap-3">
      <button type="button" class="card flex flex-col gap-1 p-3.5 text-left" @click="filter = tab === 'org' ? 'owesUs' : 'debt'; sort = 'debt'">
        <span class="flex items-center gap-1.5 text-xs font-bold text-muted">
          <span class="flex size-6 items-center justify-center rounded-full bg-danger-soft text-danger"><AppIcon name="arrow-down" :size="14" /></span>
          Bizga qarz
        </span>
        <span class="text-[19px] leading-tight font-extrabold text-danger">{{ formatSom(summary.owesUs) }}</span>
        <span class="text-[11px] font-semibold text-muted">so'm · {{ summary.owesUsCount }} ta {{ tab === 'org' ? 'tashkilot' : 'mijoz' }}</span>
      </button>
      <button type="button" class="card flex flex-col gap-1 p-3.5 text-left" @click="filter = tab === 'org' ? 'weOwe' : 'balance'; sort = 'debt'">
        <span class="flex items-center gap-1.5 text-xs font-bold text-muted">
          <span class="flex size-6 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="arrow-up" :size="14" /></span>
          {{ tab === 'org' ? 'Biz qarzmiz' : 'Mijoz balanslari' }}
        </span>
        <span class="text-[19px] leading-tight font-extrabold text-brand">{{ formatSom(summary.weOwe) }}</span>
        <span class="text-[11px] font-semibold text-muted">so'm · {{ summary.weOweCount }} ta {{ tab === 'org' ? 'tashkilot' : 'mijoz' }}</span>
      </button>
    </div>

    <div class="flex items-center gap-2">
      <div class="grow">
        <BInput v-model="q" :placeholder="tab === 'org' ? 'Nomi, INN yoki telefon' : 'Ism yoki telefon'" icon="search" inputmode="search">
          <template #end>
            <button v-if="q" type="button" aria-label="Tozalash" class="text-muted" @click.prevent="q = ''"><AppIcon name="x" :size="18" /></button>
          </template>
        </BInput>
      </div>
      <RoundButton icon="sort" label="Saralash" :size="50" @click="sortOpen = true" />
    </div>
    <Chips v-model="filter" :options="tab === 'org' ? orgFilters : customerFilters" />
  </div>

  <div class="no-scrollbar min-h-0 grow overflow-y-auto px-5 pb-6">
    <div class="flex items-center justify-between pt-1 pb-2 text-xs font-bold text-muted">
      <span>{{ count }} ta {{ tab === 'org' ? 'tashkilot' : 'mijoz' }}</span>
      <button type="button" class="flex items-center gap-1 text-brand" @click="sortOpen = true">
        <AppIcon name="sort" :size="14" />{{ sortLabel }}
      </button>
    </div>

    <!-- Mijozlar -->
    <template v-if="tab === 'customers'">
      <div v-if="shownCustomers.length" class="card px-4">
        <NuxtLink
          v-for="c in shownCustomers" :key="c.id" :to="`/mijozlar/${c.id}`"
          class="flex items-center gap-3 border-b border-line py-3 last:border-b-0" @click="selection()"
        >
          <Avatar :name="c.name" :color="c.debt > 0 ? '#d92d20' : '#05472a'" />
          <div class="min-w-0 grow">
            <p class="truncate text-[15px] font-bold">{{ c.name }}</p>
            <p class="truncate text-xs font-medium text-muted">{{ c.phone }}</p>
            <p class="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-muted">
              <AppIcon name="clock" :size="12" />{{ lastLabel(c.lastVisit) }} · {{ channelLabel[c.channel] }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <template v-if="c.debt > 0">
              <p class="text-sm font-extrabold text-danger">{{ formatSom(c.debt) }}</p>
              <p class="text-[11px] font-bold text-danger/80">qarz</p>
            </template>
            <template v-else-if="c.debt < 0">
              <p class="text-sm font-extrabold text-brand">{{ formatSom(-c.debt) }}</p>
              <p class="text-[11px] font-bold text-brand/80">balans</p>
            </template>
            <p v-else class="text-xs font-bold text-muted">Hisob toza</p>
          </div>
        </NuxtLink>
      </div>
      <EmptyState v-else icon="users" title="Mijoz topilmadi" :text="q ? 'Qidiruv so\'zini o\'zgartirib ko\'ring' : 'Bu filtr bo\'yicha mijoz yo\'q'">
        <PillButton size="sm" variant="soft" icon="plus" class="mt-2" @click="createCustomer = true">Mijoz qo'shish</PillButton>
      </EmptyState>
    </template>

    <!-- Tashkilotlar -->
    <template v-else>
      <div v-if="shownOrgs.length" class="card px-4">
        <NuxtLink
          v-for="o in shownOrgs" :key="o.id" :to="`/tashkilotlar/${o.id}`"
          class="flex items-center gap-3 border-b border-line py-3 last:border-b-0" @click="selection()"
        >
          <Avatar :name="o.name.replace(/[^\p{L}\p{N}\s]/gu, '')" :color="o.logoColor" square />
          <div class="min-w-0 grow">
            <p class="truncate text-[15px] font-bold">{{ o.name }}</p>
            <div class="mt-0.5 flex items-center gap-1.5">
              <span class="text-xs font-semibold" :class="o.type === 'supplier' ? 'text-info' : 'text-muted-2'">{{ o.type === 'supplier' ? 'Ta\'minotchi' : 'Mijoz' }}</span>
              <Badge v-if="o.ownCreated" tone="warn">O'zim yaratgan</Badge>
            </div>
            <p v-if="orgStats[o.id]" class="mt-0.5 truncate text-[11px] font-semibold text-muted">
              {{ orgStats[o.id]!.count }} ta buyurtma · {{ formatDay(orgStats[o.id]!.last) }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <template v-if="o.balance > 0">
              <p class="text-sm font-extrabold text-danger">{{ formatSom(o.balance) }}</p>
              <p class="text-[11px] font-bold text-danger/80">biz qarz</p>
            </template>
            <template v-else-if="o.balance < 0">
              <p class="text-sm font-extrabold text-brand">{{ formatSom(-o.balance) }}</p>
              <p class="text-[11px] font-bold text-brand/80">bizga qarz</p>
            </template>
            <p v-else class="text-xs font-bold text-muted">Hisob toza</p>
          </div>
        </NuxtLink>
      </div>
      <EmptyState v-else icon="building" title="Tashkilot topilmadi" :text="q ? 'Qidiruv so\'zini o\'zgartirib ko\'ring' : 'Bu filtr bo\'yicha tashkilot yo\'q'">
        <PillButton size="sm" variant="soft" icon="plus" class="mt-2" @click="createOrg = true">Tashkilot qo'shish</PillButton>
      </EmptyState>

      <NuxtLink to="/taminotchilar" class="mt-3 flex items-center gap-3 rounded-[20px] bg-brand p-4 text-white shadow-float">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15"><AppIcon name="handshake" :size="22" /></span>
        <span class="min-w-0 grow">
          <span class="block text-[15px] font-extrabold">Yangi ta'minotchilar</span>
          <span class="block text-xs font-medium text-white/75">Platformadagi hamkorlarni toping va ulaning</span>
        </span>
        <AppIcon name="chevron-right" :size="20" />
      </NuxtLink>
    </template>
  </div>

  <BSheet v-model="sortOpen" title="Saralash">
    <div class="card px-4">
      <button
        v-for="s in sorts" :key="s.value" type="button"
        class="flex w-full items-center gap-3 border-b border-line py-3.5 text-left last:border-b-0"
        @click="pickSort(s.value)"
      >
        <span class="flex size-10 items-center justify-center rounded-full bg-soft text-brand"><AppIcon :name="s.icon" /></span>
        <span class="grow text-[15px] font-bold">{{ s.label }}</span>
        <span v-if="sort === s.value" class="flex size-6 items-center justify-center rounded-full bg-brand text-white"><AppIcon name="check" :size="14" /></span>
      </button>
    </div>
  </BSheet>

  <ContactCustomerSheet v-model="createCustomer" @saved="id => router.push(`/mijozlar/${id}`)" />
  <ContactOrgSheet v-model="createOrg" @saved="id => router.push(`/tashkilotlar/${id}`)" />
  </div>
</template>
