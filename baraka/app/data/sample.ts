// Namunaviy ma'lumotlar (README §6): 7 mijoz, 4 tashkilot, 8 mahsulot, 10+ tranzaksiya, 3 filial.
// Do'kon: "Baraka Market · Chilonzor filiali", egasi Aziz.
import type {
  Branch, Business, Category, ChatThread, Customer, Employee, Notification,
  Organization, Product, Socials, SupplierListing, Transaction, Warehouse,
} from './types'

const today = new Date()
/** Bugundan `d` kun oldingi sana, `hh:mm` vaqt bilan (ISO) */
function ago(d: number, time = '12:00') {
  const x = new Date(today)
  x.setDate(x.getDate() - d)
  const [h, m] = time.split(':').map(Number)
  x.setHours(h!, m!, 0, 0)
  // Bugungi vaqt hali kelmagan bo'lsa, hozirdan oldinga suriladi (tartib saqlanadi)
  if (x > today) x.setTime(today.getTime() - (24 * 60 - h! * 60 - m!) * 6000)
  return x.toISOString()
}

export const business: Business = {
  name: 'Baraka Market',
  username: 'barakamarket',
  inn: '305123456',
  description: 'Oziq-ovqat va maishiy mahsulotlar do\'koni. Chilonzor, Yunusobod va Sergeli filiallari.',
  phone: '+998 90 123 45 67',
  logoColor: '#05472a',
  type: 'mixed',
  plan: 'Pro',
  // Keyingi to'lov — bugundan 14 kun keyin (Profile.md §1.3: "14 kun qoldi")
  planUntil: new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10),
  owner: 'Aziz Rahimov',
  activity: 'Oziq-ovqat do\'koni',
}

export const branches: Branch[] = [
  {
    id: 'b1', name: 'Chilonzor filiali', address: 'Toshkent, Chilonzor 9-kvartal, 14-uy', lat: 41.2755, lng: 69.2034, manager: 'Aziz Rahimov', phone: '+998 90 123 45 67',
    hours: weekHours('08:00', '22:00'), main: true,
  },
  {
    id: 'b2', name: 'Yunusobod filiali', address: 'Toshkent, Yunusobod 4-mavze, 21-uy', lat: 41.3651, lng: 69.2867, manager: 'Dilshod Karimov', phone: '+998 91 234 56 78',
    hours: weekHours('09:00', '21:00'),
  },
  {
    id: 'b3', name: 'Sergeli filiali', address: 'Toshkent, Sergeli 7-mavze, 3-uy', lat: 41.2249, lng: 69.2183, manager: 'Nodira Yusupova', phone: '+998 93 345 67 89',
    hours: weekHours('08:00', '20:00', true),
  },
]

function weekHours(open: string, close: string, sundayOff = false) {
  return ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
    .map(day => ({ day, open, close, off: sundayOff && day === 'Yakshanba' }))
}

export const warehouses: Warehouse[] = [
  { id: 'w1', name: 'Markaziy ombor', branchId: 'b3', address: 'Toshkent, Sergeli 7-mavze, 3-uy', manager: 'Jasur Tursunov', lat: 41.2249, lng: 69.2183 },
  { id: 'w2', name: 'Yunusobod ombori', branchId: 'b2', address: 'Yunusobod 4-mavze, 21-uy', manager: 'Dilshod Karimov' },
  { id: 'w3', name: 'Sergeli ombori', branchId: 'b3', address: 'Sergeli 7-mavze, 3-uy', manager: 'Nodira Yusupova' },
]

export const categories: Category[] = [
  { id: 'c1', name: 'Oziq-ovqat', color: '#05472a', order: 1 },
  { id: 'c2', name: 'Ichimliklar', color: '#1d5bd8', order: 2 },
  { id: 'c3', name: 'Sut mahsulotlari', color: '#0e8a5f', order: 3 },
  { id: 'c4', name: 'Shirinliklar', color: '#c2410c', order: 4 },
  { id: 'c5', name: 'Maishiy kimyo', color: '#7c3aed', order: 5 },
]

