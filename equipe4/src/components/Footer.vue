<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© {{ new Date().getFullYear() }} Ludov — Critiques vidéoludiques</p>
      <div class="links">
        <a
          class="ext-link"
          href="https://www.ludov.ca/fr/observation/critique-videoludique/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="ludov-mark">LUDOV</span>
          <span class="sep">•</span>
          <span>Critique vidéoludique</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer { margin-top: 40px; border-top: 1px solid #e5e7eb; background: #ffffff; color: #6b7280; }
.container { max-width: 1040px; margin: 0 auto; padding: 12px 16px; }
.footer-inner { display: flex; align-items: center; justify-content: space-between; }
.links { display: flex; gap: 16px; align-items: center; }
.links a { color: #374151; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
.links a:hover { color: #111827; }
.ext-link .ludov-mark { font-weight: 800; letter-spacing: 0.5px; color: var(--accent); }
.ext-link .sep { opacity: 0.6; }
</style>


