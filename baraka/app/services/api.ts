// Ma'lumot manbai (data source) qatlami.
// useStore holatni shu interfeys orqali boshlang'ich to'ldiradi. Hozircha `sampleApi` — namunaviy ma'lumotlar
// (app/data/sample.ts) nusxasini qaytaradi. Haqiqiy backend ulanganda faqat shu faylda `httpApi` yoziladi va
// `api` o'zgaruvchisi almashtiriladi — sahifalar va useStore/useLedger o'zgarmaydi.
import * as S from '~/data/sample'
import type {
  Branch, Business, Category, ChatThread, Customer, Employee, Notification, Organization, Payment,
  Product, Socials, SupplierListing, Transaction, Warehouse,
} from '~/data/types'

/** Har bir kolleksiya nomi → uning turi */
export interface Collections {
  business: Business
  branches: Branch[]
  warehouses: Warehouse[]
  categories: Category[]
  products: Product[]
  customers: Customer[]
  organizations: Organization[]
  transactions: Transaction[]
  payments: Payment[]
  employees: Employee[]
  chats: ChatThread[]
  notifications: Notification[]
  suppliers: SupplierListing[]
  socials: Socials
}

export type CollectionKey = keyof Collections

export interface DataApi {
  /**
   * Boshlang'ich qiymatni sinxron qaytaradi (useState initializer ichida chaqiriladi).
   * HTTP versiyada: SSR/plugin bosqichida oldindan yuklangan keshdan o'qiladi.
   */
  load: <K extends CollectionKey>(key: K) => Collections[K]
  /** Kolleksiyani saqlash (namunaviy rejimda hech narsa qilmaydi) */
  save: <K extends CollectionKey>(key: K, value: Collections[K]) => Promise<void>
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

const SAMPLE: Collections = {
  business: S.business,
  branches: S.branches,
  warehouses: S.warehouses,
  categories: S.categories,
  products: S.products,
  customers: S.customers,
  organizations: S.organizations,
  transactions: S.transactions,
  payments: [],
  employees: S.employees,
  chats: S.chats,
  notifications: S.notifications,
  suppliers: S.supplierListings,
  socials: S.socials,
}

/** Namunaviy ma'lumotlar: har chaqiruvda mustaqil nusxa (holat sample.ts ni o'zgartirmaydi) */
export const sampleApi: DataApi = {
  load: key => clone(SAMPLE[key]),
  save: async () => {},
}

/** Ilova ishlatadigan joriy manba. Backend tayyor bo'lganda: `export const api: DataApi = httpApi` */
export const api: DataApi = sampleApi