// tint — rasm foni; supplierId — ta'minotchi (o1 sut, o2 ulgurji, o3 shirinlik); reviews — mijozlar sharhlari
export const products: Product[] = [
  {
    id: 'p1', name: 'Guruch Lazer 1 kg', sku: 'GR-001', barcode: '4780001000011', categoryId: 'c1', unit: 'kg', price: 18000, cost: 14500, stock: 64, minStock: 20, warehouseId: 'w1', emoji: '🍚',
    tint: '#f3ecdf', supplierId: 'o2', rating: 4.7,
    description: 'Lazer navli oq guruch — palov va garnir uchun. Donalari uzun, pishganda yopishmaydi. 1 kg li qadoqda.',
    reviews: [
      { name: 'Dilnoza K.', rating: 5, text: 'Palovga juda mos, donalari ochilib pishadi.', date: ago(2, '10:20') },
      { name: 'Javohir Q.', rating: 5, text: 'Har doim shu guruchni olaman, sifati barqaror.', date: ago(6, '18:05') },
      { name: 'Madina Y.', rating: 4, text: 'Yaxshi, lekin biroz yuvish kerak bo\'ladi.', date: ago(11, '12:40') },
    ],
  },
  {
    id: 'p2', name: 'Sut 2.5% 1 L', sku: 'ST-002', barcode: '4780001000028', categoryId: 'c3', unit: 'dona', price: 12500, cost: 9800, stock: 4, minStock: 15, warehouseId: 'w1', emoji: '🥛',
    tint: '#e6effb', supplierId: 'o1', rating: 4.5,
    description: 'Pasterizatsiyalangan sigir suti, yog\'liligi 2.5%. Har kuni yangi partiya, sovutgichda +2…+6 °C da saqlang.',
    reviews: [
      { name: 'Nilufar R.', rating: 5, text: 'Yangi va mazali, bolalarga ham beraman.', date: ago(1, '09:15') },
      { name: 'Sardor A.', rating: 4, text: 'Yaxshi sut, faqat tez tugab qoladi.', date: ago(4, '19:30') },
      { name: 'Gulnora S.', rating: 4, text: 'Narxi qulay, sifati yaxshi.', date: ago(9, '08:50') },
      { name: 'Bekzod T.', rating: 5, text: 'Qaynatganda ko\'pirmaydi, tabiiy ta\'mi bor.', date: ago(15, '17:10') },
    ],
  },
  {
    id: 'p3', name: 'Kungaboqar yog\'i 1 L', sku: 'YG-003', barcode: '4780001000035', categoryId: 'c1', unit: 'dona', price: 24000, cost: 19500, stock: 31, minStock: 10, warehouseId: 'w1', emoji: '🌻',
    tint: '#fbf1d6', supplierId: 'o2', rating: 4.4,
    description: 'Tozalangan, hidsizlantirilgan kungaboqar yog\'i. Qovurish va salatlar uchun, 1 litrli plastik idishda.',
    reviews: [
      { name: 'Madina Y.', rating: 5, text: 'Qovurganda tutun chiqarmaydi, hidi yo\'q.', date: ago(3, '13:00') },
      { name: 'Javohir Q.', rating: 4, text: 'Oddiy, sifatli yog\'. Narxi o\'rtacha.', date: ago(8, '20:15') },
    ],
  },
  {
    id: 'p4', name: 'Ko\'k choy 100 g', sku: 'CH-004', barcode: '4780001000042', categoryId: 'c2', unit: 'dona', price: 9000, cost: 6200, stock: 48, minStock: 12, warehouseId: 'w1', emoji: '🍵',
    tint: '#e3f1e4', supplierId: 'o2', rating: 4.8,
    description: 'Yirik bargli ko\'k choy, 100 g qadoqda. Xushbo\'y, damlaganda tiniq och-yashil rang beradi.',
    reviews: [
      { name: 'Dilnoza K.', rating: 5, text: 'Xushbo\'y choy, mehmonlarga ham uyalmay damlayman.', date: ago(1, '16:45') },
      { name: 'Sardor A.', rating: 5, text: 'Eng yaxshi ko\'k choy shu.', date: ago(5, '11:20') },
      { name: 'Nilufar R.', rating: 4, text: 'Mazali, lekin qadog\'i kichikroq.', date: ago(12, '09:40') },
    ],
  },
  {
    id: 'p5', name: 'Tuxum (10 dona)', sku: 'TX-005', barcode: '4780001000059', categoryId: 'c1', unit: 'quti', price: 16000, cost: 13000, stock: 0, minStock: 10, warehouseId: 'w1', emoji: '🥚',
    tint: '#f6eadf', supplierId: 'o2', rating: 4.2,
    description: 'Tovuq tuxumi, birinchi navli. 10 dona karton qutida, sovuq joyda saqlang.',
    reviews: [
      { name: 'Gulnora S.', rating: 4, text: 'Tuxumlar yirik, lekin 1 tasi singan edi.', date: ago(2, '08:30') },
      { name: 'Bekzod T.', rating: 5, text: 'Yangi tuxum, sarig\'i to\'q rangli.', date: ago(7, '18:00') },
      { name: 'Madina Y.', rating: 4, text: 'Yaxshi, tez-tez tugab qolyapti.', date: ago(10, '14:10') },
    ],
  },
  {
    id: 'p6', name: 'Coca-Cola 1.5 L', sku: 'CC-006', barcode: '4780001000066', categoryId: 'c2', unit: 'dona', price: 14000, cost: 10500, stock: 56, minStock: 24, warehouseId: 'w1', emoji: '🥤',
    tint: '#fbe3e1', supplierId: 'o2', rating: 4.6,
    description: 'Gazlangan alkogolsiz ichimlik, 1.5 litrli shishada. Sovutib iste\'mol qilish tavsiya etiladi.',
    reviews: [
      { name: 'Sardor A.', rating: 5, text: 'Har doim sovuq holda bor, rahmat!', date: ago(0, '12:10') },
      { name: 'Javohir Q.', rating: 4, text: 'Narxi boshqa do\'konlardan biroz arzon.', date: ago(4, '21:00') },
      { name: 'Dilnoza K.', rating: 5, text: 'Mehmondorchilik uchun doim shu yerdan olaman.', date: ago(13, '17:35') },
    ],
  },
  {
    id: 'p7', name: 'Shokolad Alpen Gold', sku: 'SH-007', barcode: '4780001000073', categoryId: 'c4', unit: 'dona', price: 15000, cost: 11000, stock: 7, minStock: 10, warehouseId: 'w1', emoji: '🍫',
    tint: '#efe4f7', supplierId: 'o3', rating: 4.9,
    description: 'Sutli shokolad, 90 g. Yumshoq ta\'m, choy bilan yoki sovg\'a uchun ajoyib tanlov.',
    reviews: [
      { name: 'Nilufar R.', rating: 5, text: 'Bolalarimning sevimli shokoladi.', date: ago(1, '19:20') },
      { name: 'Gulnora S.', rating: 5, text: 'Mazasi a\'lo, doim yangi.', date: ago(6, '15:05') },
    ],
  },
  {
    id: 'p8', name: 'Kir yuvish kukuni 3 kg', sku: 'KK-008', barcode: '4780001000080', categoryId: 'c5', unit: 'paket', price: 54000, cost: 42000, stock: 22, minStock: 5, warehouseId: 'w1', emoji: '🧺',
    tint: '#e2eef6', supplierId: 'o2', rating: 4.3,
    description: 'Avtomat kir yuvish mashinalari uchun kukun, 3 kg. Oq va rangli kiyimlar uchun, 40 °C da ham yaxshi yuvadi.',
    reviews: [
      { name: 'Madina Y.', rating: 4, text: 'Dog\'larni yaxshi ketkazadi, hidi yoqimli.', date: ago(3, '10:00') },
      { name: 'Bekzod T.', rating: 5, text: '3 kg uzoq vaqtga yetadi, tejamli.', date: ago(9, '13:45') },
      { name: 'Dilnoza K.', rating: 4, text: 'Yaxshi kukun, lekin qadog\'i og\'ir.', date: ago(14, '18:25') },
    ],
  },
]

