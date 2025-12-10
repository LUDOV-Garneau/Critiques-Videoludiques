<script setup>
import { ref } from 'vue'
import html2pdf from 'html2pdf.js'

const guideContent = ref(null)
const isGenerating = ref(false)

async function downloadPDF() {
  if (!guideContent.value || isGenerating.value) return

  isGenerating.value = true

  const options = {
    margin: [10, 10, 10, 10],
    filename: 'Guide-Utilisateur-LUDOV.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  try {
    await html2pdf().set(options).from(guideContent.value).save()
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Une erreur est survenue lors de la génération du PDF.')
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="guide-page">
    <div class="container">
      <header class="guide-header">
        <h1>Guide d'utilisation</h1>
        <p class="subtitle">Site de Critiques Vidéoludiques Ludov</p>
        <button
          class="download-btn"
          @click="downloadPDF"
          :disabled="isGenerating"
          aria-label="Télécharger le guide en PDF"
        >
          <span v-if="isGenerating" class="btn-loading">
            <span class="spinner-small"></span>
            Génération...
          </span>
          <span v-else>
            Télécharger en PDF
          </span>
        </button>
      </header>

      <div class="guide-content" ref="guideContent">
        <section>
          <h2>Introduction</h2>
          <p>Ce site web est une plateforme d'analyse de critiques vidéoludiques. Il permet de consulter une base de données complète de critiques de jeux vidéo provenant de différents magazines et revues.</p>
          <p>Ce projet a été réalisé dans le cadre du cours de <strong>Projet Intégrateur 420-18E-FX</strong> pour <strong>Ludov</strong> de l'<strong>Université de Montréal</strong> </p>
        </section>

        <section>
          <h2>Navigation</h2>
          <p>La page principale affiche les critiques avec une barre latérale de filtres à gauche, plusieurs graphiques et un tableau de résultats au centre, et une barre de recherche en haut.</p>
        </section>

        <section>
          <h2>Filtres</h2>
          <p>La sidebar gauche contient tous les filtres disponibles. Chaque type de filtre contient une section avec des options disponibles.</p>
          
          <h3>Filtres actifs</h3>
          <p>En haut de la sidebar, la section "Filtres actifs" affiche tous les filtres que vous avez sélectionnés. Un compteur en bas de cette section indique le nombre d'enregistrements pour les filtres sélectionnés (ex: "245 / 1500 résultats"). Et le bouton "Tout effacer" permet de réinitialiser tous les filtres.</p>
          <div class="image-container">
            <img src="/img/filtre1.png" alt="Filtres actifs avec compteur" class="guide-image" />
            <p class="image-caption">Section des filtres actifs avec le compteur de résultats et le bouton "Tout effacer"</p>
          </div>

          <h3>Filtres principaux :</h3>
          <ul>
            <li><strong>Magazines / Revues</strong> : Sélection multiple par checkbox</li>
            <li><strong>Pays</strong> : Filtre par pays</li>
            <li><strong>Type de plateformes</strong> : Console domestique, Micro-ordinateur, Portable, Arcade</li>
            <li><strong>Plateformes spécifiques</strong> : PlayStation 5, Xbox Series X, PC, etc...</li>
            <li><strong>Genres LUDOV</strong> : Action, Aventure, etc.. Mode OU (au moins un) ou ET (tous les genres)</li>
            <li><strong>Auteurs</strong> : Genre (Masculin/Féminin/Ambigu), caractéristiques (Minorité ethnique, Pseudonyme, Anonyme), recherche par nom dans une listbox</li>
            <li><strong>Période</strong> : Sliders pour années et mois (voir explication détaillée ci-dessous)</li>
            <li><strong>Notes</strong> : Notes des critiques (voir modal détails)</li>
            <li><strong>Type d'image</strong> : Screenshots, box art, etc...</li>
          </ul>

          <h3>Filtre par période</h3>
          <p>Le filtre période est plus complexe que les autres filtres. Il utilise une ligne de temps dynamique avec deux curseurs que vous pouvez déplacer pour définir une plage d'années. Chaque curseur représente une limite de votre sélection : le curseur de gauche pour l'année minimale et celui de droite pour l'année maximale. Vous pouvez également filtrer par mois en utilisant les menus déroulants "De" et "À".</p>
          <div class="image-container">
            <img src="/img/periode.png" alt="Filtre période avec ligne de temps" class="guide-image" />
            <p class="image-caption">Filtre période avec ligne de temps dynamique et sélection de mois</p>
          </div>
        </section>

        <section>
          <h2>Graphiques</h2>
          <p>Les graphiques interactifs se mettent à jour automatiquement selon les filtres sélectionnés. Ils permettent de visualiser les données de différentes manières pour faciliter l'analyse.</p>
          <p>Types disponibles : Ligne du temps, Barres, Pie chart, Heatmap. Configurez les axes X et Y selon vos besoins. Mode Combiner/Diviser pour les graphiques en barres.</p>
          <div class="image-container">
            <img src="/img/graphique1.png" alt="Exemple de graphique" class="guide-image" />
            <p class="image-caption">Exemple de graphique montrant la répartition des genres d'auteurs selon le temps</p>
          </div>
          <h3>Export des graphiques</h3>
          <p>Un menu burger (icône ☰) situé à gauche du graphique permet de télécharger le graphique dans différents formats : SVG (vectoriel, idéal pour l'impression), PNG (image bitmap) et CSV (données brutes pour analyse dans Excel).</p>
          <div class="image-container">
            <img src="/img/graphique2.png" alt="Menu d'export du graphique" class="guide-image" />
            <p class="image-caption">Menu d'export permettant de télécharger le graphique en SVG, PNG ou CSV</p>
          </div>
        </section>

        <section>
          <h2>Tableau des résultats</h2>
          <p>Le tableau affiche toutes les critiques qui correspondent aux filtres sélectionnés. Par défaut, 20 résultats sont affichés par page. Utilisez les boutons "Précédent" et "Suivant" en bas du tableau pour naviguer entre les pages. Cliquez sur une ligne du tableau pour voir les détails complets de la critique.</p>
          <div class="image-container">
            <img src="/img/tableau.png" alt="Tableau des critiques" class="guide-image" />
            <p class="image-caption">Tableau des critiques avec pagination</p>
          </div>
        </section>

        <section>
          <h2>Fenêtre de détails</h2>
          <p>En cliquant sur une critique dans le tableau, une fenêtre modale s'ouvre avec tous les détails de la critique. Cette fenêtre est organisée en sections :</p>
          <ul>
            <li><strong>Informations générales</strong> : Titre, année, magazine, auteurs avec leurs tags (Masculin/Féminin/Ambigu, Minorité ethnique, etc.)</li>
            <li><strong>Plateformes</strong> : Type de plateforme, plateforme spécifique, modèle</li>
            <li><strong>Notations</strong> : Toutes les notes détaillées avec leurs étiquettes (Excellent, Bon, Moyen, etc.)</li>
            <li><strong>Type d'image</strong> : Le type d'image utilisé dans la critique</li>
          </ul>
          <p>Fermez la fenêtre en cliquant sur le "×" en haut à droite ou en appuyant sur la touche Échap.</p>
          <div class="image-container">
            <img src="/img/details.png" alt="Modal de détails d'une critique" class="guide-image" />
            <p class="image-caption">Fenêtre de détails complète d'une critique avec toutes les informations</p>
          </div>
        </section>

        <section>
          <h2>Astuces</h2>
          <ul>
            <li>Les filtres fonctionnent en logique ET</li>
            <li>Utilisez "Tout effacer" pour réinitialiser les filtres actifs</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100vh;
  background: #ffffff;
  padding: 40px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.guide-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.guide-header h1 {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #02dcde 0%, #00b4b6 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(2, 220, 222, 0.3);
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 220, 222, 0.4);
}

.download-btn:active:not(:disabled) {
  transform: translateY(0);
}

.download-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.guide-content {
  line-height: 1.7;
  color: #374151;
  text-align: justify;
}

.guide-content section {
  margin-bottom: 48px;
}

.guide-content h2 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-top: 8px;
  text-align: left;
}

.guide-content h3 {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 24px 0 12px 0;
  text-align: left;
}

.guide-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 20px 0 8px 0;
  text-align: left;
}

.guide-content p {
  margin: 0 0 16px 0;
  font-size: 16px;
  text-align: justify;
}

.guide-content ul,
.guide-content ol {
  margin: 0 0 16px 0;
  padding-left: 24px;
}

.guide-content li {
  margin-bottom: 8px;
}

.guide-content strong {
  font-weight: 600;
  color: #111827;
}

.image-container {
  margin: 24px 0;
  text-align: center;
}

.guide-image {
  max-width: 100%;
  height: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

.image-caption {
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 0;
}

.footer-note {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #d1d5db;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 768px) {
  .guide-header h1 {
    font-size: 28px;
  }

  .guide-content h2 {
    font-size: 24px;
  }

  .guide-content h3 {
    font-size: 20px;
  }

  .container {
    padding: 0 16px;
  }

  .download-btn {
    width: 100%;
    padding: 14px 20px;
    font-size: 14px;
  }
}

/* Styles pour l'impression PDF - masquer le bouton */
@media print {
  .download-btn {
    display: none !important;
  }
}

</style>

