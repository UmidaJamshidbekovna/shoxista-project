<script setup lang="ts">
const { socials } = useStore()
const { show } = useToast()
const { haptic } = useTelegram()

// --- Telegram ---
const tg = reactive({ ...socials.value.telegram })
const showToken = ref(false)
const testing = ref(false)
const testResult = ref<'ok' | 'fail' | null>(null)

const tgErrors = computed(() => ({
  botToken: /^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(tg.botToken.trim()) ? '' : 'Format: 123456789:AA… (BotFather bergan token)',
  channel: !tg.channel || /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg.channel.trim()) ? '' : 'Format: @kanal_nomi (5–32 belgi)',
  adminChatId: /^-?\d{5,}$/.test(tg.adminChatId.trim()) ? '' : 'Raqamli ID: 123456789 yoki -100…',
}))
const tgValid = computed(() => Object.values(tgErrors.value).every(e => !e))
const tgDirty = computed(() => JSON.stringify(tg) !== JSON.stringify(socials.value.telegram))
const maskedToken = computed(() => tg.botToken.replace(/^(\d{3})\d*:(.{3}).*(.{4})$/, "$1•••:$2••••••$3"))
watch(() => [tg.botToken, tg.channel, tg.adminChatId], () => { testResult.value = null })

function testConnection() {
  if (!tgValid.value) return
  testing.value = true
  testResult.value = null
  setTimeout(() => {
    testing.value = false
    // Simulyatsiya: "fail" bilan tugagan token — xato
    testResult.value = /fail$/i.test(tg.botToken) ? 'fail' : 'ok'
    show(testResult.value === 'ok' ? 'Bot javob berdi — ulanish ishlayapti' : 'Bot topilmadi, tokenni tekshiring', testResult.value === 'ok' ? 'success' : 'error')
  }, 1400)
}
function saveTg() {
  if (!tgValid.value) return
  socials.value.telegram = { ...tg, botToken: tg.botToken.trim(), channel: tg.channel.trim(), adminChatId: tg.adminChatId.trim(), connected: true }
  Object.assign(tg, socials.value.telegram)
  show('Telegram sozlamalari saqlandi')
}
function disconnectTg() {
  socials.value.telegram = { connected: false, botToken: '', channel: '', adminChatId: '' }
  Object.assign(tg, socials.value.telegram)
  confirmTg.value = false
  show('Telegram uzildi', 'info')
}
const confirmTg = ref(false)

// --- Instagram (Facebook orqali, simulyatsiya) ---
const igSheet = ref(false)
const igStep = ref<'intro' | 'loading' | 'pick'>('intro')
const IG_ACCOUNTS = ['@barakamarket.uz', '@baraka_chilonzor']
const igPick = ref(IG_ACCOUNTS[0]!)
const confirmIg = ref(false)

function startIg() {
  igStep.value = 'intro'
  igSheet.value = true
}
function fbLogin() {
  haptic('medium')
  igStep.value = 'loading'
  setTimeout(() => { igStep.value = 'pick' }, 1600)
}
function finishIg() {
  socials.value.instagram = { connected: true, account: igPick.value }
  igSheet.value = false
  show('Instagram ulandi')
}
function disconnectIg() {
  socials.value.instagram = { connected: false, account: '' }
  confirmIg.value = false
  show('Instagram uzildi', 'info')
}
</script>

