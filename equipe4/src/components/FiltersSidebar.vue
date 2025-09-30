<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  facets: {
    type: Object,
    default: () => ({
      magazines: [],
      countries: [],
      platforms: [],
      authors: [],
      minYear: 1980,
      maxYear: 2025,
      minScore: 0,
      maxScore: 100
    })
  },
  activeFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:filters', 'clear-filter'])

// État local des filtres
const localFilters = ref({
  magazines: [],
  countries: [],
  platforms: [], // Plateformes spécifiques (PC, PlayStation, etc.)
  platformsPresence: '', // 'avec' ou 'sans' plateforme indiquée
  authorGender: '', // 'masculin', 'féminin', ou ''
  authorName: '',
  yearRange: [1981, 2021], // Valeurs par défaut basées sur les données réelles
  monthRange: [1, 12], // Janvier (1) à Décembre (12)
  scorePresence: '', // 'noté' ou 'non-noté'
  scoreRange: [0, 100]
})

// État des cartes déroulantes
const expandedCards = ref({
  magazines: false,
  countries: false,
  platforms: false,
  authors: false,
  years: false,
  scores: false
})

// Filtres actifs calculés
const activeFiltersList = computed(() => {
  const filters = []
  
  if (localFilters.value.magazines.length > 0) {
    filters.push({
      type: 'magazines',
      label: 'Magazines',
      value: localFilters.value.magazines.join(', '),
      count: localFilters.value.magazines.length
    })
  }
  
  if (localFilters.value.countries.length > 0) {
    filters.push({
      type: 'countries',
      label: 'Pays',
      value: localFilters.value.countries.join(', '),
      count: localFilters.value.countries.length
    })
  }
  
  if (localFilters.value.platforms.length > 0) {
    filters.push({
      type: 'platforms',
      label: 'Plateformes',
      value: localFilters.value.platforms.join(', '),
      count: localFilters.value.platforms.length
    })
  }

  if (localFilters.value.platformsPresence) {
    filters.push({
      type: 'platformsPresence',
      label: 'Indication plateforme',
      value: localFilters.value.platformsPresence === 'avec' ? 'Avec indication' : 'Sans indication',
      count: 1
    })
  }
  
  if (localFilters.value.authorGender) {
    filters.push({
      type: 'authorGender',
      label: 'Genre auteur',
      value: localFilters.value.authorGender,
      count: 1
    })
  }
  
  if (localFilters.value.authorName) {
    filters.push({
      type: 'authorName',
      label: 'Nom auteur',
      value: localFilters.value.authorName,
      count: 1
    })
  }
  
  const [minYear, maxYear] = localFilters.value.yearRange
  const [minMonth, maxMonth] = localFilters.value.monthRange
  const hasYearFilter = minYear !== 1981 || maxYear !== 2021
  const hasMonthFilter = minMonth !== 1 || maxMonth !== 12

  if (hasYearFilter || hasMonthFilter) {
    let periodValue = `${minYear} - ${maxYear}`
    if (hasMonthFilter) {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      periodValue += ` (${monthNames[minMonth - 1]} - ${monthNames[maxMonth - 1]})`
    }
    filters.push({
      type: 'yearRange',
      label: 'Période',
      value: periodValue,
      count: 1
    })
  }

  if (localFilters.value.scorePresence) {
    filters.push({
      type: 'scorePresence',
      label: 'Notation',
      value: localFilters.value.scorePresence === 'noté' ? 'Avec note' : 'Sans note',
      count: 1
    })
  }

  const [minScore, maxScore] = localFilters.value.scoreRange
  if (minScore !== 0 || maxScore !== 100) {
    filters.push({
      type: 'scoreRange',
      label: 'Plage de notes',
      value: `${minScore} - ${maxScore}`,
      count: 1
    })
  }
  
  return filters
})

// Fonctions de gestion des filtres
function toggleCard(cardName) {
  expandedCards.value[cardName] = !expandedCards.value[cardName]
}

function toggleArrayFilter(filterType, value) {
  const current = localFilters.value[filterType]
  const index = current.indexOf(value)
  
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(value)
  }
  
  emitFilters()
}

function updateYearRange(newRange) {
  localFilters.value.yearRange = [Number(newRange[0]), Number(newRange[1])]
  emitFilters()
}

function updateMonthRange(newRange) {
  localFilters.value.monthRange = [Number(newRange[0]), Number(newRange[1])]
  emitFilters()
}

function updateScoreRange(newRange) {
  localFilters.value.scoreRange = [Number(newRange[0]), Number(newRange[1])]
  emitFilters()
}

