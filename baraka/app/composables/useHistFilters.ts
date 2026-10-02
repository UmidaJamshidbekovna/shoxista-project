// Tarix sahifasi filtrlari (sahifadan chiqib qaytganda saqlanib qoladi)
import type { Channel, OrderStatus, PayMethod, PayStatus, Transaction } from '~/data/types'

export interface HistFilters {
  channels: Channel[]
  segment: '' | 'B2C' | 'B2B'
  statuses: OrderStatus[]
  payStatuses: PayStatus[]
  methods: PayMethod[]
}

export const emptyHistFilters = (): HistFilters => ({ channels: [], segment: '', statuses: [], payStatuses: [], methods: [] })

export function useHistFilters() {
  const kind = useState<'sale' | 'purchase'>('hist-kind', () => 'sale')
  const query = useState('hist-query', () => '')
  const filters = useState<HistFilters>('hist-filters', emptyHistFilters)

  const activeCount = computed(() => {
    const f = filters.value
    return f.channels.length + (f.segment ? 1 : 0) + f.statuses.length + f.payStatuses.length + f.methods.length
  })

  function matches(t: Transaction) {
    const f = filters.value
    if (f.channels.length && !f.channels.includes(t.channel)) return false
    if (f.segment && t.segment !== f.segment) return false
    if (f.statuses.length && !f.statuses.includes(t.status)) return false
    if (f.payStatuses.length && !f.payStatuses.includes(t.payStatus)) return false
    if (f.methods.length && !f.methods.includes(t.method)) return false
    return true
  }

  function reset() { filters.value = emptyHistFilters() }

  return { kind, query, filters, activeCount, matches, reset }
}

/** Tranzaksiya tomoni: mijoz yoki tashkilot nomi */
export function useTxParty() {
  const { customerById, orgById } = useStore()
  return (t: Transaction) => {
    if (t.customerId) return customerById(t.customerId)?.name ?? 'Mijoz'
    if (t.orgId) return orgById(t.orgId)?.name ?? 'Tashkilot'
    return 'Umumiy mijoz'
  }
}