<template>
  <PageHeader title="Ijtimoiy tarmoqlar" subtitle="Buyurtmalar va xabarlar shu yerdan keladi" back="/profil" />

  <div class="no-scrollbar flex min-h-0 grow flex-col *:shrink-0 gap-3.5 overflow-y-auto px-5 pb-6">
    <!-- Telegram -->
    <div class="card flex flex-col gap-3.5 p-4">
      <div class="flex items-center gap-3">
        <span class="flex size-11 items-center justify-center rounded-full bg-[#229ED9] text-white"><AppIcon name="telegram" :size="22" /></span>
        <div class="grow">
          <p class="text-base font-extrabold">Telegram</p>
          <p class="text-xs font-medium text-muted">Bot, kanal va admin xabarnomalari</p>
        </div>
        <Badge :tone="socials.telegram.connected ? 'brand' : 'neutral'">{{ socials.telegram.connected ? 'Ulangan' : 'Ulanmagan' }}</Badge>
      </div>

      <BInput
        :model-value="showToken ? tg.botToken : maskedToken" label="Bot token" placeholder="123456789:AAH…" icon="key" :readonly="!showToken"
        :error="tg.botToken && tgErrors.botToken" :hint="showToken ? '@BotFather dan olingan token' : 'Ko\'rish uchun ko\'z belgisini bosing'"
        @update:model-value="tg.botToken = String($event)"
      >
        <template #end>
          <button type="button" class="shrink-0 text-muted" :aria-label="showToken ? 'Yashirish' : 'Ko\'rsatish'" @click.prevent="showToken = !showToken">
            <svg v-if="showToken" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
            <AppIcon v-else name="eye" />
          </button>
        </template>
      </BInput>
      <BInput v-model="tg.channel" label="Kanal" placeholder="@kanal_nomi" icon="send" :error="tg.channel && tgErrors.channel" />
      <BInput v-model="tg.adminChatId" label="Admin chat ID" placeholder="-1001234567890" inputmode="numeric" icon="chat" :error="tg.adminChatId && tgErrors.adminChatId" hint="Yangi buyurtmalar shu chatga yuboriladi" />

      <div
        v-if="testResult" class="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold"
        :class="testResult === 'ok' ? 'bg-soft text-brand' : 'bg-danger-soft text-danger'"
      >
        <AppIcon :name="testResult === 'ok' ? 'check' : 'alert'" :size="16" />
        {{ testResult === 'ok' ? 'Ulanish muvaffaqiyatli: test xabar yuborildi' : 'Bot javob bermadi' }}
      </div>

      <div class="flex gap-2.5">
        <PillButton variant="soft" size="sm" class="grow basis-0" :disabled="!tgValid || testing" @click="testConnection">
          <span v-if="testing" class="size-4 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
          <AppIcon v-else name="send" :size="16" />{{ testing ? 'Tekshirilmoqda…' : 'Ulanishni tekshirish' }}
        </PillButton>
        <PillButton size="sm" icon="check" class="grow basis-0" :disabled="!tgValid || !tgDirty" @click="saveTg">Saqlash</PillButton>
      </div>
      <button v-if="socials.telegram.connected" type="button" class="text-[13px] font-bold text-danger" @click="confirmTg = true">Telegramni uzish</button>
    </div>

    <!-- Instagram -->
    <div class="card flex flex-col gap-3.5 p-4">
      <div class="flex items-center gap-3">
        <span class="flex size-11 items-center justify-center rounded-full text-white" style="background: linear-gradient(45deg, #f9a825, #e1306c 55%, #833ab4)"><AppIcon name="instagram" :size="22" /></span>
        <div class="grow">
          <p class="text-base font-extrabold">Instagram</p>
          <p class="text-xs font-medium text-muted">Direct xabarlar va buyurtmalar</p>
        </div>
        <Badge :tone="socials.instagram.connected ? 'brand' : 'neutral'">{{ socials.instagram.connected ? 'Ulangan' : 'Ulanmagan' }}</Badge>
      </div>
      <template v-if="socials.instagram.connected">
        <div class="flex items-center gap-3 rounded-2xl bg-field p-3">
          <Avatar :name="socials.instagram.account.replace('@', '')" color="#e1306c" :size="40" />
          <div class="grow">
            <p class="text-sm font-extrabold">{{ socials.instagram.account }}</p>
            <p class="text-xs font-medium text-muted">Biznes akkaunt · Facebook orqali</p>
          </div>
          <AppIcon name="check" class="text-brand" />
        </div>
        <PillButton variant="danger" size="sm" block @click="confirmIg = true">Uzish</PillButton>
      </template>
      <template v-else>
        <p class="text-[13px] font-medium text-muted-2">Instagram biznes akkauntingiz Facebook sahifasiga bog'langan bo'lishi kerak.</p>
        <PillButton block class="bg-[#1877F2]!" @click="startIg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" /></svg>
          Facebook orqali ulash
        </PillButton>
      </template>
    </div>
  </div>

  <!-- Facebook OAuth simulyatsiyasi -->
  <BSheet v-model="igSheet" title="Facebook orqali ulash">
    <div v-if="igStep === 'intro'" class="flex flex-col items-center gap-3 py-2 text-center">
      <div class="flex items-center gap-3">
        <span class="flex size-14 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">B</span>
        <AppIcon name="transfer" class="text-muted" />
        <span class="flex size-14 items-center justify-center rounded-2xl bg-[#1877F2] text-white"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" /></svg></span>
      </div>
      <p class="text-base font-extrabold">Baraka quyidagilarga ruxsat so'raydi</p>
      <ul class="flex w-full flex-col gap-2 text-left text-sm font-semibold text-muted-2">
        <li class="flex gap-2"><AppIcon name="check" :size="18" class="text-brand" />Instagram biznes profilini ko'rish</li>
        <li class="flex gap-2"><AppIcon name="check" :size="18" class="text-brand" />Direct xabarlarni o'qish va javob berish</li>
        <li class="flex gap-2"><AppIcon name="check" :size="18" class="text-brand" />Postlar va izohlarni boshqarish</li>
      </ul>
    </div>
    <div v-else-if="igStep === 'loading'" class="flex flex-col items-center gap-3 py-10">
      <span class="size-10 animate-spin rounded-full border-4 border-[#1877F2]/20 border-t-[#1877F2]" />
      <p class="text-sm font-bold text-muted-2">Facebook bilan bog'lanmoqda…</p>
    </div>
    <div v-else class="flex flex-col gap-2.5">
      <p class="text-sm font-bold text-muted-2">Ulash uchun akkauntni tanlang</p>
      <button
        v-for="a in IG_ACCOUNTS" :key="a" type="button"
        class="flex items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left"
        :class="igPick === a ? 'border-brand' : 'border-transparent'"
        @click="igPick = a"
      >
        <Avatar :name="a.replace('@', '')" color="#e1306c" :size="40" />
        <span class="grow text-sm font-extrabold">{{ a }}</span>
        <span class="flex size-5 items-center justify-center rounded-full border-2" :class="igPick === a ? 'border-brand bg-brand' : 'border-[#cfd5dc]'">
          <span v-if="igPick === a" class="size-2 rounded-full bg-white" />
        </span>
      </button>
    </div>
    <template #footer>
      <PillButton v-if="igStep === 'intro'" block class="bg-[#1877F2]!" @click="fbLogin">Facebook bilan davom etish</PillButton>
      <PillButton v-else block icon="check" :disabled="igStep === 'loading'" @click="finishIg">Ulash</PillButton>
    </template>
  </BSheet>

  <BSheet v-model="confirmIg" title="Instagramni uzish">
    <p class="py-2 text-[15px] font-semibold text-muted-2">{{ socials.instagram.account }} akkauntidan xabar va buyurtmalar kelmay qoladi.</p>
    <template #footer>
      <div class="flex gap-2.5">
        <PillButton variant="field" class="grow basis-0" @click="confirmIg = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" @click="disconnectIg">Uzish</PillButton>
      </div>
    </template>
  </BSheet>

  <BSheet v-model="confirmTg" title="Telegramni uzish">
    <p class="py-2 text-[15px] font-semibold text-muted-2">Bot token va kanal sozlamalari o'chiriladi. Telegram buyurtmalari kelmay qoladi.</p>
    <template #footer>
      <div class="flex gap-2.5">
        <PillButton variant="field" class="grow basis-0" @click="confirmTg = false">Bekor qilish</PillButton>
        <PillButton variant="danger" class="grow basis-0" @click="disconnectTg">Uzish</PillButton>
      </div>
    </template>
  </BSheet>
</template>