export const customers: Customer[] = [
  { id: 'u1', name: 'Dilnoza Karimova', phone: '+998 90 111 22 33', debt: 120000, totalSpent: 4850000, purchases: 38, lastVisit: ago(0, '10:15'), channel: 'offline', note: 'Doimiy mijoz, har hafta keladi' },
  { id: 'u2', name: 'Sardor Aliyev', phone: '+998 91 222 33 44', debt: 0, totalSpent: 2310000, purchases: 21, lastVisit: ago(1, '18:40'), channel: 'telegram' },
  { id: 'u3', name: 'Madina Yusupova', phone: '+998 93 333 44 55', debt: 345000, totalSpent: 6120000, purchases: 52, lastVisit: ago(2, '09:05'), channel: 'instagram' },
  { id: 'u4', name: 'Bekzod Toshmatov', phone: '+998 94 444 55 66', debt: -50000, totalSpent: 1280000, purchases: 9, lastVisit: ago(0, '13:20'), channel: 'app', note: 'Balansida 50 000 so\'m oldindan to\'lov' },
  { id: 'u5', name: 'Nilufar Rahimova', phone: '+998 95 555 66 77', debt: 0, totalSpent: 980000, purchases: 7, lastVisit: ago(5, '16:00'), channel: 'offline' },
  { id: 'u6', name: 'Javohir Qodirov', phone: '+998 97 666 77 88', debt: 78000, totalSpent: 3400000, purchases: 30, lastVisit: ago(3, '20:10'), channel: 'telegram' },
  { id: 'u7', name: 'Gulnora Saidova', phone: '+998 99 777 88 99', debt: 0, totalSpent: 560000, purchases: 4, lastVisit: ago(9, '11:30'), channel: 'instagram' },
]

