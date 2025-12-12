<template>
  <footer class="site-footer" role="contentinfo">
    <div class="container footer-inner">
      
      <div class="footer-info">
        <p class="copyright">© {{ new Date().getFullYear() }} Ludov — Critiques vidéoludiques</p>
        
        <p class="credits">
          <span class="credits-label">Travail réalisé par :</span>
          <span class="credits-names">Koffi Divin Sogbadji, Ahmed-Yassine Lehachi, Ludovyk Allard et Nazarie Miron</span>
        </p>
      </div>

      <nav class="links" aria-label="Liens du pied de page">
        <a
          class="ext-link"
          href="https://www.ludov.ca/fr/observation/critique-videoludique/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visiter le site LUDOV"
        >
          <span class="ludov-mark">LUDOV</span>
          <span class="sep" aria-hidden="true">•</span>
          <span>Critique vidéoludique</span>
        </a>
        
        <router-link
          to="/guide"
          class="doc-link"
          aria-label="Accéder au guide"
        >
          <svg class="doc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Guide Utilisateur</span>
        </router-link>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto; /* Garde le footer en bas si la page est courte */
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  font-size: 0.9rem;
  padding: 16px 0;
}

.container {
  max-width: 1200px; /* Un peu plus large pour laisser respirer */
  margin: 0 auto;
  padding: 0 24px;
}

.footer-inner {
  display: flex;
  align-items: center; /* Centre verticalement gauche et droite */
  justify-content: space-between;
  gap: 20px;
}

/* --- Partie Gauche (Textes) --- */
.footer-info {
  display: flex;
  flex-direction: column;
  gap: 4px; /* Espace très réduit entre copyright et crédits */
  flex: 1; /* Prend l'espace disponible pour éviter le wrapping précoce */
}

.footer-info p {
  margin: 0; /* Important: supprime les marges par défaut */
  line-height: 1.4;
}

.copyright {
  color: #111827; /* Plus foncé pour le titre principal */
  font-weight: 500;
}

.credits {
  font-size: 0.85em; /* Légèrement plus petit pour la hiérarchie */
  color: #6b7280;
}

.credits-label {
  font-weight: 600;
  margin-right: 4px;
  text-transform: uppercase;
  font-size: 0.9em;
  letter-spacing: 0.03em;
}

/* --- Partie Droite (Liens) --- */
.links {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0; /* Empêche les liens d'être écrasés */
}

.links a {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.ext-link {
  color: #4b5563;
  font-size: 0.9em;
}
.ext-link:hover {
  color: #111827;
}

.ext-link .ludov-mark {
  font-weight: 700;
  color: #0ea5e9; /* Bleu cyan comme sur ton image */
}

.doc-link {
  padding: 8px 16px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 500;
  font-size: 0.9em;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.doc-link:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
  color: #111827;
}

.doc-icon {
  opacity: 0.6;
}

/* --- Responsive --- */
@media (max-width: 900px) {
  .footer-inner {
    flex-direction: column;
    align-items: flex-start; /* Aligne tout à gauche sur mobile */
    gap: 16px;
  }
  
  .links {
    width: 100%;
    justify-content: space-between; /* Écarte les boutons sur mobile */
    padding-top: 12px;
    border-top: 1px dashed #e5e7eb;
  }
}

@media (max-width: 600px) {
  .links {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .doc-link {
    width: 100%;
    justify-content: center;
  }
}
</style>