<template>
  <header class="site-header">
    <div class="container header-inner">
      <router-link to="/" class="brand" aria-label="Ludov">
        <img src="/src/assets/ludovlogo.jpg" alt="Ludov" class="banner" />
      </router-link>
      <nav class="nav">
        <router-link to="/" class="nav-link">Accueil</router-link>
        <router-link to="/critiques" class="nav-link">Critiques</router-link>
      </nav>
    </div>
  </header>
  
</template>

<style scoped>
.site-header { position: sticky; top: 0; z-index: 10; background: #ffffff; border-bottom: 1px solid #e5e7eb; }
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
}
.brand { display: flex; align-items: center; text-decoration: none; }
.banner { max-height: 44px; width: auto; object-fit: contain; display: block; }
.nav { display: flex; gap: 16px; }
.nav-link {
  color: #374151;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
}
.nav-link:hover { background: #f3f4f6; color: #111827; }
</style>


