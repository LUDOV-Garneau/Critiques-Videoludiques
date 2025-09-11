<script setup>
import { ref, onMounted } from 'vue'
import ReviewsList from '../components/ReviewsList.vue'
import { featuredGames } from '../data/featured.js'

const latest = ref(
  featuredGames.filter(g => [
    "Marvel's Spider-Man : Miles Morales",
    "Assassin's Creed Valhalla",
    'Wattam',
  ].includes(g.title))
)
</script>

<template>
  <div class="container">
    <section class="hero">
      <div class="hero-content">
        <h1>Ludov</h1>
        <p>Des critiques vidéoludiques claires et honnêtes, sans le bruit.</p>
      </div>
      <span class="spacer"></span>
    </section>
    <ReviewsList :reviews="latest" />
  </div>
</template>

<style scoped>
.container { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
.hero { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; padding: 24px 0; border-bottom: 1px solid #e5e7eb; }
.hero-content h1 { margin: 0 0 6px; font-size: 36px; }
.hero-content p { margin: 0; color: #4b5563; }
.spacer { width: 72px; height: 72px; }

</style>