function setPlatformsPresence(presence) {
  localFilters.value.platformsPresence = presence
  emitFilters()
}

function setScorePresence(presence) {
  localFilters.value.scorePresence = presence
  emitFilters()
}

function setAuthorGender(gender) {
  localFilters.value.authorGender = gender
  emitFilters()
}

function setAuthorName(name) {
  localFilters.value.authorName = name
  emitFilters()
}

function clearFilter(filterType) {
  switch (filterType) {
    case 'magazines':
      localFilters.value.magazines = []
      break
    case 'countries':
      localFilters.value.countries = []
      break
    case 'platforms':
      localFilters.value.platforms = []
      break
    case 'platformsPresence':
      localFilters.value.platformsPresence = ''
      break
    case 'authorGender':
      localFilters.value.authorGender = ''
      break
    case 'authorName':
      localFilters.value.authorName = ''
      break
    case 'yearRange':
      localFilters.value.yearRange = [1981, 2021]
      localFilters.value.monthRange = [1, 12]
      break
    case 'scorePresence':
      localFilters.value.scorePresence = ''
      break
    case 'scoreRange':
      localFilters.value.scoreRange = [0, 100]
      break
  }
  emitFilters()
}

function clearAllFilters() {
  localFilters.value = {
    magazines: [],
    countries: [],
    platforms: [],
    platformsPresence: '',
    authorGender: '',
    authorName: '',
    yearRange: [1981, 2021],
    monthRange: [1, 12],
    scorePresence: '',
    scoreRange: [0, 100]
  }
  emitFilters()
}

function emitFilters() {
  emit('update:filters', { ...localFilters.value })
}

// Constantes pour les mois
const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// Liste de tous les auteurs disponibles
const allAuthors = computed(() => {
  const male = props.facets.authors?.male || []
  const female = props.facets.authors?.female || []

  // Créer un Set pour éviter les doublons et séparer les auteurs multiples
  const allAuthorsSet = new Set()

  // Ajouter les auteurs masculins
  male.forEach(author => {
    if (author && author !== '0') {
      // Séparer les auteurs multiples (séparés par des virgules, points-virgules, etc.)
      const authors = author.split(/[,;]+/).map(a => a.trim()).filter(a => {
        // Exclure les chiffres seuls, les valeurs vides, et les "0"
        return a && a !== '0' && !/^\d+$/.test(a)
      })
      authors.forEach(a => allAuthorsSet.add(a))
    }
  })

  // Ajouter les autrices féminines
  female.forEach(author => {
    if (author && author !== '0') {
      // Séparer les auteurs multiples
      const authors = author.split(/[,;]+/).map(a => a.trim()).filter(a => {
        // Exclure les chiffres seuls, les valeurs vides, et les "0"
        return a && a !== '0' && !/^\d+$/.test(a)
      })
      authors.forEach(a => allAuthorsSet.add(a))
    }
  })

  return Array.from(allAuthorsSet).sort()
})

// Recherche dans la liste des auteurs
const authorQuery = ref('')
const filteredAuthors = computed(() => {
  const q = (authorQuery.value || '').toLowerCase().trim()
  if (!q) return allAuthors.value
  return allAuthors.value.filter(a => a.toLowerCase().includes(q))
})

// Formatage des années pour l'affichage
function formatYear(year) {
  return year.toString()
}

// Formatage des mois pour l'affichage
function formatMonth(monthNumber) {
  return monthNames[monthNumber - 1] || monthNumber.toString()
}

// Initialiser les filtres avec les valeurs des facets (seulement si pas encore initialisé)
let isInitialized = false
watch(() => props.facets, (newFacets) => {
  if (newFacets.minYear && newFacets.maxYear && !isInitialized) {
    // Initialiser seulement si les valeurs sont encore par défaut
    if (localFilters.value.yearRange[0] === 1981 && localFilters.value.yearRange[1] === 2021) {
      localFilters.value.yearRange = [newFacets.minYear, newFacets.maxYear]
      isInitialized = true
    }
  }
}, { immediate: true, deep: true })
</script>

