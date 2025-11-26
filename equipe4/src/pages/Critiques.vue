<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FiltersSidebar from '../components/FiltersSidebar.vue'
import { extractGenres } from '../utils/genreCleaner.js'
import { applyDataCorrections, normalizeScore } from '../utils/dataCorrections.js'
import ChartsGraphique from '../components/Graphique.vue'

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

// Fonction pour formater les auteurs avec leurs tags d'identité
const formattedAuthorsWithTags = computed(() => {
  if (!modalItem.value || !headers.value.length) return []

  // Trouver l'index de la ligne originale dans mappedObjects
  const originalItem = modalItem.value._full || modalItem.value
  let originalIndex = mappedObjects.value.findIndex(item => item === originalItem)

  // Si pas trouvé par référence directe, chercher par contenu
  if (originalIndex === -1) {
    originalIndex = mappedObjects.value.findIndex(item => {
      return item.Titre === originalItem.Titre &&
        item.Année === originalItem.Année &&
        item.Magazine === originalItem.Magazine
    })
  }

  if (originalIndex === -1 || originalIndex >= rows.value.length) return []

  const row = rows.value[originalIndex]
  const authorsWithTags = []

  // Indices des colonnes
  const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
  const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
  const ambiguousAuthorIndex = headers.value.indexOf('Nom des auteurs.rices ambigus.ës')
  const minorityIndex = headers.value.findIndex(h => {
    const lower = String(h || '').toLowerCase()
    return lower.includes('minorité') || lower.includes('minorite') || lower === 'cp'
  })

  // Vérifier si c'est une minorité ethnique
  const isMinority = minorityIndex !== -1 && row[minorityIndex] && row[minorityIndex] !== '' && row[minorityIndex] !== '0'

  // Auteurs masculins
  if (maleAuthorIndex !== -1 && row[maleAuthorIndex] && row[maleAuthorIndex] !== '' && row[maleAuthorIndex] !== '0') {
    const authors = String(row[maleAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a && a !== '0' && !/^\d+$/.test(a))
    authors.forEach(author => {
      const tags = ['Masculin']
      if (isMinority) tags.push('Minorité ethnique')
      authorsWithTags.push({ name: author, tags })
    })
  }

  // Auteurs féminins
  if (femaleAuthorIndex !== -1 && row[femaleAuthorIndex] && row[femaleAuthorIndex] !== '' && row[femaleAuthorIndex] !== '0') {
    const authors = String(row[femaleAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a && a !== '0' && !/^\d+$/.test(a))
    authors.forEach(author => {
      const tags = ['Féminin']
      if (isMinority) tags.push('Minorité ethnique')
      authorsWithTags.push({ name: author, tags })
    })
  }

  // Auteurs ambigu (colonne CY)
  if (ambiguousAuthorIndex !== -1 && row[ambiguousAuthorIndex] && row[ambiguousAuthorIndex] !== '' && row[ambiguousAuthorIndex] !== '0') {
    const authors = String(row[ambiguousAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a && a !== '0' && !/^\d+$/.test(a))
    authors.forEach(author => {
      const tags = ['Ambigu']
      if (isMinority) tags.push('Minorité ethnique')
      authorsWithTags.push({ name: author, tags })
    })
  }

  return authorsWithTags
})

// Fonction pour vérifier si la critique est anonyme
const isAnonymousCritique = computed(() => {
  if (!modalItem.value || !headers.value.length) return false

  // Trouver l'index de la ligne originale dans mappedObjects
  const originalItem = modalItem.value._full || modalItem.value
  let originalIndex = mappedObjects.value.findIndex(item => item === originalItem)

  // Si pas trouvé par référence directe, chercher par contenu
  if (originalIndex === -1) {
    originalIndex = mappedObjects.value.findIndex(item => {
      return item.Titre === originalItem.Titre &&
        item.Année === originalItem.Année &&
        item.Magazine === originalItem.Magazine
    })
  }

  if (originalIndex === -1 || originalIndex >= rows.value.length) return false

  const row = rows.value[originalIndex]

  // Chercher la colonne CJ (Critiques anonymes)
  let anonymousIndex = headers.value.indexOf('CJ')
  if (anonymousIndex === -1) {
    anonymousIndex = headers.value.findIndex(h => {
      const normalized = String(h || '').trim()
      const lower = normalized.toLowerCase()
      return normalized === 'CJ' || lower === 'cj' || lower.includes('anonyme')
    })
  }

  if (anonymousIndex !== -1) {
    const value = row[anonymousIndex]
    if (value !== undefined && value !== null && value !== '') {
      const numValue = Number(value)
      const strValue = String(value).trim()
      return numValue === 1 || strValue === '1' || strValue.toLowerCase() === 'true'
    }
  }

  return false
})

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
  })
}
const filteredAndSorted = computed(() => {
  // Utiliser directement les objets complets de filteredByFilters
  let items = filteredByFilters.value

  // Appliquer la recherche textuelle
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    items = items.filter(it => Object.values(it).some(v => String(v ?? '').toLowerCase().includes(q)))
  }
  
  // Appliquer le tri
  if (sortKey.value) {
    items = items.slice().sort((a, b) => {
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
const pageSlice = computed(() => filteredAndSorted.value.slice((page.value - 1) * pageSize, page.value * pageSize))

// Mapping entre les noms de colonnes affichés et les propriétés des objets
const columnPropertyMap = {
  'Titre': 'Titre',
  'Type de Plateformes': 'TypePlateforme',
  'Année': 'Année',
  'Pays': 'Pays',
  'Genre LUDOV': 'Genre',
  'Auteurs': 'Auteurs',
  'Identité du pseudo': 'PseudonymeIdentity',
  'Développeur': 'Développeur',
  'Éditeur': 'Éditeur',
  'Magazine': 'Magazine'
}

// Fonction helper pour obtenir la valeur d'une cellule
function getCellValue(item, columnName) {
  const propertyName = columnPropertyMap[columnName] || columnName
  return item[propertyName]
}
const mapping = ref({
  TypeImageUtilise: '',
  TitreJeu: '',
  Plateforme: '',
  Modele: '',
  TypePlateforme: '',
  TypeJeu: '',
  Note: '',
  Année: '',
  Magazine: '',
  Auteurs: '',
  Pays: '',
  CritiqueTitre: '',
  PDF: '',
  NoteGenerale: '',
  NoteVisuelle: '',
  NoteSonore: '',
  NoteContenu: '',
  NoteJouabilite: '',
  NoteTempsJeu: '',
  NoteDifficulte: '',
  NotePrix: '',
  NoteAutre: '',
  Mois: '',
  Volume: '',
  Numéro: '',
  Page: '',
  NombrePages: '',
})

function initMapping() {
  const lower = (headers.value || []).map(h => String(h || '').toLowerCase())
  function find(labels) { const i = lower.findIndex(h => labels.some(l => h.includes(l))); return i >= 0 ? headers.value[i] : '' }
  // Fonction pour trouver une colonne avec un nom exact (sans préfixe/suffixe)
  function findExact(labels) {
    const i = lower.findIndex(h => {
      const trimmed = h.trim()
      return labels.some(l => trimmed === l)
    })
    return i >= 0 ? headers.value[i] : ''
  }
  mapping.value.TypeImageUtilise = find(["type d'images utilisés", "type d'image utilisé", "type image", "image type"])
  mapping.value.TitreJeu = find(['titre du jeu', 'game title', 'nom du jeu'])
  mapping.value.Plateforme = findExact(['plateforme', 'platform'])
  mapping.value.Modele = find(['modèle', 'modele', 'model'])
  mapping.value.TypePlateforme = find(['type de plateforme', 'platform type'])
  mapping.value.Genre = findExact(['genre'])  // Colonne EQ "Genre LUDOV"
  mapping.value.TypeJeu = find(['titre des étiquettes génériques de genre', 'type de jeu', 'game genre'])
  mapping.value.Note = find(['score', 'rating', 'note'])
  mapping.value.Année = find(['year', 'release year', 'annee', 'année', 'date'])
  mapping.value.Magazine = find(['magazine', 'revue', 'journal', 'publication'])
  mapping.value.Auteurs = find(['author', 'auteur', 'autrice', 'writer'])
  mapping.value.Pays = find(['country', 'pays', 'region'])
  mapping.value.CritiqueTitre = find(['titre de la critique', 'review title', 'article title', 'titre article'])
  mapping.value.PDF = find(['pdf', 'lien', 'link', 'url', 'document', 'fichier'])
  mapping.value.Consoles = find(['consoles', 'console', 'plateforme'])
  // Notations par critères (moyennes)
  mapping.value.NoteGenerale = find(['moyenne des critères généraux', 'criteres generaux', 'general score'])
  mapping.value.NoteVisuelle = find(['moyenne des critères visuels', 'criteres visuels', 'visual score'])
  mapping.value.NoteSonore = find(['moyenne des critères sonores', 'criteres sonores', 'sound score'])
  mapping.value.NoteContenu = find(['moyenne des critères de contenu', 'criteres de contenu', 'content score'])
  mapping.value.NoteJouabilite = find(['moyenne des critères de jouabilité', 'criteres de jouabilite', 'gameplay score'])
  mapping.value.NoteTempsJeu = find(['moyenne des critères sur le temps de jeu', 'criteres sur le temps de jeu', 'playtime score'])
  mapping.value.NoteDifficulte = find(['moyenne des critères sur la difficulté', 'criteres sur la difficulte', 'difficulty score'])
  mapping.value.NotePrix = find(['moyenne des critères sur le prix', 'criteres sur le prix', 'price score'])
  mapping.value.NoteAutre = find(['moyenne des autres critères', 'autres criteres', 'other score'])
  // Étiquettes de notation par critères
  mapping.value.EtiquetteGenerale = find(['étiquettes des critères généraux', 'etiquettes criteres generaux'])
  mapping.value.EtiquetteVisuelle = find(['étiquettes des critères visuels', 'etiquettes criteres visuels'])
  mapping.value.EtiquetteSonore = find(['étiquettes des critères sonores', 'etiquettes criteres sonores'])
  mapping.value.EtiquetteContenu = find(['étiquettes des critères de contenu', 'etiquettes criteres de contenu'])
  mapping.value.EtiquetteJouabilite = find(['étiquettes des critères de jouabilité', 'etiquettes criteres de jouabilite'])
  mapping.value.EtiquetteTempsJeu = find(['étiquettes des critères sur le temps de jeu', 'etiquettes criteres temps de jeu'])
  mapping.value.EtiquetteDifficulte = find(['étiquettes des critères sur la difficulté', 'etiquettes criteres difficulte'])
  mapping.value.EtiquettePrix = find(['étiquettes des critères sur le prix', 'etiquettes criteres prix'])
  mapping.value.EtiquetteAutre = find(['étiquettes des autres critères', 'etiquettes autres criteres'])
  // Colonnes pour les détails de publication
  // Chercher d'abord par nom exact (E, F, G, H, I) puis par labels
  const findExactLetter = (letter) => {
    const exactIdx = lower.findIndex(h => String(h || '').trim().toUpperCase() === letter.toUpperCase())
    return exactIdx >= 0 ? headers.value[exactIdx] : ''
  }
  mapping.value.Mois = findExactLetter('E') || find(['mois', 'month'])
  mapping.value.Volume = findExactLetter('F') || find(['volume'])
  mapping.value.Numéro = findExactLetter('G') || find(['numéro', 'numero', 'number', 'num'])
  mapping.value.Page = findExactLetter('H') || find(['page', 'pages'])
  mapping.value.NombrePages = findExactLetter('I') || find(['nombre de pages', 'nombre pages', 'nb pages', 'pages count'])
}

// Fonction pour traduire les étiquettes de notation de l'anglais vers le français
function translateRatingLabel(label) {
  if (!label || typeof label !== 'string') return null

  // Nettoyer l'étiquette: enlever espaces superflus, convertir en minuscules
  const cleanLabel = String(label).toLowerCase().trim()

  // Si vide ou juste des espaces
  if (!cleanLabel || cleanLabel === '-' || cleanLabel === 'n/a') return null

  const translations = {
    // Étiquettes positives
    'excellent': 'Excellent',
    'very good': 'Très bon',
    'good': 'Bon',
    'above average': 'Au-dessus de la moyenne',
    'average': 'Moyen',
    'below average': 'En-dessous de la moyenne',
    'poor': 'Faible',
    'very poor': 'Très faible',
    'bad': 'Mauvais',
    'very bad': 'Très mauvais',
    'terrible': 'Terrible',

    // Étiquettes spécifiques
    'outstanding': 'Exceptionnel',
    'great': 'Excellent',
    'decent': 'Correct',
    'mediocre': 'Médiocre',
    'awful': 'Affreux',

    // Étiquettes de difficulté
    'very easy': 'Très facile',
    'easy': 'Facile',
    'moderate': 'Modéré',
    'hard': 'Difficile',
    'very hard': 'Très difficile',

    // Étiquettes de prix
    'very cheap': 'Très bon marché',
    'cheap': 'Bon marché',
    'reasonable': 'Raisonnable',
    'expensive': 'Cher',
    'very expensive': 'Très cher',

    // Étiquettes de temps de jeu
    'very short': 'Très court',
    'short': 'Court',
    'medium': 'Moyen',
    'long': 'Long',
    'very long': 'Très long'
  }

  const translated = translations[cleanLabel]

  // Debug: afficher les étiquettes non traduites (seulement une fois par étiquette)
  if (!translated && !window._loggedLabels) window._loggedLabels = new Set()
  if (!translated && !window._loggedLabels.has(cleanLabel)) {
    console.log('Étiquette non traduite:', cleanLabel, '(original:', label, ')')
    window._loggedLabels.add(cleanLabel)
  }

  return translated || label // Retourner la traduction ou l'original si pas trouvé
}

const mappedObjects = computed(() => {
  if (!headers.value.length) return []
  const idx = Object.fromEntries(Object.entries(mapping.value).map(([k, v]) => [k, headers.value.indexOf(v)]))
  // Indices pour les colonnes d'auteurs spécifiques
  const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
  const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
  // Fonction helper pour trouver la colonne CY "Nom des auteurs.rices ambigus.ës"
  const findAmbiguousAuthorIndex = () => {
    // Chercher d'abord par le nom exact avec indexOf (plus fiable)
    let idx = headers.value.indexOf('Nom des auteurs.rices ambigus.ës')
    // Si pas trouvé, chercher par variantes
    if (idx === -1) {
      idx = headers.value.findIndex(h => {
        const normalized = String(h || '').trim()
        return normalized.toLowerCase().includes('auteurs.rices ambigus') ||
          normalized.toLowerCase().includes('auteurs.rices ambig')
      })
    }
    // Si toujours pas trouvé, chercher par autres variantes
    if (idx === -1) {
      idx = headers.value.findIndex(h => {
        const lower = String(h || '').toLowerCase()
        return (lower.includes('auteurs') && lower.includes('ambigu')) ||
          (lower.includes('auteur') && lower.includes('ambigu')) ||
          lower === 'cy' ||
          (lower.includes('auteur') && lower.includes('ambig'))
      })
    }
    return idx
  }
  const ambiguousAuthorIndex = findAmbiguousAuthorIndex()
 const mapped = rows.value.map(r => {
  // Déterminer le genre de l'auteur (pour le pie chart)
  let genreAuteur = '-'
  const hasMale = maleAuthorIndex !== -1 && r[maleAuthorIndex] && r[maleAuthorIndex] !== '0' && String(r[maleAuthorIndex]).trim() !== ''
  const hasFemale = femaleAuthorIndex !== -1 && r[femaleAuthorIndex] && r[femaleAuthorIndex] !== '0' && String(r[femaleAuthorIndex]).trim() !== ''
  const hasAmbiguous = ambiguousAuthorIndex !== -1 && r[ambiguousAuthorIndex] && r[ambiguousAuthorIndex] !== '0' && String(r[ambiguousAuthorIndex]).trim() !== ''
  
  const genreCount = [hasMale, hasFemale, hasAmbiguous].filter(Boolean).length
  
  if (genreCount === 0) {
    genreAuteur = 'Non spécifié'
  } else if (hasMale) {
    genreAuteur = 'Masculin'
  } else if (hasFemale) {
    genreAuteur = 'Féminin'
  } else if (hasAmbiguous) {
    genreAuteur = 'Ambigu'
  }
  
  // Combiner les noms d'auteurs masculins, féminins et ambigu
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
    // La colonne CY contient le pseudonyme de l'auteur quand il est ambigu
    if (ambiguousAuthorIndex !== -1 && r[ambiguousAuthorIndex] && r[ambiguousAuthorIndex] !== '0') {
      // Séparer les pseudonymes multiples s'ils sont dans la même cellule
      const pseudonymes = String(r[ambiguousAuthorIndex]).split(/[,;]+/).map(a => a.trim()).filter(a => a)
      authorNames.push(...pseudonymes)
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
    // Traiter l'année pou3r éviter NaN
    let annee = undefined
    if (idx.Année >= 0) {
      const yearValue = Number(String(r[idx.Année]).slice(0, 4))
      annee = !isNaN(yearValue) && yearValue > 0 ? yearValue : '-'
    }
    
    // Fonction helper pour formater le mois (ex: "1 (janvier)")
    const formatMois = (moisValue) => {
      if (!moisValue || moisValue === '' || moisValue === '0') return '-'
      const moisNum = Number(moisValue)
      if (isNaN(moisNum) || moisNum < 1 || moisNum > 12) return String(moisValue)
      const moisNoms = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      return `${moisNum} (${moisNoms[moisNum - 1]})`
    }
    
    // Fonction helper pour parser les notes (utilise la normalisation)
    const parseScore = (value) => {
      return normalizeScore(value)
    }
    const titreJeu = idx.TitreJeu >= 0 ? r[idx.TitreJeu] : undefined;
    const critiqueTitre = idx.CritiqueTitre >= 0 ? r[idx.CritiqueTitre] : undefined;
    // Utiliser la colonne Type d'images utilisés si présente
    let imageType = idx.TypeImageUtilise >= 0 ? r[idx.TypeImageUtilise] : undefined;

    // Formater les genres (garder le format français/anglais)
    // Utiliser directement l'index 146 pour la colonne EQ "Genre"
    const genreIndex = 146
    let genreDisplay = 'Non spécifié'

    if (r[genreIndex]) {
      const genreValue = r[genreIndex]
      if (genreValue && genreValue !== '0' && genreValue !== '') {
        const genreStr = String(genreValue).trim()
        // Séparer par " ; " pour les genres multiples, mais garder le format français/anglais
        const genres = genreStr.split(/\s*;\s*/).map(g => g.trim()).filter(g => g)
        genreDisplay = genres.length > 0 ? genres.join(', ') : 'Non spécifié'
      }
    }

    // Récupérer la colonne DC "identité du pseudo" si l'auteur est un pseudonyme
    const pseudonymeIdentityIndex = headers.value.findIndex(h => {
      const lower = String(h || '').toLowerCase()
      return (lower.includes('identité') && lower.includes('pseudo')) || lower === 'dc'
    })
    let pseudonymeIdentity = undefined
    if (pseudonymeIdentityIndex !== -1) {
      const pseudonymeIndex = headers.value.findIndex(h => {
        const lower = String(h || '').toLowerCase()
        return lower.includes('pseudonyme') || lower === 'db'
      })
      // Afficher seulement si c'est un pseudonyme (DB = 1 ou valeur non vide)
      if (pseudonymeIndex !== -1) {
        const isPseudonyme = r[pseudonymeIndex] && r[pseudonymeIndex] !== '' && r[pseudonymeIndex] !== '0' && Number(r[pseudonymeIndex]) === 1
        if (isPseudonyme && r[pseudonymeIdentityIndex]) {
          pseudonymeIdentity = r[pseudonymeIdentityIndex]
        }
      }
    }

    // Créer l'objet critique de base
    const critique = {
      Titre: titreJeu || critiqueTitre || '-',
      TitreJeu: titreJeu,
      Plateforme: idx.Plateforme >= 0 ? r[idx.Plateforme] : undefined,
      Modele: idx.Modele >= 0 ? r[idx.Modele] : undefined,
      TypePlateforme: idx.TypePlateforme >= 0 ? r[idx.TypePlateforme] : undefined,
      TypeJeu: idx.TypeJeu >= 0 ? r[idx.TypeJeu] : undefined,
      Genre: genreDisplay,
      Note: parseScore(idx.Note >= 0 ? r[idx.Note] : undefined),
      Année: annee,
      Magazine: idx.Magazine >= 0 ? r[idx.Magazine] : undefined,
      Auteurs: validAuthors.length > 0 ? validAuthors.join(', ') : '-', // Afficher "-" si pas d'auteurs
      GenreAuteur: genreAuteur,
      Pays: idx.Pays >= 0 ? r[idx.Pays] : undefined,
      CritiqueTitre: critiqueTitre,
      PDF: idx.PDF >= 0 ? r[idx.PDF] : undefined,
      Consoles: idx.Consoles >= 0 ? r[idx.Consoles] : '-',
      PseudonymeIdentity: pseudonymeIdentity, // Colonne DC "identité du pseudo"
      // Notations par critères (moyennes)
      NoteGenerale: parseScore(idx.NoteGenerale >= 0 ? r[idx.NoteGenerale] : undefined),
      NoteVisuelle: parseScore(idx.NoteVisuelle >= 0 ? r[idx.NoteVisuelle] : undefined),
      NoteSonore: parseScore(idx.NoteSonore >= 0 ? r[idx.NoteSonore] : undefined),
      NoteContenu: parseScore(idx.NoteContenu >= 0 ? r[idx.NoteContenu] : undefined),
      NoteJouabilite: parseScore(idx.NoteJouabilite >= 0 ? r[idx.NoteJouabilite] : undefined),
      NoteTempsJeu: parseScore(idx.NoteTempsJeu >= 0 ? r[idx.NoteTempsJeu] : undefined),
      NoteDifficulte: parseScore(idx.NoteDifficulte >= 0 ? r[idx.NoteDifficulte] : undefined),
      NotePrix: parseScore(idx.NotePrix >= 0 ? r[idx.NotePrix] : undefined),
      NoteAutre: parseScore(idx.NoteAutre >= 0 ? r[idx.NoteAutre] : undefined),
      // Étiquettes de notation par critères (traduites)
      EtiquetteGenerale: translateRatingLabel(idx.EtiquetteGenerale >= 0 ? r[idx.EtiquetteGenerale] : undefined),
      EtiquetteVisuelle: translateRatingLabel(idx.EtiquetteVisuelle >= 0 ? r[idx.EtiquetteVisuelle] : undefined),
      EtiquetteSonore: translateRatingLabel(idx.EtiquetteSonore >= 0 ? r[idx.EtiquetteSonore] : undefined),
      EtiquetteContenu: translateRatingLabel(idx.EtiquetteContenu >= 0 ? r[idx.EtiquetteContenu] : undefined),
      EtiquetteJouabilite: translateRatingLabel(idx.EtiquetteJouabilite >= 0 ? r[idx.EtiquetteJouabilite] : undefined),
      EtiquetteTempsJeu: translateRatingLabel(idx.EtiquetteTempsJeu >= 0 ? r[idx.EtiquetteTempsJeu] : undefined),
      EtiquetteDifficulte: translateRatingLabel(idx.EtiquetteDifficulte >= 0 ? r[idx.EtiquetteDifficulte] : undefined),
      EtiquettePrix: translateRatingLabel(idx.EtiquettePrix >= 0 ? r[idx.EtiquettePrix] : undefined),
      EtiquetteAutre: translateRatingLabel(idx.EtiquetteAutre >= 0 ? r[idx.EtiquetteAutre] : undefined),
      ImageType: imageType,
      // Détails de publication
      Mois: idx.Mois >= 0 ? formatMois(r[idx.Mois]) : undefined,
      Volume: idx.Volume >= 0 ? (r[idx.Volume] && r[idx.Volume] !== '' && r[idx.Volume] !== '0' ? String(r[idx.Volume]).trim() : '-') : '-',
      Numéro: idx.Numéro >= 0 ? (r[idx.Numéro] && r[idx.Numéro] !== '' && r[idx.Numéro] !== '0' ? String(r[idx.Numéro]).trim() : '-') : '-',
      Page: idx.Page >= 0 ? (r[idx.Page] && r[idx.Page] !== '' && r[idx.Page] !== '0' ? String(r[idx.Page]).trim() : '-') : '-',
      NombrePages: idx.NombrePages >= 0 ? (r[idx.NombrePages] && r[idx.NombrePages] !== '' && r[idx.NombrePages] !== '0' ? String(r[idx.NombrePages]).trim() : '-') : '-'
    }

    // Appliquer les corrections de données
    return applyDataCorrections(critique, r, headers.value)
  })
  return mapped
})
const sidebarFilters = ref({
  magazines: [],
  countries: [],
  platformTypes: [],
  platforms: [],
  gameTypes: [],
  imageTypes: [],
  authorGender: [],
  authorCharacteristics: [],
  authorName: '',
  showWithoutAuthors: false,
  yearRange: [1980, 2025],
  monthRange: [1, 12],
  scoreTypes: [],
  scoreRange: [0, 100],
  includeUnscored: true
})
const facets = computed(() => {
  const arr = mappedObjects.value
  const uniq = (vals) => Array.from(new Set(vals.filter(Boolean))).sort()
  // Récupérer les auteurs masculins, féminins et ambigu depuis les données brutes
  const authorsM = new Set()
  const authorsF = new Set()
  const authorsA = new Set() // Ambigu
  const authorsPseudonymes = new Set() // Pseudonymes
  const authorsMinorites = new Set() // Minorités ethniques
  const authorsMinoritesPseudonymes = new Set() // Pseudonymes des auteurs minorités ethniques
  if (headers.value.length > 0) {
    const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
    const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
    // Chercher la colonne CY "Nom des auteurs.rices ambigus.ës" (contient les pseudonymes des auteurs ambigu)
    // Chercher d'abord par le nom exact avec indexOf (plus fiable)
    let ambiguousAuthorIndex = headers.value.indexOf('Nom des auteurs.rices ambigus.ës')
    // Si pas trouvé, chercher par variantes
    if (ambiguousAuthorIndex === -1) {
      ambiguousAuthorIndex = headers.value.findIndex(h => {
        const normalized = String(h || '').trim()
        return normalized.toLowerCase().includes('auteurs.rices ambigus') ||
          normalized.toLowerCase().includes('auteurs.rices ambig')
      })
    }
    // Si toujours pas trouvé, chercher par autres variantes
    if (ambiguousAuthorIndex === -1) {
      ambiguousAuthorIndex = headers.value.findIndex(h => {
        const lower = String(h || '').toLowerCase()
        return (lower.includes('auteurs') && lower.includes('ambigu')) ||
          (lower.includes('auteur') && lower.includes('ambigu')) ||
          lower === 'cy' ||
          (lower.includes('auteur') && lower.includes('ambig'))
      })
    }
    // Chercher la colonne DB (Pseudonyme)
    const pseudonymeIndex = headers.value.findIndex(h => {
      const lower = String(h || '').toLowerCase()
      return lower.includes('pseudonyme') || lower === 'db'
    })
    // Chercher la colonne CP (Minorité ethnique)
    const minorityIndex = headers.value.findIndex(h => {
      const lower = String(h || '').toLowerCase()
      return lower.includes('minorité') || lower.includes('minorite') || lower === 'cp'
    })

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
    // Récupérer les pseudonymes des auteurs ambigu depuis la colonne CY
    // La colonne CY contient le pseudonyme de l'auteur quand il est ambigu
    if (ambiguousAuthorIndex !== -1) {
      rows.value.forEach(row => {
        const pseudonyme = row[ambiguousAuthorIndex]
        // Si la colonne n'est pas vide, c'est un auteur ambigu (le contenu est le pseudonyme)
        if (pseudonyme && pseudonyme !== '' && pseudonyme !== '0') {
          const pseudonymeStr = String(pseudonyme || '').trim()
          if (pseudonymeStr && pseudonymeStr !== '0' && !/^\d+$/.test(pseudonymeStr)) {
            // Séparer les pseudonymes multiples s'ils sont dans la même cellule
            const pseudonymes = pseudonymeStr.split(/[,;]+/).map(a => a.trim()).filter(a => {
              return a && a !== '0' && !/^\d+$/.test(a)
            })
            pseudonymes.forEach(p => authorsA.add(p))
          }
        }
      })
    }
    // Récupérer les pseudonymes (colonne DC "identité du pseudo")
    const pseudonymeIdentityIndex = headers.value.findIndex(h => {
      const lower = String(h || '').toLowerCase()
      return (lower.includes('identité') && lower.includes('pseudo')) || lower === 'dc'
    })
    if (pseudonymeIndex !== -1 && pseudonymeIdentityIndex !== -1) {
      rows.value.forEach((row, rowIndex) => {
        const isPseudonyme = row[pseudonymeIndex] && row[pseudonymeIndex] !== '' && row[pseudonymeIndex] !== '0' && Number(row[pseudonymeIndex]) === 1
        if (isPseudonyme && row[pseudonymeIdentityIndex]) {
          // Récupérer le pseudonyme depuis la colonne DC (format: "pseudonyme (vrai nom)")
          const pseudonymeIdentity = String(row[pseudonymeIdentityIndex] || '').trim()
          if (pseudonymeIdentity && pseudonymeIdentity !== '' && pseudonymeIdentity !== '0') {
            // Extraire le pseudonyme (partie avant la parenthèse) ou garder le format complet
            // Format attendu: "pseudonyme (vrai nom)"
            const match = pseudonymeIdentity.match(/^([^(]+)/)
            if (match) {
              const pseudonyme = match[1].trim()
              if (pseudonyme) {
                authorsPseudonymes.add(pseudonymeIdentity) // Garder le format complet pour l'affichage
              }
            } else {
              authorsPseudonymes.add(pseudonymeIdentity)
            }
          }
        }
      })
    }
    // Récupérer les auteurs minorités ethniques (colonne CP)
    if (minorityIndex !== -1) {
      rows.value.forEach((row, rowIndex) => {
        const isMinority = row[minorityIndex] && row[minorityIndex] !== '' && row[minorityIndex] !== '0'
        if (isMinority) {
          // Récupérer l'auteur de cette ligne (masculin, féminin, ou ambigu)
          if (maleAuthorIndex !== -1 && row[maleAuthorIndex] && row[maleAuthorIndex] !== '' && row[maleAuthorIndex] !== '0') {
            authorsMinorites.add(row[maleAuthorIndex])
          }
          if (femaleAuthorIndex !== -1 && row[femaleAuthorIndex] && row[femaleAuthorIndex] !== '' && row[femaleAuthorIndex] !== '0') {
            authorsMinorites.add(row[femaleAuthorIndex])
          }
          if (ambiguousAuthorIndex !== -1 && row[ambiguousAuthorIndex] && row[ambiguousAuthorIndex] !== '' && row[ambiguousAuthorIndex] !== '0') {
            authorsMinorites.add(row[ambiguousAuthorIndex])
          }
        }
      })
    }

    // Créer une liste combinée : pseudonymes des auteurs minorités ethniques
    if (pseudonymeIndex !== -1 && pseudonymeIdentityIndex !== -1 && minorityIndex !== -1) {
      rows.value.forEach((row, rowIndex) => {
        const isPseudonyme = row[pseudonymeIndex] && row[pseudonymeIndex] !== '' && row[pseudonymeIndex] !== '0' && Number(row[pseudonymeIndex]) === 1
        const isMinority = row[minorityIndex] && row[minorityIndex] !== '' && row[minorityIndex] !== '0'
        if (isPseudonyme && isMinority && row[pseudonymeIdentityIndex]) {
          const pseudonymeIdentity = String(row[pseudonymeIdentityIndex] || '').trim()
          if (pseudonymeIdentity && pseudonymeIdentity !== '' && pseudonymeIdentity !== '0') {
            authorsMinoritesPseudonymes.add(pseudonymeIdentity)
          }
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
          // Séparer les types multiples (séparés par " ; ")
          const typeList = String(type).split(/\s*;\s*/).map(t => t.trim()).filter(t => t)
          typeList.forEach(t => platformTypes.add(t))
        }
      })
    }
  }

  // Récupérer les plateformes (colonne EN) depuis les données brutes
  const platforms = new Set()
  if (headers.value.length > 0) {
    const platformIndex = headers.value.indexOf('Plateforme')
    if (platformIndex !== -1) {
      rows.value.forEach(row => {
        const platform = row[platformIndex]
        if (platform && platform !== '' && platform !== '0') {
          // Séparer les plateformes multiples (séparées par " ; ")
          const platformList = String(platform).split(/\s*;\s*/).map(p => p.trim()).filter(p => p)
          platformList.forEach(p => platforms.add(p))
        }
      })
    }
  }

  // Récupérer les genres depuis les données brutes (colonne EQ "Genre")
  const genres = new Set()
  let hasUnspecifiedGenres = false

  if (headers.value.length > 0) {
    const genreIndex = headers.value.indexOf('Genre')
    if (genreIndex !== -1) {
      rows.value.forEach(row => {
        const genreValue = row[genreIndex]
        if (genreValue && genreValue !== '' && genreValue !== '0') {
          // Utiliser extractGenres pour nettoyer et séparer les genres
          const cleanedGenres = extractGenres(genreValue)
          cleanedGenres.forEach(genre => genres.add(genre))
        } else {
          // Marquer qu'il y a des genres non spécifiés
          hasUnspecifiedGenres = true
        }
      })
    }
  }

  const genresArray = Array.from(genres).sort((a, b) => {
    return a.localeCompare(b, 'fr', { sensitivity: 'base' })
  })

  // Ajouter "Non spécifié" à la fin si des critiques n'ont pas de genre
  if (hasUnspecifiedGenres) {
    genresArray.push('Non spécifié')
  }

  // Trier les plateformes
  const sortedPlatforms = Array.from(platforms).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))

  // Filtrer les années valides (exclure "-" et les valeurs invalides)
  const validYears = arr
    .map(x => x.Année)
    .filter(y => y !== '-' && y !== undefined && typeof y === 'number' && !isNaN(y))

  return {
    platformTypes: Array.from(platformTypes).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })),
    platforms: sortedPlatforms,
    gameTypes: genresArray,  // Utilise les genres de la colonne EQ "Genre LUDOV"
    magazines: uniq(arr.map(x => x.Magazine)),
    countries: uniq(arr.map(x => x.Pays)),
    authors: {
      male: Array.from(authorsM).sort(),
      female: Array.from(authorsF).sort(),
      other: Array.from(authorsA).sort(),
      pseudonymes: Array.from(authorsPseudonymes).sort(),
      minorites: Array.from(authorsMinorites).sort(),
      minoritesPseudonymes: Array.from(authorsMinoritesPseudonymes).sort()
    },
    imageTypes: uniq(arr.map(x => x.ImageType)),
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
    // Filtre par année - seulement si l'année est valide
    const year = x.Année
    if (year !== '-' && year !== undefined && typeof year === 'number') {
      // Appliquer le filtre d'année seulement si l'année est un nombre valide
      if (year < f.yearRange[0] || year > f.yearRange[1]) return false
    }
    // Si pas d'année valide, on garde la critique (ne pas filtrer)
    
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
          if (platformType && platformType !== '' && platformType !== '0') {
            // Séparer les types multiples (séparés par " ; ")
            const typeList = String(platformType).split(/\s*;\s*/).map(t => t.trim()).filter(t => t)
            // Vérifier si au moins un des types correspond au filtre
            const hasMatch = typeList.some(t => f.platformTypes.includes(t))
            if (!hasMatch) return false
          } else {
            return false
          }
        }
      }
    }

    // Filtre par plateformes spécifiques (colonne Plateforme EN)
    if (f.platforms && f.platforms.length > 0) {
      if (headers.value.length > 0 && index < rows.value.length) {
        const platformIndex = headers.value.indexOf('Plateforme')
        if (platformIndex !== -1) {
          const platformValue = rows.value[index][platformIndex]
          if (platformValue && platformValue !== '' && platformValue !== '0') {
            // Séparer les plateformes multiples (séparées par " ; ")
            const platformList = String(platformValue).split(/\s*;\s*/).map(p => p.trim()).filter(p => p)
            // Vérifier si au moins une des plateformes sélectionnées est présente (logique OR)
            const hasSelectedPlatform = f.platforms.some(selectedPlatform =>
              platformList.includes(selectedPlatform)
            )
            if (!hasSelectedPlatform) return false
          } else {
            // Si pas de plateforme, ne pas inclure
            return false
          }
        }
      }
    }

    // Filtre par genres (colonne EQ "Genre LUDOV")
    if (f.gameTypes && f.gameTypes.length > 0) {
      if (headers.value.length > 0 && index < rows.value.length) {
        const genreIndex = headers.value.indexOf('Genre')
        if (genreIndex !== -1) {
          const genreValue = rows.value[index][genreIndex]

          // Gérer le cas "Non spécifié"
          if (f.gameTypes.includes('Non spécifié')) {
            if (!genreValue || genreValue === '' || genreValue === '0') {
              return true
            }
            if (f.gameTypes.length === 1) {
              return false
            }
          }

          if (!genreValue || genreValue === '' || genreValue === '0') {
            return false
          }

          // Extraire et nettoyer les genres de cette critique
          const cleanedGenres = extractGenres(genreValue)

          // Filtrer les genres sélectionnés (exclure "Non spécifié")
          const selectedGenres = f.gameTypes.filter(g => g !== 'Non spécifié')

          // Appliquer la logique ET ou OU
          if (f.gameTypesLogic === 'ET') {
            // Logique "ET" : tous les genres sélectionnés doivent être présents
            const hasAllGenres = selectedGenres.every(selectedGenre =>
              cleanedGenres.includes(selectedGenre)
            )
            if (!hasAllGenres) return false
          } else {
            // Logique "OU" (par défaut) : au moins un genre doit correspondre
            const hasSelectedGenre = selectedGenres.some(selectedGenre =>
              cleanedGenres.includes(selectedGenre)
            )
            if (!hasSelectedGenre) return false
          }
        } else {
          return false
        }
      }
    }

    // Filtre par types de notes (scoreTypes)
    if (f.scoreTypes && f.scoreTypes.length > 0) {
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
      }
    }

    // Filtre par magazines
    if (f.magazines && f.magazines.length > 0 && !f.magazines.includes(String(x.Magazine))) return false

    // Filtre par pays
    if (f.countries && f.countries.length > 0 && !f.countries.includes(String(x.Pays))) return false

    // Filtre par nom d'auteur ou pseudonyme (match exact insensible à la casse sur les tokens)
    if (f.authorName) {
      const normalize = (s) => String(s || '').toLowerCase().trim()
      const target = normalize(f.authorName)

      // Si "Sous pseudonyme" est sélectionné, chercher dans la colonne DC
      if (f.authorCharacteristics && f.authorCharacteristics.includes('pseudonyme')) {
        if (headers.value.length > 0 && index < rows.value.length) {
          const row = rows.value[index]
          const pseudonymeIdentityIndex = headers.value.findIndex(h => {
            const lower = String(h || '').toLowerCase()
            return (lower.includes('identité') && lower.includes('pseudo')) || lower === 'dc'
          })
          if (pseudonymeIdentityIndex !== -1 && row[pseudonymeIdentityIndex]) {
            const pseudonymeIdentity = normalize(row[pseudonymeIdentityIndex])
            // Vérifier si le pseudonyme sélectionné correspond (match exact ou partiel)
            if (pseudonymeIdentity.includes(target) || target.includes(pseudonymeIdentity)) {
              return true
            }
          }
          return false
        }
      } else {
        // Filtre normal par nom d'auteur
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
          // Chercher la colonne CY "Nom des auteurs.rices ambigus.ës" (contient les pseudonymes)
          const findAmbiguousAuthorIndex = () => {
            // Chercher d'abord par le nom exact avec indexOf (plus fiable)
            let idx = headers.value.indexOf('Nom des auteurs.rices ambigus.ës')
            // Si pas trouvé, chercher par variantes
            if (idx === -1) {
              idx = headers.value.findIndex(h => {
                const normalized = String(h || '').trim()
                return normalized.toLowerCase().includes('auteurs.rices ambigus') ||
                  normalized.toLowerCase().includes('auteurs.rices ambig')
              })
            }
            // Si toujours pas trouvé, chercher par autres variantes
            if (idx === -1) {
              idx = headers.value.findIndex(h => {
                const lower = String(h || '').toLowerCase()
                return (lower.includes('auteurs') && lower.includes('ambigu')) ||
                  (lower.includes('auteur') && lower.includes('ambigu')) ||
                  lower === 'cy' ||
                  (lower.includes('auteur') && lower.includes('ambig'))
              })
            }
            return idx
          }
          const ambiguousAuthorIndex = findAmbiguousAuthorIndex()
          if (maleAuthorIndex !== -1) pushTokens(row[maleAuthorIndex])
          if (femaleAuthorIndex !== -1) pushTokens(row[femaleAuthorIndex])
          // La colonne CY contient les pseudonymes des auteurs ambigu
          if (ambiguousAuthorIndex !== -1 && row[ambiguousAuthorIndex] && row[ambiguousAuthorIndex] !== '' && row[ambiguousAuthorIndex] !== '0') {
            pushTokens(row[ambiguousAuthorIndex])
          }
        }
        if (!Array.from(tokens).includes(target)) return false
      }
    }

    // Filtre par genre d'auteur (sélection multiple)
    if (Array.isArray(f.authorGender) && f.authorGender.length > 0 && headers.value.length > 0) {
      const maleAuthorIndex = headers.value.indexOf('Nom des auteurs masculins')
      const femaleAuthorIndex = headers.value.indexOf('Nom des autrices féminin')
      // Chercher la colonne CY "Nom des auteurs.rices ambigus.ës"
      const findAmbiguousAuthorIndex = () => {
        // Chercher d'abord par le nom exact avec indexOf (plus fiable)
        let idx = headers.value.indexOf('Nom des auteurs.rices ambigus.ës')
        // Si pas trouvé, chercher par variantes
        if (idx === -1) {
          idx = headers.value.findIndex(h => {
            const normalized = String(h || '').trim()
            return normalized.toLowerCase().includes('auteurs.rices ambigus') ||
              normalized.toLowerCase().includes('auteurs.rices ambig')
          })
        }
        // Si toujours pas trouvé, chercher par autres variantes
        if (idx === -1) {
          idx = headers.value.findIndex(h => {
            const lower = String(h || '').toLowerCase()
            return (lower.includes('auteurs') && lower.includes('ambigu')) ||
              (lower.includes('auteur') && lower.includes('ambigu')) ||
              lower === 'cy' ||
              (lower.includes('auteur') && lower.includes('ambig'))
          })
        }
        return idx
      }
      const ambiguousAuthorIndex = findAmbiguousAuthorIndex()
      const originalRowIndex = index
      if (originalRowIndex < rows.value.length) {
        const row = rows.value[originalRowIndex]
        let matchesGender = false

        // Vérifier selon les genres sélectionnés (logique OR)
        const hasMale = maleAuthorIndex !== -1 && row[maleAuthorIndex] && row[maleAuthorIndex] !== '' && row[maleAuthorIndex] !== '0'
        const hasFemale = femaleAuthorIndex !== -1 && row[femaleAuthorIndex] && row[femaleAuthorIndex] !== '' && row[femaleAuthorIndex] !== '0'
        const hasAmbiguous = ambiguousAuthorIndex !== -1 && row[ambiguousAuthorIndex] && row[ambiguousAuthorIndex] !== '' && row[ambiguousAuthorIndex] !== '0'

        if (hasMale && f.authorGender.includes('masculin')) matchesGender = true
        if (hasFemale && f.authorGender.includes('féminin')) matchesGender = true
        if (hasAmbiguous && f.authorGender.includes('ambigu')) matchesGender = true

        if (!matchesGender) return false
      }
    }

    // Filtre par caractéristiques d'auteur (logique OR)
    if (f.authorCharacteristics && f.authorCharacteristics.length > 0 && headers.value.length > 0) {
      const originalRowIndex = index
      if (originalRowIndex < rows.value.length) {
        const row = rows.value[originalRowIndex]
        let matchesCharacteristic = false

        // Critiques anonymes (CJ = 1)
        if (f.authorCharacteristics.includes('anonyme')) {
          // Chercher d'abord par le code CJ exact, puis par nom
          let anonymousIndex = headers.value.indexOf('CJ')
          if (anonymousIndex === -1) {
            anonymousIndex = headers.value.findIndex(h => {
              const normalized = String(h || '').trim()
              const lower = normalized.toLowerCase()
              return normalized === 'CJ' || lower === 'cj' || lower.includes('anonyme')
            })
          }
          if (anonymousIndex !== -1) {
            const value = row[anonymousIndex]
            // Vérifier si la valeur est 1 (peut être nombre ou chaîne "1")
            if (value !== undefined && value !== null && value !== '') {
              const numValue = Number(value)
              const strValue = String(value).trim()
              const isAnonymous = numValue === 1 || strValue === '1' || strValue.toLowerCase() === 'true'
              if (isAnonymous) {
                matchesCharacteristic = true
              }
            }
          }
        }

        // Minorité ethnique (CP)
        if (!matchesCharacteristic && f.authorCharacteristics.includes('minorite')) {
          const minorityIndex = headers.value.findIndex(h => {
            const lower = String(h || '').toLowerCase()
            return lower.includes('minorité') || lower.includes('minorite') || lower === 'cp'
          })
          if (minorityIndex !== -1) {
            const isMinority = row[minorityIndex] && row[minorityIndex] !== '' && row[minorityIndex] !== '0'
            if (isMinority) {
              matchesCharacteristic = true
            }
          }
        }

        // Sous pseudonyme (DB)
        if (!matchesCharacteristic && f.authorCharacteristics.includes('pseudonyme')) {
          const pseudonymeIndex = headers.value.findIndex(h => {
            const lower = String(h || '').toLowerCase()
            return lower.includes('pseudonyme') || lower === 'db'
          })
          if (pseudonymeIndex !== -1) {
            const isPseudonyme = row[pseudonymeIndex] && row[pseudonymeIndex] !== '' && row[pseudonymeIndex] !== '0'
            if (isPseudonyme) {
              matchesCharacteristic = true
            }
          }
        }

        if (!matchesCharacteristic) return false
      }
    }

    // Filtre pour afficher seulement les critiques sans auteurs
    if (f.showWithoutAuthors) {
      // Une critique sans auteurs a Auteurs === '-'
      if (x.Auteurs !== '-') return false
    }

    // Filtre par type d'image
    if (f.imageTypes && f.imageTypes.length > 0) {
      if (!f.imageTypes.includes(x.ImageType)) return false
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
  const result = arr.map(item => {
    return keys.map(key => {
      // Mapper les clés d'affichage vers les propriétés de l'objet
      switch (key) {
        case 'Titre': return item.Titre
        case 'Type de Plateformes': return item.TypePlateforme
        case 'Plateforme': return item.Plateforme
        case 'Note': return item.Note
        case 'Année': return item.Année
        case 'Pays': return item.Pays
        case 'Genre LUDOV': return item.Genre
        case 'Auteurs': return item.Auteurs
        case 'Identité du pseudo': return item.PseudonymeIdentity || '' // Afficher seulement si présent
        case 'Développeur': return item.Développeur
        case 'Éditeur': return item.Éditeur
        case 'Magazine': return item.Magazine
        default: return item[key] || ''
      }
    })
  })

  return result
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
    { key: 'title', labels: ['title', 'game', 'name', 'titre', 'jeu'], display: 'Titre' },
    { key: 'platformType', labels: ['type de plateforme', 'platform type'], display: 'Type de Plateformes' },
    // Retirer Plateforme et Note de l'affichage principal
    { key: 'year', labels: ['year', 'release year', 'annee', 'année', 'date'], display: 'Année' },
    { key: 'country', labels: ['country', 'pays', 'region'], display: 'Pays' },
    { key: 'genre', labels: ['genre'], display: 'Genre LUDOV', forceIndex: 146 }, // Forcer l'index 146 pour la colonne EQ
    { key: 'author', labels: ['author', 'auteur', 'autrice', 'writer'], display: 'Auteurs' },
    { key: 'pseudonymeIdentity', labels: ['identité du pseudo', 'identite du pseudo', 'dc'], display: 'Identité du pseudo' },
    { key: 'developer', labels: ['developer', 'dev', 'studio'], display: 'Développeur' },
    { key: 'publisher', labels: ['publisher', 'éditeur', 'editeur'], display: 'Éditeur' },
    { key: 'magazine', labels: ['magazine', 'revue', 'journal', 'publication'], display: 'Magazine' },
  ]
  const selected = []
  for (const w of want) {
    // Si forceIndex est défini, utiliser cet index directement
    const idx = w.forceIndex !== undefined ? w.forceIndex : lower.findIndex(h => w.labels.some(l => h.includes(l)))
    if (idx !== -1) {
      selected.push({ key: w.key, index: idx, label: w.display })
    }
  }
  return selected
}

