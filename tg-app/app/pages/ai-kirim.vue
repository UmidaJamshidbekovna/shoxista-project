<script setup lang="ts">
definePageMeta({ tab: true })

const { haptic, notify, selection, scanQr } = useTelegram()
const router = useRouter()

const modes = ['Surat (AI)', 'Shtrix-kod', "Qo'lda"]
const mode = ref(modes[0])

// AI aniqlagan nakladnoy qatorlari (price: null — o'qilmagan)
const items = ref([
  { name: 'Sut 2.5% 1 L', qty: 40, price: 9800 as number | null, ok: true },
  { name: 'Qatiq 0.5 L', qty: 24, price: 6200, ok: true },
  { name: 'Tvorog 200 g', qty: 20, price: 11500, ok: true },
  { name: 'Qaymoq 20% 400 g', qty: 12, price: null, ok: true },
  { name: 'Yogurt, yangi', qty: 18, price: 5900, ok: true, isNew: true },
])

const unchecked = computed(() => items.value.filter(i => i.price == null).length)
const total = computed(() => items.value.reduce((s, i) => s + (i.ok && i.price ? i.qty * i.price : 0), 0))

function toggle(i: (typeof items.value)[number]) {
  if (i.price == null) return
  i.ok = !i.ok
  haptic()
}

function retake() {
  scanQr('Nakladnoyni suratga oling')
}

function confirm() {
  notify('success')
  router.push('/ombor')
}
</script>

<template>
  <ScreenHeader title="AI Kirim" subtitle="Nakladnoyni suratga oling">
    <IconButton icon="history" label="Kirim tarixi" to="/tarix" />
  </ScreenHeader>

  <div class="mx-5 flex shrink-0 gap-1 rounded-[14px] bg-[#E8E5DC] p-1">
    <button
      v-for="m in modes" :key="m" type="button"
      class="h-9 grow basis-0 rounded-[10px] text-sm font-semibold"
      :class="mode === m ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(23,25,30,0.12)]' : 'bg-transparent text-muted'"
      @click="mode = m; selection()"
    >
      {{ m }}
    </button>
  </div>

  <div class="no-scrollbar flex min-h-0 grow flex-col gap-3 overflow-y-auto px-5 pt-3.5 pb-3">
    <div class="flex items-stretch gap-3">
      <!-- Nakladnoy miniatyurasi -->
      <div class="relative flex h-[124px] w-24 shrink-0 flex-col gap-[5px] rounded-[14px] border border-line bg-surface p-2.5">
        <div class="h-1.5 w-[60%] rounded-[3px] bg-[#D9D5CA]" />
        <div class="h-1 w-[80%] rounded-sm bg-track" />
        <div class="h-1 rounded-sm bg-brand-soft" />
        <div class="h-1 rounded-sm bg-brand-soft" />
        <div class="h-1 rounded-sm bg-brand-soft" />
        <div class="h-1 rounded-sm bg-warn-soft" />
        <div class="h-1 rounded-sm bg-info-soft" />
        <div class="mt-auto h-1 w-[40%] self-end rounded-sm bg-[#D9D5CA]" />
        <span class="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full bg-brand text-white">
          <AppIcon name="sparkle" :size="16" />
        </span>
      </div>
      <div class="flex grow flex-col justify-center gap-1.5">
        <div class="flex items-center gap-1.5 text-[13px] font-bold text-brand">
          <AppIcon name="sparkle" :size="16" />AI {{ items.length }} ta mahsulotni aniqladi
        </div>
        <div class="text-[17px] font-bold">Oq Suv Sut MChJ</div>
        <div class="text-[13px] text-muted">Nakladnoy №1182 · 23.09.2026</div>
        <button
          type="button"
          class="flex h-[34px] items-center gap-1.5 self-start rounded-[10px] border border-line bg-surface px-3 text-[13px] font-semibold text-ink"
          @click="retake"
        >
          <AppIcon name="camera" :size="16" />Qayta suratga olish
        </button>
      </div>
    </div>

    <div class="rounded-[18px] border border-line bg-surface px-3.5 pt-0.5 pb-3.5">
      <div v-for="i in items" :key="i.name" class="flex items-center gap-2.5 border-b border-line py-[11px]">
        <button
          type="button" :aria-label="i.ok ? 'Belgini olib tashlash' : 'Belgilash'"
          class="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] text-white"
          :class="i.price == null ? 'bg-warn' : i.ok ? 'bg-brand' : 'border-2 border-line bg-surface'"
          @click="toggle(i)"
        >
          <AppIcon v-if="i.price == null" name="alert" :size="14" :stroke="2.5" />
          <AppIcon v-else-if="i.ok" name="check" :size="14" :stroke="3" />
        </button>
        <div class="min-w-0 grow">
          <div class="text-sm font-semibold">{{ i.name }}</div>
          <div class="mt-0.5 text-xs text-muted">{{ i.qty }} dona × {{ i.price == null ? '[?]' : formatSom(i.price) }}</div>
          <div v-if="i.price == null" class="mt-1"><Tag tone="warn">Narxni tekshiring</Tag></div>
          <div v-else-if="i.isNew" class="mt-1"><Tag tone="info">Yangi mahsulot</Tag></div>
        </div>
        <div class="text-sm font-bold" :class="{ 'text-muted line-through': !i.ok }">
          {{ i.price == null ? '—' : formatSom(i.qty * i.price) }}
        </div>
      </div>
      <div class="flex items-baseline justify-between pt-3">
        <span class="text-sm text-muted">Jami (tekshirilmaganlarsiz)</span>
        <span class="font-display text-xl font-bold">{{ formatSom(total) }} so'm</span>
      </div>
    </div>

    <div v-if="unchecked" class="flex items-center gap-2.5 rounded-[14px] bg-warn-soft px-3.5 py-3 text-[13px] leading-[1.4] text-warn">
      <AppIcon name="alert" class="shrink-0" />
      <span>{{ unchecked }} ta qatorda narx o'qilmadi. Tasdiqlashdan oldin tekshiring.</span>
    </div>
  </div>

  <div class="flex shrink-0 gap-2.5 px-5 pb-3.5">
    <AppButton variant="secondary" icon="barcode" class="px-4 whitespace-nowrap" @click="scanQr()">Shtrix-kod</AppButton>
    <AppButton icon="check" style="flex-basis: auto" @click="confirm">Omborga kiritish</AppButton>
  </div>
</template>
