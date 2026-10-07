<script setup lang="ts">
// Ijtimoiy tarmoq batafsil (Profile.md §7): ulangan ko'rinish / Telegram formasi (tgF) / Instagram (Facebook orqali)
const route = useRoute()
const { socials, business } = useStore()
const { show } = useToast()

const id = computed(() => route.params.id === 'instagram' ? 'instagram' : route.params.id === 'telegram' ? 'telegram' : null)
const name = computed(() => id.value === 'instagram' ? 'Instagram' : 'Telegram')
const connected = computed(() => id.value ? socials.value[id.value].connected : false)
const perms = computed(() => id.value ? socials.value[id.value].permissions : undefined)

const PERMS = [
  { key: 'post', label: 'E\'lon joylash' },
  { key: 'comments', label: 'Kommentga javob berish' },
  { key: 'clients', label: 'Clientlarga javob berish' },
] as const

// Telegram ulash formasi
const tgF = reactive({ botToken: '', botUsername: '', channel: '', adminChatId: '' })
const tgReady = computed(() => !!tgF.botToken.trim() && !!tgF.botUsername.trim())
const at = (v: string) => v.trim() ? `@${v.trim().replace(/^@+/, '')}` : ''

function connectTg() {
  if (!tgReady.value) return show('Bot token va username kiriting', 'error')
  socials.value.telegram = {
    ...socials.value.telegram,
    connected: true,
    botToken: tgF.botToken.trim(),
    botUsername: at(tgF.botUsername),
    channel: at(tgF.channel),
    adminChatId: tgF.adminChatId.trim(),
  }
  Object.assign(tgF, { botToken: '', botUsername: '', channel: '', adminChatId: '' })
  show('Telegram ulandi')
}

const igLoading = ref(false)
function connectIg() {
  igLoading.value = true
  // Simulyatsiya: Facebook OAuth (backendda POST /channels/instagram/oauth)
  setTimeout(() => {
    socials.value.instagram = { ...socials.value.instagram, connected: true, account: `@${business.value.username}` }
    igLoading.value = false
    show('Instagram ulandi')
  }, 900)
}

function disconnect() {
  if (!id.value) return
  socials.value[id.value].connected = false
  show(`${name.value} uzildi`)
}
</script>

<template>
  <ProfPage>
    <ProfHeader :title="id ? name : 'Topilmadi'" :size="22" back="/profil/ijtimoiy">
      <ProfSocialTag v-if="id" :on="connected" />
    </ProfHeader>

    <p v-if="!id" class="py-10 text-center text-[13px] text-muted">Bunday tarmoq yo'q</p>

    <!-- Ulangan -->
    <template v-else-if="connected">
      <ProfCard class="p-4">
        <div class="rounded-2xl bg-[#f4f6f9] px-4 py-1">
          <template v-if="id === 'telegram'">
            <ProfKv k="Bot token" :v="profMask(socials.telegram.botToken)" />
            <ProfKv k="Bot username" :v="socials.telegram.botUsername" />
            <ProfKv k="Kanal username" :v="socials.telegram.channel" />
            <ProfKv k="Admin chat ID" :v="socials.telegram.adminChatId" />
          </template>
          <ProfKv v-else k="Akkaunt" :v="socials.instagram.account" />
        </div>
      </ProfCard>

      <ProfSection v-if="perms" title="Ruxsatlar">
        <ProfCard class="px-4 py-1">
          <ProfToggleRow v-for="p in PERMS" :key="p.key" v-model="perms[p.key]" :label="p.label" />
        </ProfCard>
      </ProfSection>

      <ProfBtn variant="danger" @click="disconnect">Uzish</ProfBtn>
    </template>

    <!-- Telegram ulash formasi -->
    <template v-else-if="id === 'telegram'">
      <ProfCard class="grid gap-3.5 p-4">
        <ProfField v-model="tgF.botToken" variant="soft" label="Bot token" placeholder="7712…:AAF6qP" hint="@BotFather dan olinadi" />
        <ProfField v-model="tgF.botUsername" variant="soft" label="Bot username" placeholder="@baraka_shop_bot" />
        <ProfField v-model="tgF.channel" variant="soft" label="Kanal username" placeholder="@baraka_market" />
        <ProfField v-model="tgF.adminChatId" variant="soft" label="Admin chat ID" inputmode="numeric" placeholder="-1001842…" />
      </ProfCard>
      <ProfBtn :dim="!tgReady" @click="connectTg">Ulash</ProfBtn>
    </template>

    <!-- Instagram ulash -->
    <template v-else>
      <ProfCard class="flex flex-col items-center gap-3 px-5 py-6 text-center">
        <span class="flex size-14 items-center justify-center rounded-2xl bg-[#e8f0fb] text-[#1d4ed8]">
          <AppIcon name="facebook" :size="24" :stroke="1.9" />
        </span>
        <p class="text-[13.5px] leading-[1.55] text-[#374151]">
          Instagram biznes akkaunt Facebook orqali ulanadi. Ruxsat bergach, direct xabarlar va kommentlar shu yerga keladi.
        </p>
      </ProfCard>
      <ProfBtn icon="facebook" :dim="igLoading" @click="!igLoading && connectIg()">
        {{ igLoading ? 'Ulanmoqda…' : 'Facebook bilan ulash' }}
      </ProfBtn>
    </template>
  </ProfPage>
</template>
