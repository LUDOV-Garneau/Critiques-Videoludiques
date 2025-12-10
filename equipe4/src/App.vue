<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="app">
    <!-- Skip link pour l'accessibilité -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <Header />
    <main id="main-content" role="main" tabindex="-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.app { color: #111827; background: #ffffff; min-height: 100vh; }
.about { padding: 24px 0; }

/* Skip link - visible uniquement au focus */
.skip-link {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 0 0 8px 8px;
  z-index: 9999;
  text-decoration: none;
  font-weight: 600;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
  outline: 3px solid #02dcde;
  outline-offset: 2px;
}
</style>
