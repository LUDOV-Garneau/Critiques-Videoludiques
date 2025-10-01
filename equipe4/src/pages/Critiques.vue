<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FiltersSidebar from '../components/FiltersSidebar.vue'

const isLoading = ref(false)
const error = ref('')
const headers = ref([])
const rows = ref([])
const filteredHeaders = ref([])
const filteredRows = ref([])
const showRaw = ref(false)
const page = ref(1)
const pageSize = 20
 
const query = ref('')
const sortKey = ref('Année')
const sortDir = ref('desc')

// Modal state & handlers
const isModalOpen = ref(false)
const modalItem = ref(null)

function openModal(item) {
  modalItem.value = item || null
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
  })
}

const filteredAndSorted = computed(() => {
  const keys = filteredHeaders.value
  // Utiliser les données filtrées par la sidebar au lieu de filteredRows
  let items = filteredRowsObjects.value.map((r, idx) => {
    const obj = Object.fromEntries(r.map((v, i) => [keys[i], v]))
    // Conserver l'objet source complet pour l'affichage en modal
    obj._full = filteredByFilters.value[idx]
    return obj
  })

  // Appliquer la recherche textuelle
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    items = items.filter(it => Object.values(it).some(v => String(v ?? '').toLowerCase().includes(q)))
  }

  // Appliquer le tri
  if (sortKey.value) {
    items = items.slice().sort((a,b) => {
      const va = a[sortKey.value]
      const vb = b[sortKey.value]
      const na = Number(va); const nb = Number(vb)
      const bothNum = !Number.isNaN(na) && !Number.isNaN(nb)
      const cmp = bothNum ? (na - nb) : String(va ?? '').localeCompare(String(vb ?? ''))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return items
})

const totalPages = computed(() => Math.max(1, Math.ceil((filteredAndSorted.value.length || 0) / pageSize)))
const pageSlice = computed(() => filteredAndSorted.value.slice((page.value-1)*pageSize, page.value*pageSize))

const mapping = ref({
  Titre: '',
  Plateforme: '',
  Note: '',
  Année: '',
  Magazine: '',
  Auteurs: '',
  Pays: '',
  CritiqueTitre: '',
  PDF: '',
})

function initMapping() {
  const lower = (headers.value || []).map(h => String(h || '').toLowerCase())
  function find(labels) { const i = lower.findIndex(h => labels.some(l => h.includes(l))); return i>=0 ? headers.value[i] : '' }
  mapping.value.Titre = find(['title','game','name','titre','jeu'])
  mapping.value.Plateforme = find(['platform','console','system','plateforme'])
  mapping.value.Note = find(['score','rating','note'])
  mapping.value.Année = find(['year','release year','annee','année','date'])
  mapping.value.Magazine = find(['magazine','revue','journal','publication'])
  mapping.value.Auteurs = find(['author','auteur','autrice','writer'])
  mapping.value.Pays = find(['country','pays','region'])
  mapping.value.CritiqueTitre = find(['titre de la critique','review title','article title','titre article'])
  mapping.value.PDF = find(['pdf','lien','link','url','document','fichier'])
}

const mappedObjects = computed(() => {
  if (!headers.value.length) return []
  const idx = Object.fromEntries(Object.entries(mapping.value).map(([k,v]) => [k, headers.value.indexOf(v)]))

  // Indices pour les colonnes d'auteurs spécifiques
  const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
  const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')

  const mapped = rows.value.map(r => {
    // Combiner les noms d'auteurs masculins et féminins
    let authorNames = []
    if (maleAuthorIndex !== -1 && r[maleAuthorIndex] && r[maleAuthorIndex] !== '0') {
      // Séparer les auteurs multiples s'ils sont dans la même cellule
      const authors = String(r[maleAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a)
      authorNames.push(...authors)
    }
    if (femaleAuthorIndex !== -1 && r[femaleAuthorIndex] && r[femaleAuthorIndex] !== '0') {
      // Séparer les auteurs multiples s'ils sont dans la même cellule
      const authors = String(r[femaleAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a)
      authorNames.push(...authors)
    }

    // Si aucun auteur spécifique, utiliser la colonne générale
    if (authorNames.length === 0 && idx.Auteurs >= 0 && r[idx.Auteurs]) {
      const authors = String(r[idx.Auteurs]).split(/[,;]+/).map(a => a.trim()).filter(a => a)
      authorNames.push(...authors)
    }

    // Filtrer les auteurs valides (pas de chiffres seuls, pas de valeurs vides)
    const validAuthors = authorNames.filter(author => {
      const trimmed = String(author).trim()
      // Exclure les chiffres seuls, les valeurs vides, et les "0"
      return trimmed && trimmed !== '0' && !/^\d+$/.test(trimmed)
    })

    // Traiter l'année pour éviter NaN
    let annee = undefined
    if (idx.Année >= 0) {
      const yearValue = Number(String(r[idx.Année]).slice(0, 4))
      annee = !isNaN(yearValue) && yearValue > 0 ? yearValue : '-'
    }

    return {
      Titre: idx.Titre>=0 ? r[idx.Titre] : undefined,
      Plateforme: idx.Plateforme>=0 ? r[idx.Plateforme] : undefined,
      Note: idx.Note>=0 ? Number(r[idx.Note]) : undefined,
      Année: annee,
      Magazine: idx.Magazine>=0 ? r[idx.Magazine] : undefined,
      Auteurs: validAuthors.length > 0 ? validAuthors.join(', ') : '-', // Afficher "-" si pas d'auteurs
      Pays: idx.Pays>=0 ? r[idx.Pays] : undefined,
      CritiqueTitre: idx.CritiqueTitre>=0 ? r[idx.CritiqueTitre] : undefined,
      PDF: idx.PDF>=0 ? r[idx.PDF] : undefined,
    }
  })

  if (mapped.length > 0) {
    console.log('Objets mappés:', {
      total: mapped.length,
      mapping: mapping.value,
      indices: idx,
      premier: mapped[0]
    })
  }

  return mapped
})



// Nouveaux filtres pour la sidebar
const sidebarFilters = ref({
  magazines: [],
  countries: [],
  platformTypes: [], // Types de plateformes (Console, Microordinateur, etc.)
  consoles: [], // Consoles spécifiques (Nintendo64, PlayStation, etc.)
  authorGender: '',
  authorName: '',
  yearRange: [1980, 2025], // Plage complète par défaut (pas de filtre actif)
  monthRange: [1, 12],
  scoreTypes: [], // Types de notes à filtrer (sélection multiple)
  scoreRange: [0, 100],
  includeUnscored: true // Inclure les critiques sans notation
})

const facets = computed(() => {
  const arr = mappedObjects.value
  const uniq = (vals) => Array.from(new Set(vals.filter(Boolean))).sort()

  // Récupérer les auteurs masculins et féminins depuis les données brutes
  const authorsM = new Set()
  const authorsF = new Set()

  if (headers.value.length > 0) {
    const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
    const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')

    if (maleAuthorIndex !== -1) {
      rows.value.forEach(row => {
        const author = row[maleAuthorIndex]
        if (author && author !== '' && author !== '0') {
          authorsM.add(author)
        }
      })
    }

    if (femaleAuthorIndex !== -1) {
      rows.value.forEach(row => {
        const author = row[femaleAuthorIndex]
        if (author && author !== '' && author !== '0') {
          authorsF.add(author)
        }
      })
    }
  }

  // Récupérer les types de plateformes depuis les données brutes
  const platformTypes = new Set()
  if (headers.value.length > 0) {
    const platformTypeIndex = headers.value.indexOf('Type de plateforme')
    if (platformTypeIndex !== -1) {
      rows.value.forEach(row => {
        const type = row[platformTypeIndex]
        if (type && type !== '' && type !== '0') {
          platformTypes.add(type)
        }
      })
    }
  }

  // Filtrer les années valides (exclure "-" et les valeurs invalides)
  const validYears = arr
    .map(x => x.Année)
    .filter(y => y !== '-' && y !== undefined && typeof y === 'number' && !isNaN(y))

  return {
    platformTypes: Array.from(platformTypes).sort(),
    magazines: uniq(arr.map(x => x.Magazine)),
    countries: uniq(arr.map(x => x.Pays)),
    authors: {
      male: Array.from(authorsM).sort(),
      female: Array.from(authorsF).sort()
    },
    minYear: validYears.length > 0 ? Math.min(...validYears) : 1980,
    maxYear: validYears.length > 0 ? Math.max(...validYears) : 2025,
    minScore: 0,
    maxScore: 100
  }
})

const filteredByFilters = computed(() => {
  const arr = mappedObjects.value
  const f = sidebarFilters.value

  return arr.filter((x, index) => {
    // Filtre par année (exclure les critiques sans année valide)
    const year = x.Année
    if (year === '-' || year === undefined || typeof year !== 'number') {
      // Si pas d'année valide, exclure de la recherche par année
      return false
    }
    if (year < f.yearRange[0] || year > f.yearRange[1]) return false

    // Filtre par mois (utiliser les données brutes)
    if (f.monthRange[0] !== 1 || f.monthRange[1] !== 12) {
      if (headers.value.length > 0 && index < rows.value.length) {
        const monthIndex = headers.value.indexOf('Mois')
        if (monthIndex !== -1) {
          const month = Number(rows.value[index][monthIndex]) || 0
          if (month < f.monthRange[0] || month > f.monthRange[1]) return false
        }
      }
    }

    // Filtre par types de plateformes
    if (f.platformTypes.length > 0) {
      if (headers.value.length > 0 && index < rows.value.length) {
        const platformTypeIndex = headers.value.indexOf('Type de plateforme')
        if (platformTypeIndex !== -1) {
          const platformType = rows.value[index][platformTypeIndex]
          if (!f.platformTypes.includes(platformType)) return false
        }
      }
    }

    // Filtre par consoles spécifiques (colonnes binaires DK-EL, indices 114-141)
    if (f.consoles.length > 0) {
      if (headers.value.length > 0 && index < rows.value.length) {
        // Mapping des consoles vers leurs indices de colonnes
        const consoleMapping = {
          'Atari 2600': 114, 'ColecoVision': 115, 'Odyssey2': 116, 'Intellivision': 117,
          'Atari 7800': 118, 'NES': 119, 'Videopac G7400': 120, 'MasterSystem': 121,
          'SuperNES': 122, 'CDi': 123, 'SegaGenesis': 124, 'TurboGrafx16': 125,
          'AtariJaguar': 126, 'Nintendo64': 127, 'SegaSaturn': 128, 'PCFX': 129,
          'PlayStation': 130, 'GameCube': 131, 'Dreamcast': 132, 'PlayStation2': 133,
          'Xbox': 134, 'Wii': 135, 'HyperScan': 136, 'PlayStation3': 137,
          'Xbox360': 138, 'NintendoSwitch': 139, 'PlayStation4': 140, 'XboxOne': 141
        }

        // Vérifier si au moins une des consoles sélectionnées est présente (logique OR)
        const hasSelectedConsole = f.consoles.some(console => {
          const colIndex = consoleMapping[console]
          return colIndex !== undefined && Number(rows.value[index][colIndex]) === 1
        })

        if (!hasSelectedConsole) return false
      }
    }

    // Filtre par types de notes (scoreTypes)
    if (f.scoreTypes.length > 0) {
      if (headers.value.length > 0 && index < rows.value.length) {
        // Mapping des types de scores vers leurs indices de colonnes
        const scoreTypeMapping = {
          'general': 35, 'visual': 39, 'sound': 43, 'content': 47,
          'gameplay': 51, 'playtime': 63, 'difficulty': 67, 'price': 75, 'other': 83
        }

        // Vérifier si au moins un des types de scores sélectionnés a une valeur
        let hasValidScore = false
        for (const scoreType of f.scoreTypes) {
          const colIndex = scoreTypeMapping[scoreType]
          if (colIndex !== undefined) {
            const scoreValue = Number(rows.value[index][colIndex])
            if (!isNaN(scoreValue) && scoreValue > 0) {
              // Vérifier si le score est dans la plage
              if (scoreValue >= f.scoreRange[0] && scoreValue <= f.scoreRange[1]) {
                hasValidScore = true
                break
              }
            }
          }
        }

        // Si includeUnscored est false, exclure les critiques sans note pour ces critères
        if (!hasValidScore && !f.includeUnscored) return false

        // Si on a trouvé un score valide, vérifier qu'il est dans la plage
        if (hasValidScore) {
          // Le score est déjà vérifié dans la boucle ci-dessus
        }
      }
    }

    // Filtre par magazines
    if (f.magazines.length > 0 && !f.magazines.includes(String(x.Magazine))) return false

    // Filtre par pays
    if (f.countries.length > 0 && !f.countries.includes(String(x.Pays))) return false

    // Filtre par nom d'auteur (match exact insensible à la casse sur les tokens)
    if (f.authorName) {
      const normalize = (s) => String(s || '').toLowerCase().trim()
      const target = normalize(f.authorName)

      // Construire la liste complète des auteurs de la critique à partir
      // du champ combiné et des colonnes spécifiques brutes
      const tokens = new Set()

      const pushTokens = (val) => {
        String(val || '')
          .split(/[,;]+/)
          .map(v => normalize(v))
          .filter(v => v && v !== '0' && !/^\d+$/.test(v))
          .forEach(v => tokens.add(v))
      }

      // Auteurs combinés mappés
      pushTokens(x.Auteurs)

      // Auteurs spécifiques (données brutes)
      if (headers.value.length > 0 && index < rows.value.length) {
        const row = rows.value[index]
        const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
        const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
        if (maleAuthorIndex !== -1) pushTokens(row[maleAuthorIndex])
        if (femaleAuthorIndex !== -1) pushTokens(row[femaleAuthorIndex])
      }

      if (!Array.from(tokens).includes(target)) return false
    }

    // Filtre par genre d'auteur
    if (f.authorGender && headers.value.length > 0) {
      const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
      const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
      const originalRowIndex = index // Utiliser l'index pour accéder aux données brutes

      if (originalRowIndex < rows.value.length) {
        const row = rows.value[originalRowIndex]

        if (f.authorGender === 'masculin' && maleAuthorIndex !== -1) {
          const maleAuthor = row[maleAuthorIndex]
          if (!maleAuthor || maleAuthor === '' || maleAuthor === '0') return false
        }

        if (f.authorGender === 'féminin' && femaleAuthorIndex !== -1) {
          const femaleAuthor = row[femaleAuthorIndex]
          if (!femaleAuthor || femaleAuthor === '' || femaleAuthor === '0') return false
        }
      }
    }

    return true
  })
})

function updateFilters(newFilters) {
  sidebarFilters.value = { ...newFilters }
  page.value = 1 // Reset pagination
}

// Initialiser les filtres avec les bonnes valeurs par défaut
watch(facets, (newFacets) => {
  if (newFacets.minYear && newFacets.maxYear) {
    sidebarFilters.value.yearRange = [newFacets.minYear, newFacets.maxYear]
  }
}, { immediate: true })

// Watch pour réinitialiser la pagination quand les filtres changent
watch([query, sortKey, sortDir, sidebarFilters], () => { page.value = 1 }, { deep: true })

const filteredRowsObjects = computed(() => {
  const keys = filteredHeaders.value
  const arr = filteredByFilters.value

  // Convertir les objets mappés en format tableau pour l'affichage
  return arr.map(item => {
    return keys.map(key => {
      // Mapper les clés d'affichage vers les propriétés de l'objet
      switch(key) {
        case 'Titre': return item.Titre
        case 'Plateforme': return item.Plateforme
        case 'Note': return item.Note
        case 'Année': return item.Année
        case 'Pays': return item.Pays
        case 'Auteurs': return item.Auteurs
        case 'Développeur': return item.Développeur
        case 'Éditeur': return item.Éditeur
        default: return item[key] || ''
      }
    })
  })
})

async function fetchArrayBuffer(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.arrayBuffer()
}

onMounted(async () => {
  try {
    isLoading.value = true
    const buf = await fetchArrayBuffer('/data/datareviews.xlsx')
    const worker = new Worker(new URL('../workers/xlsxWorker.js', import.meta.url), { type: 'module' })
    const parsed = await new Promise((resolve, reject) => {
      worker.onmessage = (evt) => {
        const { type, payload } = evt.data || {}
        if (type === 'parsed') resolve(payload.rows)
        if (type === 'error') reject(new Error(payload.message))
      }
      worker.onerror = (err) => reject(err)
      worker.postMessage({ type: 'parse', payload: { arrayBuffer: buf } })
    })
    headers.value = parsed[0] || []
    rows.value = parsed.slice(1)

    console.log('Données chargées:', {
      headers: headers.value.length,
      rows: rows.value.length,
      firstRow: rows.value[0]?.slice(0, 5)
    })

    const selection = buildImportantColumns(headers.value)
    filteredHeaders.value = selection.map(c => c.label)
    filteredRows.value = rows.value.map(r => selection.map(c => r[c.index]))

    console.log('Colonnes sélectionnées:', selection)
    console.log('Headers filtrés:', filteredHeaders.value)
    console.log('Premières lignes filtrées:', filteredRows.value.slice(0, 3))

    // Initialiser le mapping automatiquement
    initMapping()
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    isLoading.value = false
  }
})



function buildImportantColumns(allHeaders) {
  const lower = allHeaders.map(h => String(h || '').toLowerCase())

  const want = [
    { key: 'title', labels: ['title','game','name','titre','jeu'], display: 'Titre' },
    // Retirer Plateforme et Note de l'affichage principal
    { key: 'year', labels: ['year','release year','annee','année','date'], display: 'Année' },
    { key: 'country', labels: ['country','pays','region'], display: 'Pays' },
    { key: 'author', labels: ['author','auteur','autrice','writer'], display: 'Auteurs' },
    { key: 'developer', labels: ['developer','dev','studio'], display: 'Développeur' },
    { key: 'publisher', labels: ['publisher','éditeur','editeur'], display: 'Éditeur' },
    { key: 'magazine', labels: ['magazine','revue','journal','publication'], display: 'Magazine' },
  ]

  const selected = []
  for (const w of want) {
    const idx = lower.findIndex(h => w.labels.some(l => h.includes(l)))
    if (idx !== -1) selected.push({ key: w.key, index: idx, label: w.display })
  }
  return selected
}
</script>

<template>
  <div class="page-layout">
    <!-- Sidebar des filtres -->
    <FiltersSidebar
      :facets="facets"
      :active-filters="sidebarFilters"
      @update:filters="updateFilters"
    />

    <!-- Contenu principal -->
    <div class="main-content">
      <div class="container">
        <header class="page-head">
          <div>
            <h1>Toutes les critiques</h1>
          </div>
          <button class="btn" @click="showRaw = !showRaw">{{ showRaw ? 'Masquer l’aperçu brut' : 'Voir l’aperçu brut' }}</button>
        </header>

        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <div class="loading-text">Chargement des critiques …</div>
        </div>
        <div v-else-if="error" class="error">Erreur: {{ error }}</div>

        <template v-else>
        <div class="toolbar">
          <input class="input" type="search" v-model="query" placeholder="Rechercher… (titre, plateforme, etc.)" />
          <div class="sort">
            <label>Trier par</label>
            <select v-model="sortKey" class="select">
              <option v-for="h in filteredHeaders" :key="h" :value="h">{{ h }}</option>
            </select>
            <select v-model="sortDir" class="select">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <div class="table-wrap" v-if="filteredHeaders.length">
          <table class="data">
            <thead>
              <tr>
                <th v-for="h in filteredHeaders" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in pageSlice" :key="i" class="clickable-row" @click="openModal(it._full || it)">
                <td v-for="h in filteredHeaders" :key="h">{{ it[h] }}</td>
              </tr>
            </tbody>
          </table>
          <div class="pager">
            <button class="btn" :disabled="page<=1" @click="page = Math.max(1, page-1)">Précédent</button>
            <span class="page-info">Page {{ page }} / {{ totalPages }}</span>
            <button class="btn" :disabled="page>=totalPages" @click="page = Math.min(totalPages, page+1)">Suivant</button>
          </div>
        </div>

      <section class="panel" v-if="showRaw">
        <h2>Aperçu brut (toutes colonnes)</h2>
        <div class="table-wrap" v-if="headers.length">
          <table class="data">
            <thead>
              <tr>
                <th v-for="h in headers" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in rows" :key="i">
                <td v-for="(c, j) in r" :key="j">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
        <!-- Modal Détail de la critique (version simple) -->
        <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card" role="dialog" aria-modal="true">
            <header class="modal-header">
              <h3 class="modal-title">{{ modalItem?.Titre || 'Critique' }}</h3>
              <button class="modal-close" @click="closeModal" aria-label="Fermer">×</button>
            </header>
            <div class="modal-body">
              <div class="modal-grid">
                <div class="modal-field">
                  <div class="label">Magazine</div>
                  <div class="value">{{ modalItem?.Magazine || '-' }}</div>
                </div>
                  <div class="modal-field">
                    <div class="label">Jeu</div>
                    <div class="value">{{ modalItem?.Titre || '-' }}</div>
                  </div>
                <div class="modal-field">
                  <div class="label">Pays</div>
                  <div class="value">{{ modalItem?.Pays || '-' }}</div>
                </div>
                <div class="modal-field">
                  <div class="label">Auteurs</div>
                  <div class="value">{{ modalItem?.Auteurs || '-' }}</div>
                </div>
              </div>
            </div>
            <footer class="modal-footer">
              <button class="btn" @click="closeModal">Fermer</button>
            </footer>
          </div>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Layout principal avec sidebar */
.page-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  overflow-x: auto;
}

.container {
  max-width: none;
  margin: 0;
  padding: 16px;
  width: 100%;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 24px;
}

.btn {
  background: #000000;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #333333;
}

/* Toolbar de recherche et tri */
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sort {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

/* Tables et contenu */
.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

thead th {
  background: #f9fafb;
  position: sticky;
  top: 0;
  font-weight: 600;
  color: #374151;
}

tbody tr:hover {
  background: #f9fafb;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s, transform 0.05s;
}

.clickable-row:active {
  transform: scale(0.998);
}

/* Pagination avec style noir */
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.pager button {
  padding: 8px 12px;
  border: 1px solid #000000;
  background: #000000;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pager button:hover:not(:disabled) {
  background: #333333;
  border-color: #333333;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #666666;
  border-color: #666666;
}

.pager .current {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* États */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top: 3px solid #02dcde;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  color: #6b7280;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.hint {
  color: #4b5563;
  margin-top: 12px;
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.modal-card {
  width: min(800px, 95vw);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #111827;
  color: #ffffff;
}

.modal-title {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

/* PDF styles removed in simple modal */

.modal-field .label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.modal-field .value {
  font-size: 14px;
  color: #111827;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .sort {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .page-layout {
    flex-direction: column;
  }

  .page-head {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .container {
    padding: 12px;
  }
}
</style>


