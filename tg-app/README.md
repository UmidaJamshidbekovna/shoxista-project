# AI Pos — Telegram Mini App

"AI Pos — Do'kon ilovasi" dizayni asosida qurilgan Nuxt 4 + Tailwind CSS v4 ilova.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # statik build -> .output/public
```

## Telegram'ga ulash

1. `npm run generate` va `.output/public` papkasini HTTPS hostingga joylang (Vercel, Netlify, Cloudflare Pages).
2. @BotFather → `/mybots` → bot → **Bot Settings → Configure Mini App** → URL kiriting.
3. Lokal sinov uchun: `npx cloudflared tunnel --url http://localhost:3000` va chiqqan HTTPS manzilni BotFather'ga bering.

## Tuzilma

```
app/
  assets/css/main.css    dizayn tokenlari (@theme)
  components/            AppIcon, BottomNav, ScreenHeader, IconButton, Tag, ...
  composables/
    useTelegram.ts       WebApp SDK: haptic, BackButton, QR skaner, share
    useCart.ts           Kassa → Savat → Chek holati
  data/products.ts       demo ma'lumotlar (API bilan almashtiriladi)
  layouts/default.vue    telefon konteyneri + pastki menyu
  plugins/telegram.client.ts  ready/expand, ranglar, tizim "Orqaga" tugmasi
  pages/                 13 ta ekran
```

| Ekran | Yo'l |
|---|---|
| Kassa | `/` |
| Savat va to'lov | `/savat` |
| Chek | `/chek` |
| Ombor | `/ombor` |
| Mahsulot qo'shish / tahrirlash | `/mahsulot` |
| AI Kirim (nakladnoy) | `/ai-kirim` |
| Kontaktlar va qarzlar | `/kontaktlar` |
| Firma: qarz va buyurtma | `/firma` |
| Xabarlar | `/xabarlar` |
| Tarix | `/tarix` |
| Hisobot | `/hisobot` |
| Onlayn do'kon | `/onlayn` |
| Menyu, profil, sozlamalar | `/profil` |

Pastki menyuli sahifalarda `definePageMeta({ tab: true })` bor. Qolgan sahifalarda Telegram'ning tizim "Orqaga" tugmasi avtomatik ko'rinadi.
