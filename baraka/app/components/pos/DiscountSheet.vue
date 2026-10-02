<script setup lang="ts">
// Chegirma: so'mda yoki foizda
const open = defineModel<boolean>({ default: false })
const { cart, subtotal } = usePos()
const { show } = useToast()

const mode = ref<'sum' | 'pct'>('sum')
const value = ref('')
watch(open, (v) => {
  if (v) { mode.value = 'sum'; value.value = cart.value.discount ? String(cart.value.discount) : '' }
})

const n = computed(() => Number(String(value.value).replace(/\s/g, '').replace(',', '.')))
const amount = computed(() => {
  if (!Number.isFinite(n.value)) return 0
  return Math.round(mode.value === 'pct' ? subtotal.value * n.value / 100 : n.value)
})
const error = computed(() => {
  if (!String(value.value).trim()) return ''
  if (!Number.isFinite(n.value) || n.value < 0) return 'Noto\'g\'ri qiymat'
  if (mode.value === 'pct' && n.value > 100) return 'Foiz 100 dan oshmasin'
  if (amount.value > subtotal.value) return 'Chegirma summadan oshmasin'
  return ''
})
const presets = computed(() => mode.value === 'pct' ? ['5', '10', '15', '20'] : ['1000', '5000', '10000'].filter(x => Number(x) <= subtotal.value))

function save() {
  if (error.value) return
  cart.value.discount = amount.value
  show(amount.value ? 'Chegirma qo\'llandi' : 'Chegirma olib tashlandi')
  open.value = false
}
</script>

<template>
  <BSheet v-model="open" title="Chegirma">
    <div class="flex flex-col gap-3">
      <Segmented v-model="mode" :options="[{ value: 'sum', label: 'So\'mda' }, { value: 'pct', label: 'Foizda' }]" @update:model-value="value = ''" />
      <BInput v-model="value" :suffix="mode === 'pct' ? '%' : 'so\'m'" inputmode="decimal" placeholder="0" :error="error" :hint="`Jami: ${formatSom(subtotal)} so'm`" />
      <div class="flex gap-2">
        <button
          v-for="p in presets" :key="p" type="button" class="h-9 grow rounded-full bg-card text-[13px] font-bold text-muted-2 shadow-card"
          @click="value = p"
        >
          {{ mode === 'pct' ? `${p}%` : formatSom(Number(p)) }}
        </button>
      </div>
      <div class="flex items-center justify-between rounded-2xl bg-soft px-4 py-3 text-brand">
        <span class="text-[13px] font-bold">Chegirma</span>
        <span class="text-[17px] font-extrabold">−{{ formatSom(error ? 0 : amount) }} so'm</span>
      </div>
    </div>
    <template #footer>
      <PillButton block icon="check" :disabled="!!error" @click="save">Qo'llash</PillButton>
    </template>
  </BSheet>
</template>
