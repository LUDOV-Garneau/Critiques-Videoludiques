/**
 * Utilitaire pour nettoyer et normaliser les genres de jeux
 * Basé sur la colonne EQ "Genre LUDOV" du fichier Excel
 */

/**
 * Mapping des variantes vers le genre normalisé
 */
const genreNormalizationMap = {
  // Stratégie
  'Stratégie en temps-réel': 'Stratégie en temps réel',
  'Stratégie en temps réel/RTS': 'Stratégie en temps réel',
  
  // Tir
  'Tir (first person shooter)': 'Tir (first-person shooter)',
  'Tir/Shooter': 'Tir',
  
  // Combat
  'Combat/Fighting': 'Combat',
  
  // Compilation
  'compilation': 'Compilation, adaptation et mini-jeux',
  
  // Aventure
  'Aventure graphique/Point and click': 'Aventure graphique',
  'Aventure graphique': 'Aventure graphique',
  
  // Course
  'Course/Racing': 'Course',
  
  // Jeu de rôle
  'Jeu de rôle/RPG': 'Jeu de rôle',
  
  // Pilotage
  'Pilotage/Flight': 'Pilotage',
  
  // Réflexion
  'Réflexion/Puzzle': 'Réflexion',
  
  // Expansion
  'Expansion/Add-on': 'Expansion',
  
  // Furtivité
  'Furtivité/Stealth': 'Furtivité',
  
  // Guerre
  'Guerre/War': 'Guerre'
}

/**
 * Nettoie et normalise un genre
 * @param {string} genre - Le genre brut
 * @returns {string} - Le genre nettoyé et normalisé
 */
export function cleanGenre(genre) {
  if (!genre || typeof genre !== 'string') return ''
  
  // Trim et supprimer les espaces multiples
  let cleaned = genre.trim().replace(/\s+/g, ' ')
  
  // Séparer par "/" et prendre la partie française (avant le /)
  const parts = cleaned.split('/')
  cleaned = parts[0].trim()
  
  // Appliquer la normalisation si une variante existe
  if (genreNormalizationMap[cleaned]) {
    cleaned = genreNormalizationMap[cleaned]
  }
  
  return cleaned
}

/**
 * Extrait et nettoie tous les genres d'une valeur de cellule
 * @param {string} value - La valeur brute de la cellule (peut contenir plusieurs genres séparés par ";")
 * @returns {string[]} - Liste des genres nettoyés et normalisés
 */
export function extractGenres(value) {
  if (!value || value === '' || value === '0') return []
  
  // Séparer par " ; " pour les genres multiples
  const genresList = String(value).split(/\s*;\s*/).map(g => g.trim()).filter(g => g)
  
  // Nettoyer chaque genre
  return genresList.map(cleanGenre).filter(g => g !== '')
}

/**
 * Liste complète des genres normalisés (pour les filtres)
 * Basée sur l'analyse de la colonne EQ
 */
export const NORMALIZED_GENRES = [
  '2D',
  '3D',
  'Action',
  'Action (beat them all)',
  'Action-Aventure',
  'Action-RPG',
  'Arcade',
  'Aventure',
  'Aventure graphique',
  'Aventure texte',
  'Combat',
  'Combat ("Baston")',
  'Compilation, adaptation et mini-jeux',
  'Course',
  'Éducatif',
  'Expansion',
  'Furtivité',
  'Guerre',
  'Hasard',
  'Horreur',
  'Indéfini',
  'Jeu de rôle',
  'Pilotage',
  'Plateformes',
  'Réflexion',
  'Simulation',
  'Simulation (construction)',
  'Sports',
  'Stratégie',
  'Stratégie en temps réel',
  'Tactique',
  'Tir',
  'Tir (first-person shooter)',
  'Tir (shoot them up)',
  'Utilitaire'
]

