<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ReviewsList from '../components/ReviewsList.vue'
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

const filteredAndSorted = computed(() => {
  const keys = filteredHeaders.value
  // Utiliser les données filtrées par la sidebar au lieu de filteredRows
  let items = filteredRowsObjects.value.map(r => Object.fromEntries(r.map((v, i) => [keys[i], v])))

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
  Auteur: '',
  Pays: '',
})
const allHeaders = computed(() => headers.value || [])
function initMapping() {
  const lower = (headers.value || []).map(h => String(h || '').toLowerCase())
  function find(labels) { const i = lower.findIndex(h => labels.some(l => h.includes(l))); return i>=0 ? headers.value[i] : '' }
  mapping.value.Titre = find(['title','game','name','titre','jeu'])
  mapping.value.Plateforme = find(['platform','console','system','plateforme'])
  mapping.value.Note = find(['score','rating','note'])
  mapping.value.Année = find(['year','release year','annee','année','date'])
  mapping.value.Magazine = find(['magazine','revue','journal','publication'])
  mapping.value.Auteur = find(['author','auteur','autrice','writer'])
  mapping.value.Pays = find(['country','pays','region'])
}

const mappedObjects = computed(() => {
  if (!headers.value.length) return []
  const idx = Object.fromEntries(Object.entries(mapping.value).map(([k,v]) => [k, headers.value.indexOf(v)]))
  const mapped = rows.value.map(r => ({
    Titre: idx.Titre>=0 ? r[idx.Titre] : undefined,
    Plateforme: idx.Plateforme>=0 ? r[idx.Plateforme] : undefined,
    Note: idx.Note>=0 ? Number(r[idx.Note]) : undefined,
    Année: idx.Année>=0 ? Number(String(r[idx.Année]).slice(0,4)) : undefined,
    Magazine: idx.Magazine>=0 ? r[idx.Magazine] : undefined,
    Auteur: idx.Auteur>=0 ? r[idx.Auteur] : undefined,
    Pays: idx.Pays>=0 ? r[idx.Pays] : undefined,
  }))

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

const reqMode = ref('top') 
const reqGroupBy = ref('Jeu') 
const reqLimit = ref(10)
const reqResults = computed(() => {
  const arr = mappedObjects.value
  if (!arr.length) return []
  const keyField = reqGroupBy.value === 'Jeu' ? 'Titre' : reqGroupBy.value
  const groups = new Map()
  for (const it of arr) {
    const key = it[keyField]
    const sc = it.Note
    if (key == null || sc == null || Number.isNaN(sc)) continue
    const g = groups.get(key) || { key, sum: 0, count: 0 }
    g.sum += Number(sc); g.count += 1
    groups.set(key, g)
  }
  let agg = Array.from(groups.values()).map(g => ({
    Libellé: g.key,
    Moyenne: +(g.sum / g.count).toFixed(2),
    Nombre: g.count,
  }))
  agg.sort((a,b) => (reqMode.value === 'top' ? (b.Moyenne - a.Moyenne) : (a.Moyenne - b.Moyenne)))
  return agg.slice(0, reqLimit.value)
})

function onToggleMapping(ev) {
  if (ev?.target?.open) initMapping()
}

// Nouveaux filtres pour la sidebar
const sidebarFilters = ref({
  magazines: [],
  countries: [],
  platforms: [],
  authorGender: '',
  authorName: '',
  yearRange: [1980, 2025],
  scoreRange: [0, 100]
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

  return {
    platforms: uniq(arr.map(x => x.Plateforme)),
    magazines: uniq(arr.map(x => x.Magazine)),
    countries: uniq(arr.map(x => x.Pays)),
    authors: {
      male: Array.from(authorsM).sort(),
      female: Array.from(authorsF).sort()
    },
    minYear: Math.min(...arr.map(x => x.Année || Infinity)),
    maxYear: Math.max(...arr.map(x => x.Année || -Infinity)),
    minScore: 0,
    maxScore: 100
  }
})

const filteredByFilters = computed(() => {
  const arr = mappedObjects.value
  const f = sidebarFilters.value

  return arr.filter((x, index) => {
    // Filtre par année
    const year = x.Année ?? 0
    if (year < f.yearRange[0] || year > f.yearRange[1]) return false

    // Filtre par note
    const score = x.Note ?? 0
    if (score < f.scoreRange[0] || score > f.scoreRange[1]) return false

    // Filtre par plateformes
    if (f.platforms.length > 0 && !f.platforms.includes(String(x.Plateforme))) return false

    // Filtre par magazines
    if (f.magazines.length > 0 && !f.magazines.includes(String(x.Magazine))) return false

    // Filtre par pays
    if (f.countries.length > 0 && !f.countries.includes(String(x.Pays))) return false

    // Filtre par nom d'auteur
    if (f.authorName && !String(x.Auteur || '').toLowerCase().includes(f.authorName.toLowerCase())) return false

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
        case 'Genre': return item.Genre
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
    { key: 'platform', labels: ['platform','console','system','plateforme'], display: 'Plateforme' },
    { key: 'score', labels: ['score','rating','note'], display: 'Note' },
    { key: 'year', labels: ['year','release year','annee','année','date'], display: 'Année' },
    { key: 'country', labels: ['country','pays','region'], display: 'Pays' },
    { key: 'genre', labels: ['genre','category','type'], display: 'Genre' },
    { key: 'developer', labels: ['developer','dev','studio'], display: 'Développeur' },
    { key: 'publisher', labels: ['publisher','éditeur','editeur'], display: 'Éditeur' },
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
              <tr v-for="(it, i) in pageSlice" :key="i">
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
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #2563eb;
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

/* Pagination */
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.pager button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pager button:hover:not(:disabled) {
  background: #f3f4f6;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
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


