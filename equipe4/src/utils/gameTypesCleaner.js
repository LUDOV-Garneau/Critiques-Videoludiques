/**
 * Utilitaire pour nettoyer et analyser les types de jeux
 * Permet de voir les problèmes dans les données et les corrections appliquées
 */

/**
 * Fonction pour nettoyer les types de jeux (enlever coquilles, guillemets, espaces, etc.)
 */
export function cleanGameType(type) {
  if (!type || typeof type !== 'string') return ''

  let cleaned = type
    // Trim les espaces de début/fin d'abord
    .trim()
    // Enlever TOUS les guillemets (pas seulement début/fin)
    .replace(/["'`«»„""''‚']/g, '')
    // Enlever les points d'interrogation et autres caractères problématiques (INCLUS LE POINT)
    .replace(/[?!@#$%^&*()+=\[\]{}|\\:;<>.]/g, '')
    // Enlever les caractères de contrôle et invisibles
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    // Enlever les espaces multiples et normaliser
    .replace(/\s+/g, ' ')
    // Trim à nouveau après nettoyage
    .trim()

  // Si le résultat est vide ou trop court, retourner vide
  if (!cleaned || cleaned.length <= 1) return ''

  // Corrections spécifiques pour les types de jeux mal formatés
  cleaned = applyGameTypeCorrections(cleaned)

  // Capitaliser la première lettre de chaque mot pour normaliser
  return cleaned
    .split(' ')
    .map(word => {
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .filter(word => word.length > 0) // Enlever les mots vides
    .join(' ')
}

/**
 * Applique des corrections spécifiques pour les types de jeux mal formatés
 */
function applyGameTypeCorrections(text) {
  // Correction pour "A" suivi spécifiquement des lettres "ction" (avec ou sans espaces)
  // Exemples: "A C Tion", "A Ction", "ACtion", "A c t i o n", etc.
  const actionPattern = /^A\s*[Cc]\s*[Tt]\s*[Ii]\s*[Oo]\s*[Nn](\s|$)/i
  if (actionPattern.test(text)) {
    return 'Action'
  }

  const corrections = {
    'A C Tion': 'Action',
    'A Ction': 'Action',
    'ACtion': 'Action',
    'A Role Playing': 'Role Playing',
    'R P G': 'RPG',
    'F P S': 'FPS',
    'R T S': 'RTS',
    'M M O': 'MMO',
    'M M O R P G': 'MMORPG',
    'Rpg': 'RPG',
    'Fps': 'FPS',
    'Rts': 'RTS',
    'Mmo': 'MMO',
    'Mmorpg': 'MMORPG'
  }
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (text.toLowerCase() === wrong.toLowerCase()) {
      return correct
    }
  }

  return text
}

/**
 * Valide si un type de jeu nettoyé est acceptable
 */
export function isValidGameType(type) {
  if (!type || typeof type !== 'string') return false
  if (type.length <= 1) return false
  if (/^\d+$/.test(type)) return false // Pas de chiffres seuls
  if (/^[0-9\s\-_]+$/.test(type)) return false // Pas de chiffres/espaces/tirets seuls

  // Vérifier qu'il contient au moins une lettre
  if (!/[a-zA-ZÀ-ÿ]/.test(type)) return false

  // Seulement lettres, espaces, tirets, apostrophes, et quelques caractères spéciaux autorisés
  if (!/^[a-zA-ZÀ-ÿ\s\-'&.]+$/.test(type)) return false

  // Rejeter les types trop génériques ou problématiques
  const invalidTypes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_', ' ', 'X', 'Xx', 'Xxx']
  if (invalidTypes.includes(type.trim())) return false

  return true
}

/**
 * Traite une chaîne de types de jeux multiples
 */
export function processGameTypes(gameTypeString) {
  if (!gameTypeString || gameTypeString === '' || gameTypeString === '0') {
    return []
  }

  return String(gameTypeString)
    .split(/[\/,;]+/)
    .map(t => cleanGameType(t))
    .filter(t => isValidGameType(t))
}

