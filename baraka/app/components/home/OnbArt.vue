<script setup lang="ts">
// Onboarding illyustratsiyalari (rasm fayllarisiz: CSS shakllar + AppIcon)
const props = defineProps<{ slide: number, lang: 'uz' | 'en' }>()
const t = (uz: string, en: string) => props.lang === 'uz' ? uz : en

const team = [
  { i: 'KE', c: '#d97706', x: 8, y: 30, role: ['Kassir', 'Cashier'] },
  { i: 'JT', c: '#1d5bd8', x: 214, y: 22, role: ['Omborchi', 'Storekeeper'] },
  { i: 'DK', c: '#7c3aed', x: 0, y: 176, role: ['Menejer', 'Manager'] },
  { i: 'ON', c: '#db2777', x: 222, y: 170, role: ['Kuryer', 'Courier'] },
]
const bars = [38, 56, 44, 70, 62, 88, 76]
</script>

<template>
  <div class="relative mx-auto size-[280px] select-none" aria-hidden="true">
    <!-- fon doirasi -->
    <div class="absolute inset-3 rounded-full bg-white/55" />
    <div class="absolute inset-10 rounded-full bg-[radial-gradient(circle,#d3ecdc_0%,transparent_70%)]" />

    <!-- 1. Jamoa -->
    <template v-if="slide === 0">
      <div class="absolute inset-[46px] rounded-full border-2 border-dashed border-onb/25" />
      <div class="absolute top-1/2 left-1/2 flex size-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-onb text-white shadow-[0_14px_30px_rgba(14,138,95,0.35)]">
        <AppIcon name="users" :size="42" :stroke="1.8" />
      </div>
      <div
        v-for="(m, k) in team" :key="m.i"
        class="float absolute flex flex-col items-center gap-1"
        :style="{ left: `${m.x}px`, top: `${m.y}px`, animationDelay: `${k * 0.5}s` }"
      >
        <span class="flex size-14 items-center justify-center rounded-full border-4 border-white text-[15px] font-extrabold text-white shadow-card" :style="{ background: m.c }">{{ m.i }}</span>
        <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-muted-2 shadow-card">{{ lang === 'uz' ? m.role[0] : m.role[1] }}</span>
      </div>
      <div class="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold whitespace-nowrap text-ink-2 shadow-card">
        <span class="flex size-5 items-center justify-center rounded-full bg-onb text-white"><AppIcon name="check" :size="12" :stroke="3" /></span>
        {{ t('5 xodim · 3 filial', '5 staff · 3 branches') }}
      </div>
    </template>

    <!-- 2. Savdo -->
    <template v-else-if="slide === 1">
      <div class="absolute top-[58px] left-1/2 w-[220px] -translate-x-1/2 -rotate-3 rounded-[22px] bg-white p-4 shadow-[0_18px_40px_rgba(5,71,42,0.14)]">
        <p class="text-[11px] font-bold text-muted">{{ t('Bugungi tushum', 'Today\'s revenue') }}</p>
        <p class="text-[22px] font-extrabold tracking-tight text-ink-2">4 120 000 <span class="text-xs text-muted">so'm</span></p>
        <div class="mt-3 flex h-[72px] items-end gap-1.5">
          <span
            v-for="(h, k) in bars" :key="k" class="grow rounded-md"
            :class="k === 5 ? 'bg-onb' : 'bg-[#cfe9da]'" :style="{ height: `${h}%` }"
          />
        </div>
      </div>
      <div class="float absolute top-[30px] right-[14px] flex items-center gap-1 rounded-full bg-onb px-3 py-1.5 text-[13px] font-extrabold text-white shadow-[0_10px_20px_rgba(14,138,95,0.35)]">
        <AppIcon name="trend" :size="15" :stroke="2.6" /> +8.4%
      </div>
      <div class="float absolute bottom-[30px] left-[22px] flex size-14 items-center justify-center rounded-2xl bg-white text-onb shadow-card" style="animation-delay:.8s">
        <AppIcon name="cash" :size="26" />
      </div>
      <div class="float absolute right-[30px] bottom-[18px] flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-card" style="animation-delay:1.4s">
        <span class="flex size-7 items-center justify-center rounded-full bg-[#fef3e2] text-warn"><AppIcon name="box" :size="15" /></span>
        <span class="text-[11px] leading-tight font-extrabold text-ink-2">{{ t('Ombor', 'Stock') }}<br><span class="font-bold text-muted">{{ t('214 mahsulot', '214 items') }}</span></span>
      </div>
    </template>

    <!-- 3. Aloqa -->
    <template v-else-if="slide === 2">
      <div class="absolute inset-x-6 top-[44px] flex flex-col gap-2.5">
        <div class="flex items-end gap-2">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#229ED9] text-white"><AppIcon name="telegram" :size="16" /></span>
          <span class="rounded-[18px] rounded-bl-md bg-white px-3.5 py-2.5 text-[12px] font-bold text-ink-2 shadow-card">{{ t('Salom! 2 ta sut olsam bo\'ladimi?', 'Hi! Can I order 2 milks?') }}</span>
        </div>
        <div class="flex justify-end">
          <span class="rounded-[18px] rounded-br-md bg-onb px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(14,138,95,0.3)]">{{ t('Albatta! Buyurtma qabul qilindi ✓', 'Sure! Order accepted ✓') }}</span>
        </div>
        <div class="flex items-end gap-2">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#feda75,#d62976,#4f5bd5)] text-white"><AppIcon name="instagram" :size="16" /></span>
          <span class="rounded-[18px] rounded-bl-md bg-white px-3.5 py-2.5 text-[12px] font-bold text-ink-2 shadow-card">{{ t('Yetkazib berish bormi?', 'Do you deliver?') }}</span>
        </div>
        <div class="flex items-center gap-1 self-start rounded-full bg-white/80 px-3 py-2 shadow-card">
          <span v-for="d in 3" :key="d" class="dot size-1.5 rounded-full bg-onb" :style="{ animationDelay: `${d * 0.15}s` }" />
        </div>
      </div>
      <div class="float absolute top-[2px] right-[18px] flex size-12 items-center justify-center rounded-full bg-white text-onb shadow-card">
        <AppIcon name="chat" :size="22" />
        <span class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-danger text-[10px] font-extrabold text-white">3</span>
      </div>
    </template>

    <!-- 4. AI -->
    <template v-else>
      <div class="pulse absolute top-1/2 left-1/2 size-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-onb/15" />
      <div class="absolute top-1/2 left-1/2 flex size-[118px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[linear-gradient(145deg,#14a36f,#05472a)] text-white shadow-[0_18px_40px_rgba(14,138,95,0.4)]">
        <AppIcon name="robot" :size="58" :stroke="1.7" />
      </div>
      <span class="twinkle absolute top-[44px] left-[52px] text-onb"><AppIcon name="sparkle" :size="26" /></span>
      <span class="twinkle absolute right-[44px] bottom-[70px] text-[#d97706]" style="animation-delay:.7s"><AppIcon name="sparkle" :size="20" /></span>
      <div class="float absolute top-[22px] right-0 max-w-[150px] rounded-[18px] rounded-bl-md bg-white px-3 py-2 text-[11px] leading-snug font-bold text-ink-2 shadow-card">
        {{ t('Bugun tushum 8% oshdi 📈', 'Revenue is up 8% today 📈') }}
      </div>
      <div class="float absolute bottom-[14px] left-0 max-w-[160px] rounded-[18px] rounded-tr-md bg-soft-2 px-3 py-2 text-[11px] leading-snug font-bold text-ink-2 shadow-card" style="animation-delay:1s">
        {{ t('Sut tugayapti — buyurtma beraymi?', 'Milk is running low — reorder?') }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.float { animation: float 4s ease-in-out infinite; }
.pulse { animation: pulse 2.6s ease-in-out infinite; }
.twinkle { animation: twinkle 2.2s ease-in-out infinite; }
.dot { animation: dot 1.2s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.12); opacity: .5; } }
@keyframes twinkle { 0%, 100% { transform: scale(1) rotate(0); opacity: 1; } 50% { transform: scale(.7) rotate(20deg); opacity: .55; } }
@keyframes dot { 0%, 100% { opacity: .3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
</style>
