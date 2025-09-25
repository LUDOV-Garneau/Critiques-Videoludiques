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
  platforms: [],
  authorGender: '', // 'masculin', 'féminin', ou ''
  authorName: '',
  yearRange: [props.facets.minYear || 1980, props.facets.maxYear || 2025],
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
  if (minYear !== (props.facets.minYear || 1980) || maxYear !== (props.facets.maxYear || 2025)) {
    filters.push({
      type: 'yearRange',
      label: 'Période',
      value: `${minYear} - ${maxYear}`,
      count: 1
    })
  }
  
  const [minScore, maxScore] = localFilters.value.scoreRange
  if (minScore !== 0 || maxScore !== 100) {
    filters.push({
      type: 'scoreRange',
      label: 'Notes',
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

function updateScoreRange(newRange) {
  localFilters.value.scoreRange = [Number(newRange[0]), Number(newRange[1])]
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
    case 'authorGender':
      localFilters.value.authorGender = ''
      break
    case 'authorName':
      localFilters.value.authorName = ''
      break
    case 'yearRange':
      localFilters.value.yearRange = [props.facets.minYear || 1980, props.facets.maxYear || 2025]
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
    authorGender: '',
    authorName: '',
    yearRange: [props.facets.minYear || 1980, props.facets.maxYear || 2025],
    scoreRange: [0, 100]
  }
  emitFilters()
}

function emitFilters() {
  emit('update:filters', { ...localFilters.value })
}

// Formatage des années pour l'affichage
function formatYear(year) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  // Pour l'exemple, on affiche juste l'année, mais on pourrait ajouter des mois
  return year.toString()
}

// Initialiser les filtres avec les valeurs des facets
watch(() => props.facets, (newFacets) => {
  if (newFacets.minYear && newFacets.maxYear) {
    if (localFilters.value.yearRange[0] === 1980 && localFilters.value.yearRange[1] === 2025) {
      localFilters.value.yearRange = [newFacets.minYear, newFacets.maxYear]
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
              />
              <span>{{ platform }}</span>
            </label>
            <div v-if="facets.platforms.length > 20" class="more-options">
              ... et {{ facets.platforms.length - 20 }} autres
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
              id="authorName"
              type="text"
              v-model="localFilters.authorName"
              @input="setAuthorName($event.target.value)"
              placeholder="Rechercher un auteur..."
              class="text-input"
            />
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
            <div class="timeline-labels">
              <span>{{ formatYear(localFilters.yearRange[0]) }}</span>
              <span>{{ formatYear(localFilters.yearRange[1]) }}</span>
            </div>
            <div class="range-slider">
              <input
                type="range"
                :min="facets.minYear || 1980"
                :max="facets.maxYear || 2025"
                :value="localFilters.yearRange[0]"
                @input="updateYearRange([$event.target.value, localFilters.yearRange[1]])"
                class="range-input range-min"
              />
              <input
                type="range"
                :min="facets.minYear || 1980"
                :max="facets.maxYear || 2025"
                :value="localFilters.yearRange[1]"
                @input="updateYearRange([localFilters.yearRange[0], $event.target.value])"
                class="range-input range-max"
              />
            </div>
            <div class="timeline-info">
              <span>De {{ localFilters.yearRange[0] }} à {{ localFilters.yearRange[1] }}</span>
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

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
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
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 4px;
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
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
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

.timeline-labels,
.score-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
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
