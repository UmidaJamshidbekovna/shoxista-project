<template>
  <div class="flex items-baseline justify-between gap-2">
    <h2 class="m-0 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
      <slot />
    </h2>
    <slot name="action" />
  </div>
</template>