export const organizations: Organization[] = [
  { id: 'o1', name: 'Oq Suv Sut MChJ', type: 'supplier', balance: 1250000, phone: '+998 71 200 10 10', inn: '301456789', address: 'Toshkent viloyati, Zangiota tumani', contact: 'Rustam aka', ownCreated: false, categories: ['Sut mahsulotlari'], logoColor: '#1d5bd8' },
  { id: 'o2', name: 'Baraka Savdo Ulgurji', type: 'supplier', balance: 3827000, phone: '+998 71 210 20 20', inn: '302567890', address: 'Toshkent, Bektemir tumani', contact: 'Sherzod', ownCreated: false, categories: ['Oziq-ovqat', 'Ichimliklar'], logoColor: '#05472a' },
  { id: 'o3', name: 'Shirin Dunyo', type: 'supplier', balance: 0, phone: '+998 71 230 30 30', inn: '303678901', address: 'Toshkent, Olmazor tumani', contact: 'Malika', ownCreated: true, categories: ['Shirinliklar'], logoColor: '#c2410c' },
  { id: 'o4', name: '"Nur" kafesi', type: 'client', balance: -640000, phone: '+998 90 240 40 40', inn: '304789012', address: 'Toshkent, Chilonzor 12-kvartal', contact: 'Anvar', ownCreated: true, categories: ['HoReCa'], logoColor: '#7c3aed' },
]

const L = (productId: string, qty: number) => {
  const p = products.find(x => x.id === productId)!
  return { productId, name: p.name, qty, price: p.price }
}
const sum = (items: { qty: number, price: number }[]) => items.reduce((s, i) => s + i.qty * i.price, 0)
function tx(t: Omit<Transaction, 'total'> & { total?: number }): Transaction {
  return { ...t, total: t.total ?? sum(t.items) }
}