</script>

<template>
  <div class="page-layout">
    <!-- Sidebar des filtres -->
    <FiltersSidebar :facets="facets" :active-filters="sidebarFilters" @update:filters="updateFilters" />
    <!-- Contenu principal -->
    <div class="main-content">
      <div class="container">
        <header class="page-head">
          <div>
            <h1>Toutes les critiques</h1>
          </div>
        </header>
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <div class="loading-text">Chargement des critiques …</div>
        </div>
        <div v-else-if="error" class="error">Erreur: {{ error }}</div>
        <template v-else>
          <div style="max-width:1080px;margin:0 auto;">
            <ChartsGraphique :items="filteredAndSorted" :filtre-actifs="sidebarFilters" />
          </div>
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
          <!-- Message quand aucun résultat -->
          <div v-if="filteredAndSorted.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3 class="no-results-title">Aucune donnée correspondante à votre recherche</h3>
            <p class="no-results-text">
              Essayez de modifier vos filtres ou votre recherche pour obtenir des résultats.
            </p>
          </div>

          <!-- Tableau des résultats -->
          <div class="table-wrap" v-else-if="filteredHeaders.length">
            <table class="data">
              <thead>
                <tr>
                  <th v-for="h in filteredHeaders" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in pageSlice" :key="i" class="clickable-row" @click="openModal(it._full || it)">
                  <td v-for="h in filteredHeaders" :key="h">{{ getCellValue(it, h) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="pager">
              <button class="btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">Précédent</button>
              <span class="page-info">Page {{ page }} / {{ totalPages }}</span>
              <button class="btn" :disabled="page >= totalPages"
                @click="page = Math.min(totalPages, page + 1)">Suivant</button>
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
                <!-- Section: Informations générales -->
                <div class="modal-section">
                  <h4 class="section-title">Informations générales</h4>
                  <div class="modal-grid">
                    <div class="modal-field">
                      <div class="label">Titre de la critique</div>
                      <div class="value">{{ modalItem?.Titre || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Titre du jeu</div>
                      <div class="value">{{ modalItem?.TitreJeu || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Revue</div>
                      <div class="value">{{ modalItem?.Magazine || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Année</div>
                      <div class="value">{{ modalItem?.Année || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Mois</div>
                      <div class="value">{{ modalItem?.Mois || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Volume</div>
                      <div class="value">{{ modalItem?.Volume || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Numéro</div>
                      <div class="value">{{ modalItem?.Numéro || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Page</div>
                      <div class="value">{{ modalItem?.Page || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Nombre de pages</div>
                      <div class="value">{{ modalItem?.NombrePages || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Pays</div>
                      <div class="value">{{ modalItem?.Pays || '-' }}</div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Genre LUDOV</div>
                      <div class="value">{{ modalItem?.Genre || '-' }}</div>
                    </div>
                    <div class="modal-field modal-field-full">
                      <div class="label">Auteurs</div>
                      <div class="value authors-with-tags">
                        <template v-if="isAnonymousCritique">
                          <span class="author-tag author-tag-anonymous">Critique anonyme</span>
                        </template>
                        <template v-else-if="formattedAuthorsWithTags.length > 0">
                          <div v-for="(author, idx) in formattedAuthorsWithTags" :key="idx" class="author-item">
                            <span class="author-name">{{ author.name }}</span>
                            <span class="author-tags">
                              <span v-for="(tag, tagIdx) in author.tags" :key="tag"
                                :class="['author-tag', tagIdx === 0 ? 'author-tag-gender' : 'author-tag-minority']">
                                {{ tag }}
                              </span>
                            </span>
                          </div>
                        </template>
                        <span v-else>{{ modalItem?.Auteurs || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Section: Plateformes -->
                <div class="modal-section">
                  <h4 class="section-title">Plateformes</h4>
                  <div class="modal-grid modal-grid-3">
                    <div class="modal-field">
                      <div class="label">Type de plateforme</div>
                      <div class="value">
                        <template v-if="modalItem?.TypePlateforme && modalItem.TypePlateforme.includes(' ; ')">
                          <div v-for="(item, idx) in modalItem.TypePlateforme.split(' ; ')" :key="idx"
                            class="list-item">
                            - {{ item.trim() }}
                          </div>
                        </template>
                        <template v-else>
                          {{ modalItem?.TypePlateforme || '-' }}
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Plateforme spécifique</div>
                      <div class="value">
                        <template v-if="modalItem?.Plateforme && modalItem.Plateforme.includes(' ; ')">
                          <div v-for="(item, idx) in modalItem.Plateforme.split(' ; ')" :key="idx" class="list-item">
                            - {{ item.trim() }}
                          </div>
                        </template>
                        <template v-else>
                          {{ modalItem?.Plateforme || '-' }}
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Modèle</div>
                      <div class="value">
                        <template v-if="modalItem?.Modele && modalItem.Modele.includes(' ; ')">
                          <div v-for="(item, idx) in modalItem.Modele.split(' ; ')" :key="idx" class="list-item">
                            - {{ item.trim() }}
                          </div>
                        </template>
                        <template v-else>
                          {{ modalItem?.Modele || '-' }}
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Section: Notations -->
                <div class="modal-section">
                  <h4 class="section-title">Notations</h4>
                  <div class="modal-grid">
                    <div class="modal-field modal-field-full">
                      <div class="label">Note générale</div>
                      <div class="value score-value">
                        <template v-if="modalItem?.Note !== undefined && modalItem?.Note !== null && modalItem?.Note !== '-'">
                          <span class="score-number">{{ modalItem.Note }}</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères généraux</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteGenerale !== undefined && modalItem?.NoteGenerale !== null && modalItem?.NoteGenerale !== '-'">
                          <span class="score-number">{{ modalItem.NoteGenerale }}</span>
                          <span v-if="modalItem?.EtiquetteGenerale" class="score-label">{{ modalItem.EtiquetteGenerale }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères visuels</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteVisuelle !== undefined && modalItem?.NoteVisuelle !== null && modalItem?.NoteVisuelle !== '-'">
                          <span class="score-number">{{ modalItem.NoteVisuelle }}</span>
                          <span v-if="modalItem?.EtiquetteVisuelle" class="score-label">{{ modalItem.EtiquetteVisuelle }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères sonores</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteSonore !== undefined && modalItem?.NoteSonore !== null && modalItem?.NoteSonore !== '-'">
                          <span class="score-number">{{ modalItem.NoteSonore }}</span>
                          <span v-if="modalItem?.EtiquetteSonore" class="score-label">{{ modalItem.EtiquetteSonore }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères de contenu</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteContenu !== undefined && modalItem?.NoteContenu !== null && modalItem?.NoteContenu !== '-'">
                          <span class="score-number">{{ modalItem.NoteContenu }}</span>
                          <span v-if="modalItem?.EtiquetteContenu" class="score-label">{{ modalItem.EtiquetteContenu }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères de jouabilité</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteJouabilite !== undefined && modalItem?.NoteJouabilite !== null && modalItem?.NoteJouabilite !== '-'">
                          <span class="score-number">{{ modalItem.NoteJouabilite }}</span>
                          <span v-if="modalItem?.EtiquetteJouabilite" class="score-label">{{ modalItem.EtiquetteJouabilite }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères sur le temps de jeu</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteTempsJeu !== undefined && modalItem?.NoteTempsJeu !== null && modalItem?.NoteTempsJeu !== '-'">
                          <span class="score-number">{{ modalItem.NoteTempsJeu }}</span>
                          <span v-if="modalItem?.EtiquetteTempsJeu" class="score-label">{{ modalItem.EtiquetteTempsJeu }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères sur la difficulté</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteDifficulte !== undefined && modalItem?.NoteDifficulte !== null && modalItem?.NoteDifficulte !== '-'">
                          <span class="score-number">{{ modalItem.NoteDifficulte }}</span>
                          <span v-if="modalItem?.EtiquetteDifficulte" class="score-label">{{ modalItem.EtiquetteDifficulte }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Critères sur le prix</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NotePrix !== undefined && modalItem?.NotePrix !== null && modalItem?.NotePrix !== '-'">
                          <span class="score-number">{{ modalItem.NotePrix }}</span>
                          <span v-if="modalItem?.EtiquettePrix" class="score-label">{{ modalItem.EtiquettePrix }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                    <div class="modal-field">
                      <div class="label">Autres critères</div>
                      <div class="value score-value score-with-label">
                        <template v-if="modalItem?.NoteAutre !== undefined && modalItem?.NoteAutre !== null && modalItem?.NoteAutre !== '-'">
                          <span class="score-number">{{ modalItem.NoteAutre }}</span>
                          <span v-if="modalItem?.EtiquetteAutre" class="score-label">{{ modalItem.EtiquetteAutre }}</span>
                          <span v-else class="score-label-missing">Aucune étiquette</span>
                        </template>
                        <template v-else>
                          <span class="score-not-available">Non notée</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <!-- Section: Type d'image -->
                  <div class="modal-section">
                    <h4 class="section-title">Type d'image utilisé</h4>
                    <div class="modal-grid">
                      <div class="modal-field">
                        <div class="label">Type d'image</div>
                        <div class="value">{{ modalItem?.ImageType || '-' }}</div>
                      </div>
                    </div>
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
  .container {
    max-width: 820px;
    margin: 0 auto;
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
    max-width: 100%;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th,
  td {
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
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
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

  /* Message aucun résultat */
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    margin: 24px 0;
  }

  .no-results-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .no-results-title {
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 20px;
    font-weight: 600;
  }

  .no-results-text {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
    max-width: 400px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
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
    max-height: 70vh;
    overflow-y: auto;
  }

  .modal-section {
    margin-bottom: 24px;
  }

  .modal-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
  }

  .modal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .modal-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .modal-field {
    min-width: 0;
  }

  .modal-field-full {
    grid-column: 1 / -1;
  }

  /* PDF styles removed in simple modal */
  .modal-field .label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .modal-field .value {
    font-size: 14px;
    color: #111827;
    word-wrap: break-word;
  }

  .modal-field .value .list-item {
    line-height: 1.6;
    margin: 2px 0;
  }

  /* Styles pour les notes/scores */
  .score-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .score-with-label {
    flex-wrap: wrap;
  }

  .score-number {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 6px;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  }

  .score-label {
    display: inline-block;
    padding: 4px 10px;
    background: #eff6ff;
    color: #1e40af;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid #bfdbfe;
  }

  .score-label-missing {
    display: inline-block;
    padding: 4px 10px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 6px;
    font-size: 12px;
    font-style: italic;
    border: 1px solid #fde68a;
  }

  .score-not-available {
    display: inline-block;
    padding: 4px 12px;
    background: #f3f4f6;
    color: #9ca3af;
    border-radius: 6px;
    font-size: 13px;
    font-style: italic;
    border: 1px dashed #d1d5db;
  }

  /* Styles pour les tags d'auteurs */
  .authors-with-tags {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .author-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .author-name {
    font-weight: 500;
    color: #111827;
  }

  .author-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .author-tag {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
  }

  .author-tag-gender {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .author-tag-minority {
    background-color: #fef3c7;
    color: #92400e;
  }

  .author-tag-anonymous {
    background-color: #fee2e2;
    color: #991b1b;
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
}
</style>