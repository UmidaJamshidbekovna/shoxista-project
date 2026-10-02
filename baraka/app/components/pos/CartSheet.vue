<script setup lang="ts">
// To'liq savat: qatorlar, mijoz, chegirma, jami
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ edit: [productId: string], discount: [], customer: [], pay: [] }>()
const { cart, lines, count, subtotal, total, customer, setQty, remove, clampDiscount, resetActive } = usePos()
const { show } = useToast()
const confirmClear = ref(false)
watch(open, () => { confirmClear.value = false })

function clear() {
  if (!confirmClear.value) return (confirmClear.value = true)
  resetActive()
  confirmClear.value = false
  show('Savat tozalandi', 'info')
}
function changeQty(id: string, q: number) {
  setQty(id, q)
  clampDiscount()
}
</script>

<template>
  <BSheet v-model="open" :title="`${cart.label} · ${count} ta`" full>
    <div class="flex flex-col gap-3">
      <button type="button" class="flex items-center gap-3 rounded-[18px] bg-card p-3 text-left shadow-card" @click="emit('customer')">
        <Avatar v-if="customer" :name="customer.name" :size="42" />
        <Avatar v-else icon="user" :size="42" color="#8b9099" />
        <span class="min-w-0 grow">
          <span class="block truncate text-[15px] font-extrabold">{{ customer?.name ?? 'Mijoz tanlash' }}</span>
          <span class="block truncate text-xs font-semibold text-muted">{{ customer?.phone ?? 'Ixtiyoriy · qarzga sotish uchun majburiy' }}</span>
        </span>
        <Badge v-if="customer && customer.debt > 0" tone="danger">Qarz {{ formatSom(customer.debt) }}</Badge>
        <Badge v-else-if="customer && customer.debt < 0" tone="brand">Balans {{ formatSom(-customer.debt) }}</Badge>
        <AppIcon name="chevron-right" :size="18" class="shrink-0 text-muted" />
      </button>

      <EmptyState v-if="!lines.length" icon="cart" title="Savat bo'sh" text="Mahsulotlarni skaner, kamera, ovoz yoki qidiruv orqali qo'shing" />

      <div v-else class="card px-3">
        <div v-for="l in lines" :key="l.productId" class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
          <button type="button" class="flex min-w-0 grow items-center gap-3 text-left" @click="emit('edit', l.productId)">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-field text-2xl">{{ l.product.emoji }}</span>
            <span class="min-w-0 grow">
              <span class="block truncate text-[14px] font-bold">{{ l.product.name }}</span>
              <span class="flex items-center gap-1 text-xs font-semibold text-muted">
                {{ formatSom(l.price) }} × {{ l.qty }}
                <span v-if="l.price !== l.product.price" class="text-warn">· narx o'zgartirilgan</span>
                <AppIcon name="edit" :size="12" />
              </span>
              <span class="block text-[14px] font-extrabold text-ink">{{ formatSom(l.price * l.qty) }} so'm</span>
            </span>
          </button>
          <PosStepper
            :model-value="l.qty" :max="l.product.stock" size="sm"
            @update:model-value="changeQty(l.productId, $event)"
            @limit="show(`Omborda faqat ${l.product.stock} ${l.product.unit} bor`, 'error')"
          />
        </div>
      </div>

      <template v-if="lines.length">
        <div role="button" tabindex="0" class="flex cursor-pointer items-center gap-3 rounded-[18px] bg-card p-3 text-left shadow-card" @click="emit('discount')" @keydown.enter="emit('discount')">
          <span class="flex size-10 items-center justify-center rounded-full bg-soft text-brand"><AppIcon name="percent" :size="18" /></span>
          <span class="grow text-[15px] font-bold">Chegirma</span>
          <span class="text-[14px] font-extrabold" :class="cart.discount ? 'text-brand' : 'text-muted'">{{ cart.discount ? `−${formatSom(cart.discount)} so'm` : 'Qo\'shish' }}</span>
          <button v-if="cart.discount" type="button" aria-label="Chegirmani olib tashlash" class="flex size-7 items-center justify-center rounded-full bg-field text-muted" @click.stop="cart.discount = 0">
            <AppIcon name="x" :size="14" />
          </button>
        </div>

        <div class="card flex flex-col gap-2 p-4">
          <div class="flex justify-between text-[14px] font-semibold text-muted-2"><span>Mahsulotlar ({{ count }})</span><span>{{ formatSom(subtotal) }} so'm</span></div>
          <div v-if="cart.discount" class="flex justify-between text-[14px] font-semibold text-brand"><span>Chegirma</span><span>−{{ formatSom(cart.discount) }} so'm</span></div>
          <div class="mt-1 flex items-end justify-between border-t border-dashed border-line pt-3">
            <span class="text-[15px] font-extrabold">Jami</span>
            <span class="text-[26px] leading-none font-extrabold">{{ formatSom(total) }} <span class="text-sm">so'm</span></span>
          </div>
        </div>

        <button
          type="button" class="flex h-11 items-center justify-center gap-2 rounded-full text-[13px] font-bold"
          :class="confirmClear ? 'bg-danger text-white' : 'text-danger'" @click="clear"
        >
          <AppIcon name="trash" :size="16" /> {{ confirmClear ? 'Rostdan ham tozalansinmi? Tasdiqlash' : 'Savatni tozalash' }}
        </button>
      </template>
      <p class="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted">
        <AppIcon name="shield" :size="13" /> Savat serverda saqlanadi — qurilma almashsa ham yo'qolmaydi
      </p>
    </div>
    <template #footer>
      <PillButton block icon="wallet" :disabled="!lines.length" @click="emit('pay')">
        To'lovga o'tish · {{ formatSom(total) }} so'm
      </PillButton>
    </template>
  </BSheet>
</template>