export const transactions: Transaction[] = [
  tx({ id: 't1', no: 'S-1048', kind: 'sale', segment: 'B2C', channel: 'offline', date: ago(0, '10:15'), customerId: 'u1', items: [L('p1', 2), L('p2', 1), L('p3', 1), L('p4', 2)], paid: 70500, method: 'cash', status: 'delivered', payStatus: 'partial', cashier: 'Aziz', branchId: 'b1' }),
  tx({ id: 't2', no: 'S-1049', kind: 'sale', segment: 'B2C', channel: 'telegram', date: ago(0, '11:40'), customerId: 'u2', items: [L('p6', 3), L('p7', 2)], paid: 72000, method: 'click', status: 'shipping', payStatus: 'paid', cashier: 'Kamola', branchId: 'b1' }),
  tx({ id: 't3', no: 'S-1050', kind: 'sale', segment: 'B2C', channel: 'instagram', date: ago(0, '12:05'), customerId: 'u3', items: [L('p8', 1), L('p3', 2)], paid: 0, method: 'payme', status: 'pending', payStatus: 'unpaid', cashier: 'Kamola', branchId: 'b1' }),
  tx({ id: 't4', no: 'S-1051', kind: 'sale', segment: 'B2C', channel: 'offline', date: ago(0, '13:20'), customerId: 'u4', items: [L('p4', 1), L('p6', 1)], paid: 23000, method: 'balance', status: 'delivered', payStatus: 'paid', cashier: 'Aziz', branchId: 'b1' }),
  tx({ id: 't5', no: 'S-1052', kind: 'sale', segment: 'B2B', channel: 'app', date: ago(0, '15:45'), orgId: 'o4', items: [L('p1', 10), L('p3', 6), L('p6', 12)], paid: 0, method: 'transfer', status: 'processing', payStatus: 'unpaid', cashier: 'Aziz', branchId: 'b1' }),
  tx({ id: 't6', no: 'P-0311', kind: 'purchase', segment: 'B2B', channel: 'app', date: ago(1, '09:30'), orgId: 'o1', items: [{ productId: 'p2', name: 'Sut 2.5% 1 L', qty: 60, price: 9800 }], paid: 0, method: 'transfer', status: 'delivered', payStatus: 'unpaid', cashier: 'Jasur', branchId: 'b1' }),
  tx({ id: 't7', no: 'S-1043', kind: 'sale', segment: 'B2C', channel: 'offline', date: ago(1, '17:10'), customerId: 'u6', items: [L('p7', 3), L('p6', 2)], paid: 73000, method: 'card', status: 'delivered', payStatus: 'paid', cashier: 'Kamola', branchId: 'b1' }),
  tx({ id: 't8', no: 'S-1044', kind: 'sale', segment: 'B2C', channel: 'offline', date: ago(1, '18:40'), customerId: 'u2', items: [L('p5', 2)], paid: 32000, method: 'cash', status: 'returned', payStatus: 'paid', cashier: 'Aziz', branchId: 'b1' }),
  tx({ id: 't9', no: 'S-1045', kind: 'sale', segment: 'B2C', channel: 'telegram', date: ago(2, '09:05'), customerId: 'u3', items: [L('p1', 5), L('p4', 4)], paid: 126000, method: 'payme', status: 'delivered', payStatus: 'paid', cashier: 'Kamola', branchId: 'b1' }),
  tx({ id: 't10', no: 'P-0310', kind: 'purchase', segment: 'B2B', channel: 'app', date: ago(2, '11:00'), orgId: 'o2', items: [{ productId: 'p1', name: 'Guruch Lazer 1 kg', qty: 100, price: 14500 }, { productId: 'p6', name: 'Coca-Cola 1.5 L', qty: 48, price: 10500 }], paid: 1577000, method: 'transfer', status: 'delivered', payStatus: 'partial', cashier: 'Jasur', branchId: 'b1' }),
  tx({ id: 't11', no: 'S-1046', kind: 'sale', segment: 'B2C', channel: 'instagram', date: ago(2, '19:30'), customerId: 'u7', items: [L('p8', 1)], paid: 0, method: 'click', status: 'cancelled', payStatus: 'unpaid', cashier: 'Kamola', branchId: 'b1' }),
  tx({ id: 't12', no: 'S-1047', kind: 'sale', segment: 'B2C', channel: 'offline', date: ago(3, '20:10'), customerId: 'u6', items: [L('p1', 3), L('p3', 1)], paid: 0, method: 'cash', status: 'delivered', payStatus: 'unpaid', cashier: 'Aziz', branchId: 'b1' }),
]

