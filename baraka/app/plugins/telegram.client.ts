export default defineNuxtPlugin(() => {
  const tg = (window as any).Telegram?.WebApp
  // Faqat Telegram ichida ishlaydi (oddiy brauzerda SDK ogohlantirish beradi)
  if (!tg?.initData) return

  tg.ready()
  tg.expand()
  tg.disableVerticalSwipes?.()
  tg.setHeaderColor?.('#f4f6f9')
  tg.setBackgroundColor?.('#f4f6f9')
  tg.setBottomBarColor?.('#ffffff')

  // Ichki sahifalarda Telegram'ning tizim "Orqaga" tugmasi
  const router = useRouter()
  // Sheet ochiq bo'lsa, "Orqaga" faqat sheetni yopadi (BSheet o'zi ushlaydi)
  tg.BackButton.onClick(() => {
    if (!document.querySelector('#sheet-root [role=dialog]')) router.back()
  })
  router.afterEach((to) => {
    if (to.meta.tab || to.meta.layout === 'onboarding') tg.BackButton.hide()
    else tg.BackButton.show()
  })
})
