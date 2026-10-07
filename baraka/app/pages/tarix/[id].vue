<script setup lang="ts">
// Eski havolalar (/tarix/<id>) → Tarix sahifasi, buyurtma tafsilotlari sheet ochiq holda
definePageMeta({
  middleware: to => navigateTo({ path: '/tarix', query: { order: String(to.params.id) } }, { replace: true }),
})
</script>

<template>
  <div />
</template>