export const employees: Employee[] = [
  { id: 'e1', name: 'Aziz Rahimov', phone: '+998 90 123 45 67', role: 'owner', branchId: 'b1', active: true, permissions: ['*'] },
  { id: 'e2', name: 'Dilshod Karimov', phone: '+998 91 234 56 78', role: 'manager', branchId: 'b2', active: true, permissions: ['kassa', 'orders', 'stock', 'kirim', 'customers', 'reports'] },
  { id: 'e3', name: 'Kamola Ergasheva', phone: '+998 93 456 78 90', role: 'cashier', branchId: 'b1', active: true, permissions: ['kassa', 'customers'] },
  { id: 'e4', name: 'Jasur Tursunov', phone: '+998 94 567 89 01', role: 'storekeeper', branchId: 'b1', active: true, permissions: ['stock', 'kirim'] },
  { id: 'e5', name: 'Otabek Nazarov', phone: '+998 97 678 90 12', role: 'courier', branchId: 'b1', active: false, permissions: ['orders', 'delivery'] },
]

export const chats: ChatThread[] = [
  {
    id: 'ch1', kind: 'customer', channel: 'instagram', title: 'Madina Yusupova', refId: 'u3', unread: 2,
    messages: [
      { id: 'm1', from: 'them', text: 'Assalomu alaykum! Kir yuvish kukuni bormi?', time: ago(0, '11:58') },
      { id: 'm2', from: 'me', text: 'Va alaykum assalom! Ha, 3 kg li bor — 54 000 so\'m.', time: ago(0, '12:00') },
      { id: 'm3', from: 'them', text: 'Unda 1 ta kukun va 2 ta yog\' olaman, yetkazib bera olasizmi?', time: ago(0, '12:03'), orderId: 't3' },
      { id: 'm4', from: 'them', text: 'Manzil: Chilonzor 12-kvartal', time: ago(0, '12:04') },
    ],
  },
  {
    id: 'ch2', kind: 'customer', channel: 'telegram', title: 'Sardor Aliyev', refId: 'u2', unread: 1,
    messages: [
      { id: 'm1', from: 'them', text: 'Buyurtmam qachon yetib keladi?', time: ago(0, '12:30'), orderId: 't2' },
    ],
  },
  {
    id: 'ch3', kind: 'org', channel: 'app', title: 'Oq Suv Sut MChJ', refId: 'o1', unread: 0,
    messages: [
      { id: 'm1', from: 'me', text: 'Ertaga 60 ta sut kerak bo\'ladi.', time: ago(1, '08:50') },
      { id: 'm2', from: 'them', text: 'Qabul qilindi, soat 9:30 da yetkazamiz.', time: ago(1, '09:00') },
    ],
  },
  {
    id: 'ch4', kind: 'ai', channel: 'app', title: 'Baraka AI yordamchi', unread: 0,
    messages: [
      { id: 'm1', from: 'ai', text: 'Salom, Aziz! Savdo, ombor yoki mijozlar haqida so\'rang — ma\'lumotlaringiz asosida javob beraman.', time: ago(0, '08:00') },
    ],
  },
  {
    id: 'ch5', kind: 'support', channel: 'app', title: 'Tizim yordami', unread: 0,
    messages: [
      { id: 'm1', from: 'them', text: 'Baraka jamoasiga xush kelibsiz! Savollaringiz bo\'lsa shu yerga yozing.', time: ago(9, '10:00') },
    ],
  },
]

