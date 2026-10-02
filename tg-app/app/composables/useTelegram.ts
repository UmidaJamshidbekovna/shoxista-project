// Telegram WebApp SDK uchun yupqa qobiq. Brauzerda (Telegramsiz) ham xatosiz ishlaydi.
type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

export function useTelegram() {
  const tg = import.meta.client ? (window as any).Telegram?.WebApp : undefined
  const isTelegram = !!tg?.initData

  const user = tg?.initDataUnsafe?.user as
    | { id: number, first_name: string, last_name?: string, username?: string, photo_url?: string }
    | undefined

  function haptic(style: HapticStyle = 'light') {
    tg?.HapticFeedback?.impactOccurred(style)
  }
  function notify(type: 'success' | 'error' | 'warning' = 'success') {
    tg?.HapticFeedback?.notificationOccurred(type)
  }
  function selection() {
    tg?.HapticFeedback?.selectionChanged()
  }

  function showBackButton(onClick: () => void) {
    if (!tg?.BackButton) return () => {}
    tg.BackButton.onClick(onClick)
    tg.BackButton.show()
    return () => {
      tg.BackButton.offClick(onClick)
      tg.BackButton.hide()
    }
  }

  function scanQr(text = 'Shtrix-kodni skanerlang'): Promise<string | null> {
    return new Promise((resolve) => {
      if (!tg?.showScanQrPopup) return resolve(null)
      tg.showScanQrPopup({ text }, (data: string) => {
        resolve(data)
        return true
      })
      tg.onEvent?.('scanQrPopupClosed', () => resolve(null))
    })
  }

  function share(text: string) {
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(text)}`)
    else if (navigator.share) navigator.share({ text }).catch(() => {})
  }

  return { tg, isTelegram, user, haptic, notify, selection, showBackButton, scanQr, share }
}
