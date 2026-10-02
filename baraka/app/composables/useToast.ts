// Oddiy toast xabarlari: useToast().show('Saqlandi')
interface Toast { id: number, text: string, tone: 'success' | 'error' | 'info' }

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])
  const { notify } = useTelegram()

  function show(text: string, tone: Toast['tone'] = 'success') {
    const id = Date.now() + Math.random()
    toasts.value = [...toasts.value, { id, text, tone }]
    if (tone !== 'info') notify(tone === 'success' ? 'success' : 'error')
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 2600)
  }

  return { toasts, show }
}