export const notifications: Notification[] = [
  { id: 'n1', icon: 'alert', title: 'Kam qolgan mahsulot', text: 'Sut 2.5% 1 L — 4 dona qoldi', time: ago(0, '08:00'), read: false, to: '/ombor' },
  { id: 'n2', icon: 'cart', title: 'Yangi online buyurtma', text: 'Madina Yusupova · Instagram · 102 000 so\'m', time: ago(0, '12:05'), read: false, to: '/tarix/t3' },
  { id: 'n3', icon: 'wallet', title: 'Qarz muddati', text: 'Javohir Qodirov — 78 000 so\'m, ertaga muddat tugaydi', time: ago(0, '09:00'), read: false, to: '/mijozlar/u6' },
  { id: 'n4', icon: 'truck', title: 'Kirim qabul qilindi', text: 'Oq Suv Sut MChJ — 60 dona sut', time: ago(1, '09:30'), read: true, to: '/tarix/t6' },
]

export const supplierListings: SupplierListing[] = [
  { id: 's1', name: 'Oq Suv Sut MChJ', category: 'Sut mahsulotlari', city: 'Toshkent', rating: 4.8, products: 42, minOrder: 500000, color: '#1d5bd8', connected: true, requested: false },
  { id: 's2', name: 'Baraka Savdo Ulgurji', category: 'Oziq-ovqat', city: 'Toshkent', rating: 4.6, products: 310, minOrder: 1000000, color: '#05472a', connected: true, requested: false },
  { id: 's3', name: 'Fresh Drinks Distribution', category: 'Ichimliklar', city: 'Toshkent', rating: 4.7, products: 85, minOrder: 800000, promo: 'Birinchi buyurtmaga −10%', color: '#0891b2', connected: false, requested: false },
  { id: 's4', name: 'Samarqand Non Kombinati', category: 'Non mahsulotlari', city: 'Samarqand', rating: 4.5, products: 24, minOrder: 300000, color: '#b45309', connected: false, requested: false },
  { id: 's5', name: 'CleanHouse Group', category: 'Maishiy kimyo', city: 'Toshkent', rating: 4.4, products: 130, minOrder: 600000, promo: 'Bepul yetkazib berish', color: '#7c3aed', connected: false, requested: true },
  { id: 's6', name: 'Shirin Hayot', category: 'Shirinliklar', city: 'Farg\'ona', rating: 4.9, products: 67, minOrder: 400000, color: '#db2777', connected: false, requested: false },
]

/** Bosh sahifa grafigi uchun tushum (so'm) */
export const revenue = {
  day: { label: 'Bugun', total: 4850000, change: 12.4, points: [380, 620, 510, 880, 660, 1070, 730], labels: ['08', '10', '12', '14', '16', '18', '20'] },
  week: { label: 'Bu hafta', total: 31200000, change: 8.1, points: [3.6, 4.1, 3.4, 5.5, 4.9, 5.3, 4.4], labels: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] },
}

/** Ijtimoiy tarmoqlar (Profile.md §7). permissions: e'lon joylash, kommentga va mijozlarga javob */
export const socials: Socials = {
  telegram: {
    connected: true,
    // DEMO — real tokens must never be in client code. Bu soxta token faqat namunaviy ekran uchun
    // (Profil → Ijtimoiy → Telegram'da maskalangan holda ko'rsatiladi). Haqiqiy token faqat backendda saqlanadi.
    botToken: '7712345678:AAHdemoBarakaMarketToken_AAF6qP',
    botUsername: '@baraka_shop_bot',
    channel: '@baraka_market',
    adminChatId: '-1001842736510',
    permissions: { post: true, comments: true, clients: true },
  },
  instagram: {
    connected: false,
    account: '',
    permissions: { post: true, comments: true, clients: false },
  },
}
