# Baraka — Store Manager (Telegram Mini App)

Kichik va o'rta bizneslar uchun savdo, ombor va mijozlarni boshqarish ilovasi. Nuxt 4 + Tailwind CSS v4, Telegram Mini App sifatida ishlaydi.
Spetsifikatsiya: loyiha tavsifi (README "Baraka — Store Manager Mobile App"). Holati: **interaktiv demo**, ma'lumotlar namunaviy, backend ulanmagan.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # statik build -> .output/public
```

Birinchi ochilishda onboarding chiqadi (`localStorage['baraka:onboarded']`). Qayta ko'rish uchun: Profil → Chiqish.

## Telegram'ga ulash

1. `npm run generate`, so'ng `.output/public` ni HTTPS hostingga joylang. Hosting SPA rejimida bo'lishi kerak: barcha yo'llar `200.html` ga qaytsin (`/tarix/t3` kabi dinamik sahifalar uchun). Netlify uchun `_redirects` fayliga `/* /200.html 200` yozing. Vercel uchun `rewrites` ishlating.
2. @BotFather → Bot Settings → Configure Mini App → URL.

## Ekranlar

| Bo'lim | Yo'llar |
|---|---|
| Onboarding | `/onboarding` |
| Bosh sahifa | `/`, `/bildirishnomalar` (AI robot — suzuvchi tugma) |
| Sotish (POS) | `/sotish`, `/sotish/chek/[id]` |
| Ombor | `/ombor`, `/ombor/[id]`, `/ombor/kategoriyalar`, `/ombor/kirim`, `/ombor/hisobot` |
| Tarix | `/tarix`, `/tarix/[id]` |
| Chat | `/chat`, `/chat/[id]` |
| Mijozlar va tashkilotlar | `/mijozlar`, `/mijozlar/[id]`, `/tashkilotlar/[id]` |
| Ta'minotchilar | `/taminotchilar` |
| Profil | `/profil`, `/profil/{biznes,filiallar,omborlar,xodimlar,ijtimoiy,sozlamalar,dokon,obuna}` |

## Tuzilma

```
app/
  assets/css/main.css      dizayn tokenlari (README §4: #05472a, Manrope, radiuslar, soyalar)
  components/              umumiy UI: PageHeader, RoundButton, PillButton, BSheet, BInput, Segmented, Chips, ...
  components/{home,pos,inv,hist,chat,contact,prof}/   bo'limlarga xos komponentlar
  composables/useStore.ts  umumiy holat (keyinchalik API bilan almashtiriladi)
  composables/useTelegram.ts  WebApp SDK: haptic, BackButton, QR skaner, share
  data/types.ts            ma'lumot turlari
  data/sample.ts           namunaviy ma'lumotlar (7 mijoz, 4 tashkilot, 8 mahsulot, 12 tranzaksiya, 3 filial)
  data/labels.ts           o'zbekcha yorliqlar
  middleware/onboarding.global.ts
```

## Simulyatsiya qilingan qismlar

Quyidagilar hozircha simulyatsiya qilingan, haqiqiy xizmatlarga ulanmagan:
- AI kamera, AI nakladnoy, AI javoblar
- Ovoz (brauzerda Web Speech API bo'lsa, haqiqiy)
- Username tekshiruvi
- Telegram/Instagram ulanishi
- To'lov va obuna

Barcha o'zgarishlar sahifa yangilanguncha xotirada turadi.