<template>
  <aside class="filters-sidebar">
    <!-- Section des filtres actifs (1/3 supérieur) -->
    <div class="active-filters-section">
      <div class="section-header">
        <h3>Filtres actifs</h3>
        <button 
          v-if="activeFiltersList.length > 0" 
          @click="clearAllFilters"
          class="clear-all-btn"
        >
          Tout effacer
        </button>
      </div>
      
      <div class="active-filters-list">
        <div 
          v-for="filter in activeFiltersList" 
          :key="filter.type"
          class="active-filter-item"
        >
          <div class="filter-info">
            <span class="filter-label">{{ filter.label }}</span>
            <span class="filter-value">{{ filter.value }}</span>
          </div>
          <button 
            @click="clearFilter(filter.type)"
            class="remove-filter-btn"
            :title="`Supprimer le filtre ${filter.label}`"
          >
            ×
          </button>
        </div>
        
        <div v-if="activeFiltersList.length === 0" class="no-active-filters">
          Aucun filtre actif
        </div>
      </div>
    </div>

    <!-- Section des filtres disponibles (2/3 inférieur) -->
    <div class="available-filters-section">
      <div class="section-header">
        <h3>Filtres disponibles</h3>
      </div>
      
      <!-- Filtre par Magazine -->
      <div class="filter-card">
        <button 
          @click="toggleCard('magazines')"
          class="card-header"
          :class="{ expanded: expandedCards.magazines }"
        >
          <span>Magazines / Revues</span>
          <span class="expand-icon">{{ expandedCards.magazines ? '−' : '+' }}</span>
        </button>
        
        <div v-if="expandedCards.magazines" class="card-content">
          <div class="filter-options">
            <label 
              v-for="magazine in facets.magazines" 
              :key="magazine"
              class="checkbox-option"
            >
              <input 
                type="checkbox"
                :checked="localFilters.magazines.includes(magazine)"
                @change="toggleArrayFilter('magazines', magazine)"
                style="margin-right: 5px;"
              />
              <span>{{ magazine }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Filtre par Pays -->
      <div class="filter-card">
        <button 
          @click="toggleCard('countries')"
          class="card-header"
          :class="{ expanded: expandedCards.countries }"
        >
          <span>Pays</span>
          <span class="expand-icon">{{ expandedCards.countries ? '−' : '+' }}</span>
        </button>
        
        <div v-if="expandedCards.countries" class="card-content">
          <div class="filter-options">
            <label 
              v-for="country in facets.countries" 
              :key="country"
              class="checkbox-option"
            >
              <input 
                type="checkbox"
                :checked="localFilters.countries.includes(country)"
                @change="toggleArrayFilter('countries', country)"
                style="margin-right: 5px;"
              />
              <span>{{ country }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Filtre par Plateforme -->
      <div class="filter-card">
        <button 
          @click="toggleCard('platforms')"
          class="card-header"
          :class="{ expanded: expandedCards.platforms }"
        >
          <span>Plateformes / Consoles</span>
          <span class="expand-icon">{{ expandedCards.platforms ? '−' : '+' }}</span>
        </button>
        
        <div v-if="expandedCards.platforms" class="card-content">
          <!-- Filtre par présence d'indication de plateforme -->
          <div class="filter-group">
            <label class="filter-group-label">Indication de plateforme</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  type="radio"
                  name="platformsPresence"
                  value=""
                  :checked="localFilters.platformsPresence === ''"
                  @change="setPlatformsPresence('')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Toutes</span>
              </label>
              <label class="radio-item">
                <input
                  type="radio"
                  name="platformsPresence"
                  value="avec"
                  :checked="localFilters.platformsPresence === 'avec'"
                  @change="setPlatformsPresence('avec')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Avec indication (1)</span>
              </label>
              <label class="radio-item">
                <input
                  type="radio"
                  name="platformsPresence"
                  value="sans"
                  :checked="localFilters.platformsPresence === 'sans'"
                  @change="setPlatformsPresence('sans')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Sans indication (0)</span>
              </label>
            </div>
          </div>

          <!-- Filtre par plateformes spécifiques -->
          <div class="filter-group">
            <label class="filter-group-label" style="margin-bottom: 5px;">Plateformes spécifiques</label>
            <div class="filter-options">
              <label
                v-for="platform in facets.platforms.slice(0, 20)"
                :key="platform"
                class="checkbox-option"
              >
                <input
                  type="checkbox"
                  :checked="localFilters.platforms.includes(platform)"
                  @change="toggleArrayFilter('platforms', platform)"
                  style="margin-right: 5px;"
                />
                <span>{{ platform }}</span>
              </label>
              <div v-if="facets.platforms.length > 20" class="more-options">
                ... et {{ facets.platforms.length - 20 }} autres
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtre par Auteur -->
      <div class="filter-card">
        <button
          @click="toggleCard('authors')"
          class="card-header"
          :class="{ expanded: expandedCards.authors }"
        >
          <span>Auteurs</span>
          <span class="expand-icon">{{ expandedCards.authors ? '−' : '+' }}</span>
        </button>

        <div v-if="expandedCards.authors" class="card-content">
          <div class="author-gender-filter">
            <label>Genre :</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  name="authorGender"
                  style="margin-right: 5px;"
                  value=""
                  :checked="localFilters.authorGender === ''"
                  @change="setAuthorGender('')"
                />
                <span>Tous</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  name="authorGender"
                  style="margin-right: 5px;"
                  value="masculin"
                  :checked="localFilters.authorGender === 'masculin'"
                  @change="setAuthorGender('masculin')"
                />
                <span>Masculin</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  name="authorGender"
                  style="margin-right: 5px;"
                  value="féminin"
                  :checked="localFilters.authorGender === 'féminin'"
                  @change="setAuthorGender('féminin')"
                />
                <span>Féminin</span>
              </label>
            </div>
          </div>

          <div class="author-name-filter">
            <label for="authorName">Nom de l'auteur :</label>
            <input
              type="search"
              v-model="authorQuery"
              placeholder="Rechercher un auteur…"
              class="text-input"
              autocomplete="off"
            />
            <div class="filter-options" style="max-height: 180px; margin-top: 8px;">
              <label
                v-for="author in filteredAuthors"
                :key="author"
                class="checkbox-option"
              >
                <input
                  type="radio"
                  name="authorName"
                  :checked="localFilters.authorName === author"
                  @change="setAuthorName(author)"
                />
                <span>{{ author }}</span>
              </label>
              <div v-if="filteredAuthors.length === 0" class="no-active-filters">Aucun auteur</div>
            </div>
            <div style="margin-top: 8px; display: flex; gap: 8px;">
              <button class="clear-all-btn" @click="setAuthorName('')">Effacer</button>
              <span v-if="localFilters.authorName" style="font-size:12px;color:#6b7280;align-self:center;">Sélectionné: {{ localFilters.authorName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtre par Période (Timeline) -->
      <div class="filter-card">
        <button
          @click="toggleCard('years')"
          class="card-header"
          :class="{ expanded: expandedCards.years }"
        >
          <span>Période</span>
          <span class="expand-icon">{{ expandedCards.years ? '−' : '+' }}</span>
        </button>

        <div v-if="expandedCards.years" class="card-content">
          <div class="timeline-filter">
            <!-- Filtre par années -->
            <div class="filter-group">
              <label class="filter-group-label">Années</label>
              <div class="timeline-labels">
                <span>{{ formatYear(localFilters.yearRange[0]) }}</span>
                <span>{{ formatYear(localFilters.yearRange[1]) }}</span>
              </div>
              <div class="range-slider">
                <input
                  type="range"
                  :min="facets.minYear || 1981"
                  :max="facets.maxYear || 2025"
                  :value="localFilters.yearRange[0]"
                  @input="updateYearRange([$event.target.value, localFilters.yearRange[1]])"
                  class="range-input range-min"
                />
                <input
                  type="range"
                  :min="facets.minYear || 1981"
                  :max="facets.maxYear || 2021"
                  :value="localFilters.yearRange[1]"
                  @input="updateYearRange([localFilters.yearRange[0], $event.target.value])"
                  class="range-input range-max"
                />
              </div>
              <div class="timeline-info">
                <span>De {{ localFilters.yearRange[0] }} à {{ localFilters.yearRange[1] }}</span>
              </div>
            </div>

            <!-- Filtre par mois -->
            <div class="filter-group">
              <label class="filter-group-label">Mois</label>
              <div class="month-selector">
                <div class="month-range">
                  <div class="month-select">
                    <label>De :</label>
                    <select
                      :value="localFilters.monthRange[0]"
                      @change="updateMonthRange([$event.target.value, localFilters.monthRange[1]])"
                      class="month-dropdown"
                    >
                      <option v-for="(month, index) in monthNames" :key="index + 1" :value="index + 1">
                        {{ month }}
                      </option>
                    </select>
                  </div>
                  <div class="month-select">
                    <label>À :</label>
                    <select
                      :value="localFilters.monthRange[1]"
                      @change="updateMonthRange([localFilters.monthRange[0], $event.target.value])"
                      class="month-dropdown"
                    >
                      <option v-for="(month, index) in monthNames" :key="index + 1" :value="index + 1">
                        {{ month }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="month-info">
                  <span>{{ formatMonth(localFilters.monthRange[0]) }} - {{ formatMonth(localFilters.monthRange[1]) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtre par Notes -->
      <div class="filter-card">
        <button
          @click="toggleCard('scores')"
          class="card-header"
          :class="{ expanded: expandedCards.scores }"
        >
          <span>Notes</span>
          <span class="expand-icon">{{ expandedCards.scores ? '−' : '+' }}</span>
        </button>

        <div v-if="expandedCards.scores" class="card-content">
          <!-- Filtre par présence de note -->
          <div class="filter-group">
            <label class="filter-group-label">Présence de note</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  type="radio"
                  name="scorePresence"
                  value=""
                  :checked="localFilters.scorePresence === ''"
                  @change="setScorePresence('')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Toutes</span>
              </label>
              <label class="radio-item">
                <input
                  type="radio"
                  name="scorePresence"
                  value="noté"
                  :checked="localFilters.scorePresence === 'noté'"
                  @change="setScorePresence('noté')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Avec note (1)</span>
              </label>
              <label class="radio-item">
                <input
                  type="radio"
                  name="scorePresence"
                  value="non-noté"
                  :checked="localFilters.scorePresence === 'non-noté'"
                  @change="setScorePresence('non-noté')"
                  style="margin-right: 5px;"
                />
                <span class="radio-label">Sans note (0)</span>
              </label>
            </div>
          </div>

          <!-- Filtre par plage de notes -->
          <div class="filter-group">
            <label class="filter-group-label">Plage de notes</label>
            <div class="score-filter">
              <div class="score-labels">
                <span>{{ localFilters.scoreRange[0] }}</span>
                <span>{{ localFilters.scoreRange[1] }}</span>
              </div>
              <div class="range-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="localFilters.scoreRange[0]"
                  @input="updateScoreRange([$event.target.value, localFilters.scoreRange[1]])"
                  class="range-input range-min"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="localFilters.scoreRange[1]"
                  @input="updateScoreRange([localFilters.scoreRange[0], $event.target.value])"
                  class="range-input range-max"
                />
              </div>
              <div class="score-info">
                <span>Notes entre {{ localFilters.scoreRange[0] }} et {{ localFilters.scoreRange[1] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.filters-sidebar {
  width: 320px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Section des filtres actifs (1/3 supérieur) */
.active-filters-section {
  flex: 0 0 33.333%;
  padding: 16px;
  border-bottom: 2px solid #e5e7eb;
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.clear-all-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-all-btn:hover {
  background: #dc2626;
}

.active-filters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.active-filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.filter-info {
  flex: 1;
  min-width: 0;
}

.filter-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
}

.filter-value {
  display: block;
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-filter-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.remove-filter-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.no-active-filters {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 20px;
}

/* Section des filtres disponibles (2/3 inférieur) */
.available-filters-section {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.filter-card {
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  width: 100%;
  background: #f9fafb;
  border: none;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  transition: background-color 0.2s;
}

.card-header:hover {
  background: #f3f4f6;
}

.card-header.expanded {
  background: #e5e7eb;
}

.expand-icon {
  font-size: 18px;
  font-weight: bold;
}

.card-content {
  padding: 16px;
  background: #ffffff;
}

/* Styles généraux pour les labels */
.card-content label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 0;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
}

.checkbox-option span {
  font-size: 14px;
  color: #374151;
}

.more-options {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  padding: 4px 0;
}

/* Filtres spéciaux */
.author-gender-filter {
  margin-bottom: 16px;
}

.author-gender-filter label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.radio-group {
  display: flex;
  gap: 14px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.radio-option span {
  font-size: 14px;
  color: #374151;
}

.author-name-filter label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 6px;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Timeline et Score filters */
.timeline-filter,
.score-filter {
  padding: 8px 0;
}

.filter-group {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.filter-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.filter-group-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 14px;
  font-size: 14px;
}

.timeline-labels,
.score-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
}

/* Styles pour les groupes radio */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  margin-right: 5px;
  cursor: pointer;
  padding: 4px 0;
}

.radio-item input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.radio-label {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

/* Styles pour le select d'auteurs avec validation des données */
.author-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  margin-top: 4px;
}

.author-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Styles pour le sélecteur de mois */
.month-selector {
  margin-top: 8px;
}

.month-range {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.month-select {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-select label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.month-dropdown {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: #374151;
}

.month-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.month-info {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.range-slider {
  position: relative;
  height: 20px;
  margin-bottom: 8px;
}

.range-input {
  position: absolute;
  width: 100%;
  height: 6px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
}

.range-input::-webkit-slider-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  pointer-events: auto;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.range-input::-moz-range-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  border: none;
}

.range-input::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  pointer-events: auto;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-info,
.score-info {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .filters-sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .filters-sidebar.open {
    transform: translateX(0);
  }
}
</style>
