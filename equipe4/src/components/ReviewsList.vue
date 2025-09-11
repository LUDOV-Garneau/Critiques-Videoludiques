<script setup>
import ReviewCard from './ReviewCard.vue'
defineProps({ reviews: { type: Array, default: () => [] } })
</script>

<template>
  <section id="critiques" class="reviews">
    <div class="container">
      <h2>Dernières critiques</h2>
      <div class="grid">
        <ReviewCard v-for="r in reviews" :key="r.title" v-bind="r" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.reviews { padding: 24px 0 8px; }
.container { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
h2 { margin: 0 0 16px; color: #111827; }
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 700px) { .grid { grid-template-columns: 1fr 1fr; } }
</style>


