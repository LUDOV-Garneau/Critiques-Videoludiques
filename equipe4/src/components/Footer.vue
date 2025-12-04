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
        <a
          class="doc-link"
          href="/doc/guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          title="Documentation du projet"
        >
          <svg class="doc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Guide Utilisateur</span>
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
.links a { color: #374151; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: color 0.2s ease; }
.links a:hover { color: #111827; }
.ext-link .ludov-mark { font-weight: 800; letter-spacing: 0.5px; color: var(--accent); }
.ext-link .sep { opacity: 0.6; }
.doc-link {
  padding: 6px 12px;
  border-radius: 6px;
  background: #f3f4f6;
  transition: all 0.2s ease;
}
.doc-link:hover {
  background: #e5e7eb;
  color: #111827;
}
.doc-icon {
  flex-shrink: 0;
  opacity: 0.7;
}
.doc-link:hover .doc-icon {
  opacity: 1;
}
</style>


