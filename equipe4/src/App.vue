<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="app">
    <Header />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
  
</template>

<style scoped>
.app { color: #111827; background: #ffffff; min-height: 100vh; }
.about { padding: 24px 0; }
</style>
