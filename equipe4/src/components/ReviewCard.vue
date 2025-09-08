<script setup>
defineProps({
  title: String,
  platform: String,
  score: Number,
  excerpt: String,
  cover: String,
})
</script>

<template>
  <article class="card">
    <img v-if="cover" :src="cover" alt="" class="cover" />
    <div class="content">
      <div class="meta">
        <span class="platform">{{ platform }}</span>
        <span class="score" :class="{ good: score >= 80, ok: score >= 60 && score < 80, bad: score < 60 }">{{ score }}</span>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="excerpt">{{ excerpt }}</p>
    </div>
  </article>
  
</template>

<style scoped>
.card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.cover { width: 120px; height: 120px; object-fit: cover; }
.content { padding: 12px 12px 14px 0; }
.meta { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.platform { font-size: 12px; color: #4b5563; background: #f3f4f6; padding: 4px 8px; border-radius: 999px; }
.score { margin-left: auto; font-weight: 700; padding: 4px 8px; border-radius: 8px; background: #f3f4f6; }
.score.good { color: #16a34a; }
.score.ok { color: #b45309; }
.score.bad { color: #dc2626; }
.title { margin: 0 0 6px; font-size: 18px; }
.excerpt { margin: 0; color: #4b5563; }
</style>


