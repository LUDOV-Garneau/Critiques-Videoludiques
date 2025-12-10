<script setup>
import { ref } from 'vue'

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="site-header" role="banner">
    <div class="container header-inner">
      <router-link to="/" class="brand" aria-label="Accueil LUDOV - Critiques Vidéoludiques">
        <img src="/src/assets/ludovlogo.jpg" alt="" class="banner" aria-hidden="true" />
        <span class="sr-only">LUDOV - Critiques Vidéoludiques</span>
      </router-link>

      <!-- Menu hamburger (mobile) -->
      <button
        class="menu-toggle"
        @click="toggleMenu"
        :aria-expanded="menuOpen.toString()"
        :aria-label="menuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'"
        aria-controls="main-nav"
      >
        <span class="hamburger-line" aria-hidden="true"></span>
        <span class="hamburger-line" aria-hidden="true"></span>
        <span class="hamburger-line" aria-hidden="true"></span>
      </button>

      <!-- Navigation -->
      <nav id="main-nav" class="nav" :class="{ 'nav-open': menuOpen }" aria-label="Navigation principale">
        <router-link to="/" class="nav-link" @click="closeMenu" aria-current="page">Critiques</router-link>
        <router-link to="/guide" class="nav-link" @click="closeMenu">Guide</router-link>
      </nav>

      <!-- Overlay mobile -->
      <div
        v-if="menuOpen"
        class="nav-overlay"
        @click="closeMenu"
        aria-hidden="true"
      ></div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
.container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px;
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  position: relative;
}
.brand { display: flex; align-items: center; text-decoration: none; }
.banner { max-height: 44px; width: auto; object-fit: contain; display: block; }

/* Navigation desktop */
.nav {
  display: flex;
  gap: 8px;
}
.nav-link {
  color: #374151;
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.nav-link:hover { background: #f3f4f6; color: #111827; }
.nav-link.router-link-active { background: #02dcde; color: #111827; }

/* Menu hamburger - caché sur desktop */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 101;
}
.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: #374151;
  transition: transform 0.3s, opacity 0.3s;
}

/* Overlay mobile */
.nav-overlay {
  display: none;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  /* IMPORTANT: Cacher la nav par défaut sur mobile */
  .nav {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    height: 100vh;
    background: #ffffff;
    flex-direction: column;
    padding: 80px 20px 20px;
    box-shadow: -4px 0 20px rgba(0,0,0,0.1);
    z-index: 100;
  }

  /* Afficher seulement quand ouvert */
  .nav-open {
    display: flex;
  }

  .nav-link {
    padding: 14px 16px;
    font-size: 16px;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
  }

  .nav-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }

  .banner { max-height: 36px; }
}

@media (max-width: 480px) {
  .header-inner { height: 56px; }
  .banner { max-height: 32px; }
  .nav { width: 100%; }
}
</style>
