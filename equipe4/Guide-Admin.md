# 📘 Guide Administrateur - LUDOV Critiques Vidéoludiques

Ce guide est destiné aux développeurs qui souhaitent maintenir ou étendre l'application.

---

## 🛠️ Technologies Utilisées

| Technologie | Version | Description |
|-------------|---------|-------------|
| **Vue.js** | 3.x | Framework JavaScript réactif (Composition API avec `<script setup>`) |
| **Vite** | 7.x | Outil de build et serveur de développement |
| **Tailwind CSS** | 3.x | Framework CSS utilitaire |
| **ApexCharts** | - | Librairie de graphiques (via `vue3-apexcharts`) |
| **SheetJS (xlsx)** | - | Lecture des fichiers Excel |
| **Vitest** | - | Framework de tests unitaires |
| **Node.js** | 18+ | Environnement d'exécution |

### Dépendances principales (`package.json`)

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.0.0",
    "vue3-apexcharts": "^1.4.0",
    "xlsx": "^0.18.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0",
    "happy-dom": "^14.0.0"
  }
}
```

---

## 📁 Structure du Projet

```
equipe4/
├── src/
│   ├── pages/
│   │   ├── Critiques.vue        # Page principale (données, filtres, tableau)
│   │   ├── Guide.vue            # Page guide utilisateur
│   │   └── NotFound.vue         # Page 404
│   ├── components/
│   │   ├── FiltersSidebar.vue   # Composant des filtres latéraux
│   │   ├── Graphique.vue        # Composant des graphiques (dans carte déroulante)
│   │   ├── Header.vue           # En-tête (responsive avec menu hamburger)
│   │   └── Footer.vue           # Pied de page
│   ├── utils/
│   │   ├── dataCorrections.js   # Corrections automatiques des données
│   │   └── genreCleaner.js      # Nettoyage des genres
│   └── workers/
│       └── xlsxWorker.js        # Worker pour parser le fichier Excel
├── public/
│   ├── data/
│   │   └── datareviews.xlsx     # Fichier de données Excel
│   └── img/                     # Images du guide utilisateur
├── main.js                      # Configuration des routes
└── style.css                    # Styles globaux (accessibilité, skip-link)
```

---

## 🗂️ Comment Ajouter une Nouvelle Colonne au Tableau

> **Résumé** : Pour afficher une nouvelle colonne du fichier Excel dans le tableau, il faut :
> 1. Trouver l'index de la colonne dans Excel
> 2. Créer le lien entre le nom affiché et la propriété JavaScript
> 3. Extraire et formater la valeur depuis les données brutes
> 4. Configurer l'affichage dans le tableau

### Étape 1 : Identifier l'index de la colonne dans Excel

Le fichier Excel contient des centaines de colonnes. Chaque colonne a un **index** (position numérique). Ce script recherche une colonne par mot-clé :

```javascript
// Dans le terminal, à la racine de equipe4/
node -e "
const XLSX = require('xlsx');
const wb = XLSX.readFile('./public/data/datareviews.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const headers = data[0];
headers.forEach((h, i) => {
  if (h && String(h).toLowerCase().includes('MOT_CLE')) {
    console.log('Index', i, ':', h);
  }
});
"
```

### Étape 2 : Modifier `Critiques.vue`

**2.1 - Ajouter dans `columnPropertyMap` (~ligne 237)**

> Ce dictionnaire fait le lien entre le **nom affiché** dans l'en-tête du tableau et le **nom de la propriété** JavaScript de l'objet.

```javascript
const columnPropertyMap = {
  // ... colonnes existantes
  'Nom Affiché': 'NomPropriete',
}
```

**2.2 - Ajouter dans `mapping` (~ligne 256)**

> L'objet `mapping` stocke les correspondances entre les propriétés et les colonnes Excel. On initialise la nouvelle propriété à vide.

```javascript
const mapping = ref({
  // ... propriétés existantes
  NomPropriete: '',
})
```

**2.3 - Ajouter dans `initMapping()` (~ligne 300)**

> Cette fonction initialise le mapping au chargement. On associe la propriété à l'en-tête Excel trouvé à l'index spécifié. La fonction `find()` permet de chercher par noms alternatifs.

```javascript
// Colonne XX "Nom de la colonne" - Index XXX
mapping.value.NomPropriete = headers.value[INDEX] || find(['nom alternatif'])
```

**2.4 - Ajouter le traitement dans `mappedObjects` (~ligne 520)**

> C'est ici qu'on **extrait la valeur brute** du fichier Excel et qu'on la **formate**. On gère les cas vides, les "0", et on nettoie les espaces. La valeur formatée est ensuite ajoutée à l'objet critique.

```javascript
// Formater la nouvelle colonne (colonne XX - index XXX)
const monIndex = INDEX
let maValeur = '-'
if (r[monIndex]) {
  const valeur = r[monIndex]
  if (valeur && valeur !== '0' && valeur !== '') {
    maValeur = String(valeur).trim()
  }
}

// Puis dans l'objet retourné :
return {
  // ... autres propriétés
  NomPropriete: maValeur,
}
```

**2.5 - Ajouter le case dans `filteredRowsObjects` (~ligne 1284)**

> Cette fonction convertit les objets en tableau pour l'affichage. Le `switch/case` mappe le nom de colonne vers la propriété de l'objet.

```javascript
case 'Nom Affiché': return item.NomPropriete || '-'
```

**2.6 - Ajouter dans `buildImportantColumns` (~ligne 1337)**

> Cette fonction définit quelles colonnes afficher dans le tableau. `forceIndex` force l'utilisation d'un index spécifique plutôt qu'une recherche par nom.

```javascript
{ key: 'nomPropriete', labels: ['nom excel'], display: 'Nom Affiché', forceIndex: INDEX },
```

---

## 🔍 Comment Ajouter un Nouveau Filtre

> **Résumé** : Les filtres permettent à l'utilisateur de restreindre les données affichées. L'architecture est divisée en deux parties :
> - **FiltersSidebar.vue** : Interface utilisateur (cases à cocher, sliders, etc.)
> - **Critiques.vue** : Logique de filtrage des données
>
> Le composant sidebar **émet** les valeurs sélectionnées, et Critiques.vue **filtre** les données en conséquence.

### Étape 1 : Modifier `FiltersSidebar.vue`

**1.1 - Ajouter dans `localFilters` (~ligne 34)**

> Cet objet réactif stocke l'état actuel de tous les filtres. Pour un filtre multi-sélection, utilisez un tableau `[]`. Pour un filtre unique, utilisez une string `''`.

```javascript
const localFilters = ref({
  // ... filtres existants
  monNouveauFiltre: [],  // Tableau pour multi-sélection
})
```

**1.2 - Ajouter dans `expandedCards` (~ligne 53)**

> Contrôle si la carte du filtre est dépliée ou repliée. `false` = replié par défaut.

```javascript
const expandedCards = ref({
  // ... cartes existantes
  monNouveauFiltre: false,
})
```

**1.3 - Ajouter dans `activeFiltersList` (~ligne 66)**

> Cette computed génère la liste des **filtres actifs** affichés en haut de la sidebar. Elle permet à l'utilisateur de voir et supprimer rapidement ses sélections.

```javascript
if (localFilters.value.monNouveauFiltre.length > 0) {
  filters.push({
    type: 'monNouveauFiltre',       // Identifiant unique
    label: 'Mon Filtre',             // Nom affiché
    value: localFilters.value.monNouveauFiltre.join(', '),
    count: localFilters.value.monNouveauFiltre.length
  })
}
```

**1.4 - Ajouter le template HTML de la carte filtre (~ligne 800+)**

> Chaque filtre est une "carte" avec un en-tête cliquable et un contenu dépliable. Le contenu peut contenir des checkboxes, radio buttons, sliders, etc.

```html
<div class="filter-card">
  <div class="card-header" @click="toggleCard('monNouveauFiltre')">
    <span>Mon Nouveau Filtre</span>
    <span class="expand-icon">{{ expandedCards.monNouveauFiltre ? '−' : '+' }}</span>
  </div>
  <div v-show="expandedCards.monNouveauFiltre" class="card-content">
    <!-- Options du filtre : checkboxes, radio, slider... -->
  </div>
</div>
```

### Étape 2 : Modifier `Critiques.vue`

**2.1 - Ajouter dans `sidebarFilters` (~ligne 135)**

> Cet objet reçoit les valeurs émises par FiltersSidebar. Il doit avoir la même structure que `localFilters`.

```javascript
const sidebarFilters = ref({
  // ... filtres existants
  monNouveauFiltre: [],
})
```

**2.2 - Ajouter la logique de filtrage dans `filteredByFilters` (~ligne 700+)**

> C'est ici que la **magie opère** ! Cette computed filtre `mappedObjects` selon tous les filtres actifs. Chaque filtre réduit progressivement la liste.

```javascript
// Filtre par mon nouveau filtre
if (filters.monNouveauFiltre?.length > 0) {
  items = items.filter(item =>
    filters.monNouveauFiltre.includes(item.MaPropriete)
  )
}
```

**2.3 - Ajouter les facettes dans `facets` (~ligne 800+)**

> Les **facettes** sont les options disponibles pour chaque filtre. Elles sont extraites dynamiquement des données. Cela permet d'afficher uniquement les valeurs qui existent réellement.

```javascript
const facets = computed(() => ({
  // ... facettes existantes
  monNouveauFiltre: [...new Set(mappedObjects.value.map(i => i.MaPropriete).filter(Boolean))].sort(),
}))
```

---

## 📊 Comment Ajouter un Nouveau Graphique

> **Résumé** : Le composant `Graphique.vue` utilise **ApexCharts** pour l'affichage. Il reçoit les données filtrées de `Critiques.vue` et permet à l'utilisateur de choisir ce qu'il veut visualiser (axe X, axe Y, type de graphique).

### Architecture du composant

```
Critiques.vue (données) → Graphique.vue (visualisation)
                              ↓
                         ApexCharts (rendu)
```

### Structure des données

> Le composant reçoit les données via les **props**. `items` contient les critiques filtrées, `filtreActifs` les filtres actuellement appliqués.

```javascript
const props = defineProps({
  items: { type: Array, required: true },  // Données filtrées
  filtreActifs: { type: Object }           // Filtres actifs
})
```

### Types de données disponibles (typeArray)

> Ce tableau définit les **dimensions** disponibles pour les axes X et Y. Chaque élément correspond à une propriété des objets critique.

```javascript
const typeArray = [
  "Titre", "TitreJeu", "Plateforme", "Modele", "TypePlateforme",
  "Année", "Magazine", "Auteurs", "Pays", "CritiqueTitre", "PDF",
  "Consoles", "ImageType", "Mois", "Volume", "Numéro", "Pages", "GenreAuteur"
]
```

### Ajouter une nouvelle dimension de graphique

**1. Ajouter le type dans `typeArray` (~ligne 17)**

> Ajoutez le nom de la propriété que vous voulez pouvoir visualiser. Ce nom doit correspondre exactement à une propriété des objets dans `mappedObjects`.

```javascript
const typeArray = [
  // ... types existants
  "MonNouveauType"  // Doit correspondre à item.MonNouveauType
]
```

**2. Gérer le nouveau type dans la logique de rendu (~ligne 400+)**

> Les graphiques sont générés par les computed `chartSeries` (données) et `chartOptions` (configuration). Si votre type nécessite un traitement spécial, ajoutez-le ici.

### Interaction graphique → tableau

> Quand l'utilisateur clique sur un élément du graphique, un événement est émis vers `Critiques.vue` pour filtrer le tableau en conséquence.

```javascript
// Dans Graphique.vue
emit('chart-click', { nameX: 'valeur', critereTrieX: 'Année', isClick: true })

// Dans Critiques.vue
function handleGraphClick(payload) {
  graphClickData.value = payload  // Filtre le tableau
}
```

---

## 🔧 Fichier de Données Excel

### Emplacement
`public/data/datareviews.xlsx`

### Colonnes importantes (avec leurs index)

| Colonne Excel | Index | Description |
|---------------|-------|-------------|
| EP | 145 | Étiquette de genre |
| EQ | 146 | Genre LUDOV |
| DC | Variable | Identité du pseudo |
| DB | Variable | Pseudonyme (0/1) |

### Comment trouver toutes les colonnes

```javascript
node -e "
const XLSX = require('xlsx');
const wb = XLSX.readFile('./public/data/datareviews.xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
data[0].forEach((h, i) => console.log(i, ':', h));
"
```

---

## 🧪 Tests

### Lancer les tests
```bash
npm run test
```

### Fichiers de tests
- `src/components/__tests__/FiltersSidebar.test.js` - Tests des filtres
- `src/pages/__tests__/Critiques.filters.test.js` - Tests du filtrage
- `src/utils/__tests__/dataCorrections.test.js` - Tests des corrections

### Après chaque modification

1. Vérifier que les tests existants passent
2. Ajouter des tests pour les nouvelles fonctionnalités
3. Tester manuellement dans le navigateur

---

## 📦 Commandes Utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Lancer les tests
npm run test

# Linter
npm run lint
```

---

## 📱 Responsive Design

L'application s'adapte à toutes les tailles d'écran grâce aux media queries.

### Breakpoints

| Breakpoint | Cible |
|------------|-------|
| `1024px` | Tablette |
| `768px` | Mobile |
| `525px` | Petit mobile (graphiques) |
| `480px` | Très petit mobile |

### Composants adaptatifs

**Header.vue** - Menu hamburger sur mobile
```css
@media (max-width: 768px) {
  .menu-toggle { display: flex; }  /* Affiche le burger */
  .nav { display: none; }          /* Cache la nav par défaut */
  .nav-open { display: flex; }     /* Affiche quand ouvert */
}
```

**Critiques.vue** - Cartes au lieu du tableau sur mobile
```html
<!-- Desktop : tableau -->
<div class="table-wrap desktop-only">...</div>

<!-- Mobile : cartes -->
<div class="cards-wrap mobile-only">
  <div class="critique-card" v-for="item in pageSlice">
    <!-- Titre, Année, Type plateformes, Magazine, Auteurs, Genre, Étiquette -->
  </div>
</div>
```

> Les classes `.desktop-only` et `.mobile-only` basculent à 768px.

**FiltersSidebar.vue** - Bouton flottant sur mobile
- Un bouton "Filtres" apparaît en bas à gauche sur mobile
- Affiche le nombre de filtres actifs (badge)
- La sidebar s'ouvre en overlay

**Graphique.vue** - Toolbar repositionnée sur petit écran
```css
@media (max-width: 525px) {
  .apexcharts-toolbar { position: relative; }  /* Évite le chevauchement */
}
```

### Carte déroulante du graphique

Le graphique est dans une carte **accordéon** (fermée par défaut) :

```javascript
// État dans Critiques.vue
const isGraphCardOpen = ref(false)  // Fermé par défaut

function toggleGraphCard() {
  isGraphCardOpen.value = !isGraphCardOpen.value
}
```

```html
<div class="collapsible-card graph-card">
  <button class="collapsible-header" @click="toggleGraphCard">
    📊 Graphiques et visualisations
  </button>
  <div class="collapsible-content" :class="{ 'open': isGraphCardOpen }">
    <ChartsGraphique ... />
  </div>
</div>
```

---

## ♿ Accessibilité

L'application respecte les bonnes pratiques d'accessibilité web (WCAG).

### Fonctionnalités implémentées

| Fonctionnalité | Emplacement | Description |
|----------------|-------------|-------------|
| **Skip Link** | `App.vue` | Lien "Aller au contenu principal" visible au focus |
| **Focus visible** | `style.css` | Outline coloré sur tous les éléments focusables |
| **ARIA labels** | Partout | Labels pour lecteurs d'écran |
| **Navigation clavier** | Tableau, cartes | Enter/Space pour ouvrir les modales |
| **Reduced motion** | `style.css` | Respecte `prefers-reduced-motion` |

### Skip Link (App.vue)

```html
<a href="#main-content" class="skip-link">
  Aller au contenu principal
</a>
<main id="main-content" role="main">...</main>
```

### Focus visible (style.css)

```css
*:focus-visible {
  outline: 3px solid #0891b2;
  outline-offset: 2px;
}

.sr-only {
  /* Classe pour contenu accessible mais invisible */
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
}
```

### Navigation clavier dans le tableau

```html
<tr
  tabindex="0"
  role="button"
  @keydown.enter="openModal(item)"
  @keydown.space.prevent="openModal(item)"
  :aria-label="`Voir les détails de ${item.Titre}`"
>
```

---

## 🔗 Routes et Navigation

### Configuration (main.js)

```javascript
const routes = [
  { path: '/', component: Critiques, meta: { title: 'Critiques' } },
  { path: '/guide', component: Guide, meta: { title: 'Guide' } },
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { title: 'Page non trouvée' } }
]

// Titre dynamique
router.afterEach((to) => {
  document.title = `LUDOV - ${to.meta.title || 'Critiques'}`
})
```

### Page 404 (NotFound.vue)

Page stylisée avec :
- Message d'erreur clair
- Bouton "Retour à l'accueil"
- Bouton "Consulter le guide"

---

## ⚠️ Points d'Attention

1. **Index des colonnes Excel** : Utilisez toujours `forceIndex` pour les colonnes critiques
2. **Noms de propriétés** : Utilisez le PascalCase (ex: `EtiquetteGenre`)
3. **Valeurs vides** : Toujours gérer les cas `undefined`, `null`, `''`, `'0'`
4. **Performances** : Les computed sont réactifs, évitez les calculs lourds
5. **Responsive** : Testez sur mobile (< 768px) après chaque modification du tableau
6. **Accessibilité** : Ajoutez des `aria-label` sur les éléments interactifs

