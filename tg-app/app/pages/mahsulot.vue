<script setup lang="ts">
import { products } from '~/data/products'

const route = useRoute()
const router = useRouter()
const { notify, selection, scanQr } = useTelegram()

// ?id=N bo'lsa — tahrirlash, aks holda yangi mahsulot
const product = products.find(p => p.id === Number(route.query.id))
const units = ['dona', 'kg', 'litr', 'qadoq']

const num = (v: string) => Number(v.replace(/\D/g, '')) || 0
const form = reactive({
  name: product?.name ?? '',
  category: product?.category ?? '',
  barcode: product ? `47800${String(product.id).padStart(8, '0')}` : '',
  price: product ? formatSom(product.price) : '',
  cost: product ? formatSom(Math.round((product.price * 0.784) / 100) * 100) : '',
  unit: product?.unit ?? 'dona',
  stock: product ? String(product.stock) : '',
  minStock: product ? '20' : '',
  supplier: product ? (product.category === 'Sut mahsulotlari' ? 'Oq Suv Sut MChJ' : 'Baraka Savdo MChJ') : '',
  online: true,
})

// Narx maydonlarini "12 500" ko'rinishida saqlash
function onMoney(key: 'price' | 'cost', e: Event) {
  const v = num((e.target as HTMLInputElement).value)
  form[key] = v ? formatSom(v) : ''
}

const margin = computed(() => {
  const price = num(form.price)
  const cost = num(form.cost)
  if (!price || !cost) return null
  return { pct: Math.trunc(((price - cost) / cost) * 1000) / 10, profit: price - cost }
})

async function onScan() {
  const code = await scanQr()
  if (code) form.barcode = code
}

function save() {
  notify('success')
  router.push('/ombor')
}
</script>

<template>
  <ScreenHeader title="Mahsulot" back="/ombor">
    <IconButton icon="file" label="Tarix" to="/tarix" />
  </ScreenHeader>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pb-3">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="flex size-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-[18px] border-[1.5px] border-dashed border-[#B9B5A9] bg-surface text-[11px] font-semibold text-muted"
        @click="selection()"
      >
        <AppIcon name="camera" :size="22" />Rasm
      </button>
      <label class="flex min-w-0 grow flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Nomi</span>
        <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
          <input v-model="form.name" type="text" placeholder="Sut 2.5% 1 L" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        </span>
      </label>
    </div>

    <label class="flex flex-col gap-1.5">
      <span class="text-[13px] font-semibold text-muted">Kategoriya</span>
      <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
        <input v-model="form.category" type="text" list="mahsulot-kategoriya" placeholder="Sut mahsulotlari" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        <AppIcon name="chevron-right" :size="18" class="text-muted" />
      </span>
      <datalist id="mahsulot-kategoriya">
        <option v-for="c in ['Oziq-ovqat', 'Ichimliklar', 'Sut mahsulotlari', 'Maishiy']" :key="c" :value="c" />
      </datalist>
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-[13px] font-semibold text-muted">Shtrix-kod</span>
      <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
        <input v-model="form.barcode" type="text" inputmode="numeric" placeholder="4780012345678" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        <button type="button" aria-label="Shtrix-kodni skanerlash" class="flex text-brand" @click.prevent="onScan">
          <AppIcon name="barcode" />
        </button>
      </span>
    </label>

    <div class="flex gap-2.5">
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Sotuv narxi</span>
        <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
          <input :value="form.price" type="text" inputmode="numeric" placeholder="12 500" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60" @input="onMoney('price', $event)">
          <span class="text-[13px] text-muted">so'm</span>
        </span>
      </label>
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Tannarx</span>
        <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
          <input :value="form.cost" type="text" inputmode="numeric" placeholder="9 800" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60" @input="onMoney('cost', $event)">
          <span class="text-[13px] text-muted">so'm</span>
        </span>
      </label>
    </div>

    <div
      v-if="margin"
      class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold"
      :class="margin.profit >= 0 ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger'"
    >
      <AppIcon name="percent" :size="16" />
      Ustama {{ margin.pct }}% · har biridan {{ formatSom(margin.profit) }} so'm foyda
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-[13px] font-semibold text-muted">O'lchov birligi</span>
      <div class="flex gap-2">
        <button
          v-for="u in units" :key="u" type="button"
          class="h-10 grow basis-0 rounded-xl text-sm font-semibold"
          :class="form.unit === u ? 'border-2 border-brand bg-brand-soft text-brand' : 'border border-line bg-surface text-ink'"
          @click="form.unit = u; selection()"
        >
          {{ u }}
        </button>
      </div>
    </div>

    <div class="flex gap-2.5">
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Qoldiq</span>
        <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
          <input v-model="form.stock" type="text" inputmode="decimal" placeholder="0" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        </span>
      </label>
      <label class="flex min-w-0 grow basis-0 flex-col gap-1.5">
        <span class="text-[13px] font-semibold text-muted">Min. qoldiq</span>
        <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
          <input v-model="form.minStock" type="text" inputmode="decimal" placeholder="20" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        </span>
        <span class="mt-1.5 text-xs text-muted">Shundan kam bo'lsa ogohlantiradi</span>
      </label>
    </div>

    <label class="flex flex-col gap-1.5">
      <span class="text-[13px] font-semibold text-muted">Ta'minotchi</span>
      <span class="flex h-[50px] items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5">
        <input v-model="form.supplier" type="text" placeholder="Oq Suv Sut MChJ" class="min-w-0 grow bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/60">
        <AppIcon name="chevron-right" :size="18" class="text-muted" />
      </span>
    </label>

    <label class="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <span class="flex flex-col">
        <span class="text-[15px] font-semibold">Onlayn do'konda ko'rsatish</span>
        <span class="text-xs text-muted">Mijoz ilovasida chiqadi</span>
      </span>
      <input v-model="form.online" type="checkbox" class="size-[22px] accent-brand" @change="selection()">
    </label>
  </div>

  <div class="pb-safe flex shrink-0 border-t border-line bg-surface">
    <div class="flex grow px-5 pt-3 pb-5">
      <AppButton icon="check" @click="save">Saqlash</AppButton>
    </div>
  </div>
</template>
