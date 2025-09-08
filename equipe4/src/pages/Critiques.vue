<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ReviewsList from '../components/ReviewsList.vue'

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
  let items = filteredRows.value.map(r => Object.fromEntries(r.map((v, i) => [keys[i], v])))
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    items = items.filter(it => Object.values(it).some(v => String(v ?? '').toLowerCase().includes(q)))
  }
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
watch([query, sortKey, sortDir], () => { page.value = 1 })

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
  return rows.value.map(r => ({
    Titre: idx.Titre>=0 ? r[idx.Titre] : undefined,
    Plateforme: idx.Plateforme>=0 ? r[idx.Plateforme] : undefined,
    Note: idx.Note>=0 ? Number(r[idx.Note]) : undefined,
    Année: idx.Année>=0 ? Number(String(r[idx.Année]).slice(0,4)) : undefined,
    Magazine: idx.Magazine>=0 ? r[idx.Magazine] : undefined,
    Auteur: idx.Auteur>=0 ? r[idx.Auteur] : undefined,
    Pays: idx.Pays>=0 ? r[idx.Pays] : undefined,
  }))
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

const filters = ref({ minYear: '', maxYear: '', platforms: [], magazines: [], countries: [], author: '' })

const facets = computed(() => {
  const arr = mappedObjects.value
  const uniq = (vals) => Array.from(new Set(vals.filter(Boolean))).sort()
  return {
    platforms: uniq(arr.map(x => x.Plateforme)),
    magazines: uniq(arr.map(x => x.Magazine)),
    countries: uniq(arr.map(x => x.Pays)),
    minYear: Math.min(...arr.map(x => x.Année || Infinity)),
    maxYear: Math.max(...arr.map(x => x.Année || -Infinity)),
  }
})

const filteredByFilters = computed(() => {
  const arr = mappedObjects.value
  const f = filters.value
  const minY = f.minYear ? Number(f.minYear) : -Infinity
  const maxY = f.maxYear ? Number(f.maxYear) : Infinity
  const plats = new Set(f.platforms)
  const mags = new Set(f.magazines)
  const ctries = new Set(f.countries)
  const authorQ = (f.author || '').toLowerCase()
  return arr.filter(x => {
    const y = x.Année ?? 0
    if (!(y >= minY && y <= maxY)) return false
    if (plats.size && !plats.has(String(x.Plateforme))) return false
    if (mags.size && !mags.has(String(x.Magazine))) return false
    if (ctries.size && !ctries.has(String(x.Pays))) return false
    if (authorQ && !String(x.Auteur || '').toLowerCase().includes(authorQ)) return false
    return true
  })
})

const filteredRowsObjects = computed(() => {
  const keys = filteredHeaders.value
  const arr = filteredByFilters.value
  return arr.map(it => keys.map(h => it[h]))
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

    const selection = buildImportantColumns(headers.value)
    filteredHeaders.value = selection.map(c => c.label)
    filteredRows.value = rows.value.map(r => selection.map(c => r[c.index]))
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    isLoading.value = false
  }
})

const mapped = ref([])

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
      <section class="panel">
        <h2>Colonnes principales</h2>
        <details class="panel" @toggle="onToggleMapping">
          <summary>Mapping des colonnes</summary>
          <div class="mapping">
            <div class="map-row">
              <label>Titre</label>
              <select v-model="mapping.Titre" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Plateforme</label>
              <select v-model="mapping.Plateforme" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Note</label>
              <select v-model="mapping.Note" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Année</label>
              <select v-model="mapping.Année" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Magazine</label>
              <select v-model="mapping.Magazine" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Auteur</label>
              <select v-model="mapping.Auteur" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="map-row">
              <label>Pays</label>
              <select v-model="mapping.Pays" class="select">
                <option value="">—</option>
                <option v-for="h in allHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </details>

        <section class="panel">
          <h3>Requête: Top / Bottom par note moyenne</h3>
          <div class="toolbar">
            <label>Mode</label>
            <select v-model="reqMode" class="select">
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
            <label>Grouper par</label>
            <select v-model="reqGroupBy" class="select">
              <option value="Jeu">Jeu</option>
              <option value="Année">Année</option>
              <option value="Plateforme">Plateforme</option>
              <option value="Magazine">Magazine</option>
            </select>
            <label>Limiter à</label>
            <input class="input" type="number" min="1" max="100" v-model.number="reqLimit" />
          </div>
          <div class="table-wrap" v-if="reqResults.length">
            <table class="data">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Moyenne</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r,i) in reqResults" :key="i">
                  <td>{{ r.Libellé }}</td>
                  <td>{{ r.Moyenne }}</td>
                  <td>{{ r.Nombre }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
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
      </section>

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
</template>

<style scoped>
.container { max-width: 1040px; margin: 0 auto; padding: 16px; }
h1 { margin: 8px 0 16px; }
.table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
thead th { background: #f9fafb; position: sticky; top: 0; }
.hint { color: #4b5563; margin-top: 12px; }
.error { color: #dc2626; }
</style>


