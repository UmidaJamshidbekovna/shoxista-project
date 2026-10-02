export default defineNuxtPlugin(() => {
  const tg = (window as any).Telegram?.WebApp
  if (!tg) return

  tg.ready()
  tg.expand()
  // Pastga surganda mini app yopilib qolmasin
  tg.disableVerticalSwipes?.()
  // Header va fon rangini dizayn bilan moslash
  tg.setHeaderColor?.('#F3F1EB')
  tg.setBackgroundColor?.('#F3F1EB')
  tg.setBottomBarColor?.('#FFFFFF')

  // Ichki sahifalarda Telegram'ning tizim "Orqaga" tugmasi
  const router = useRouter()
  const onBack = () => router.back()
  tg.BackButton.onClick(onBack)
  router.afterEach((to) => {
    if (to.meta.tab) tg.BackButton.hide()
    else tg.BackButton.show()
  })
})
