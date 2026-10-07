<script setup lang="ts">
// Do'kon QR kodi (Profile.md §3): yashil karta + oq 220px QR kvadrat + havola; Nusxa olish · Yuklab olish · Ulashish
const open = defineModel<boolean>({ default: false })
const { business } = useStore()
const { show } = useToast()
const { share } = useTelegram()

const link = computed(() => `baraka.app/@${business.value.username}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(`https://${link.value}`)
    show('Havola nusxalandi')
  }
  catch {
    show('Nusxa olib bo\'lmadi', 'error')
  }
}

/** QR'ni PNG fayl sifatida yuklab olish (canvas bo'lmasa — SVG) */
function download() {
  const m = encodeQr(link.value)
  if (!m) return show('QR kod yaratib bo\'lmadi', 'error')
  const q = 4
  const n = m.length + q * 2
  let d = ''
  m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + q} ${y + q}h1v1h-1z` }))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="1024" height="1024" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#121212"/></svg>`
  const name = `baraka-${business.value.username}-qr`
  const save = (href: string, ext: string) => {
    const a = document.createElement('a')
    a.href = href
    a.download = `${name}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    show('QR kod yuklab olindi')
  }
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  const img = new Image()
  img.onload = () => {
    try {
      const c = document.createElement('canvas')
      c.width = c.height = 1024
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, 1024, 1024)
      c.toBlob((b) => {
        if (!b) return save(svgUrl, 'svg')
        const u = URL.createObjectURL(b)
        save(u, 'png')
        setTimeout(() => { URL.revokeObjectURL(u); URL.revokeObjectURL(svgUrl) }, 1500)
      }, 'image/png')
    }
    catch {
      save(svgUrl, 'svg')
    }
  }
  img.onerror = () => save(svgUrl, 'svg')
  img.src = svgUrl
}
</script>

<template>
  <BSheet v-model="open" title="Do'kon QR kodi" tone="card">
    <div class="grid gap-4 pb-1">
      <div class="flex flex-col items-center gap-4 rounded-3xl bg-brand p-5">
        <div class="flex w-full items-center gap-3">
          <ProfAvatar
            :name="business.name" :src="business.logo" :size="40" :radius="13" :font="14"
            bg="rgba(255,255,255,0.14)" color="#fff"
          />
          <div class="min-w-0">
            <p class="truncate text-[15px] font-extrabold text-white">{{ business.name }}</p>
            <p class="truncate text-[12.5px] font-bold text-[#a7d9b9]">@{{ business.username }}</p>
          </div>
        </div>
        <div class="flex size-[220px] items-center justify-center rounded-[18px] bg-white">
          <ProfQrCode :value="link" :size="196" :quiet="0" color="#121212" />
        </div>
        <p class="text-[13px] font-bold text-white">{{ link }}</p>
      </div>

      <div class="flex items-center gap-2.5">
        <button type="button" aria-label="Nusxa olish" class="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-field text-ink transition-transform active:scale-95" @click="copy">
          <AppIcon name="copy" :size="20" :stroke="1.9" />
        </button>
        <button type="button" aria-label="Yuklab olish" class="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-field text-ink transition-transform active:scale-95" @click="download">
          <AppIcon name="download" :size="20" :stroke="1.9" />
        </button>
        <ProfBtn icon="share" class="grow" @click="share(`https://${link}`)">Ulashish</ProfBtn>
      </div>
    </div>
  </BSheet>
</template>
