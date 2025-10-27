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

  // Autres corrections possibles
  const corrections = {
    // Corrections pour des mots mal espacés
    'A C Tion': 'Action',
    'A Ction': 'Action',
    'ACtion': 'Action',
    'A Role Playing': 'Role Playing',
    'R P G': 'RPG',
    'F P S': 'FPS',
    'R T S': 'RTS',
    'M M O': 'MMO',
    'M M O R P G': 'MMORPG',
    // Corrections pour les acronymes mal espacés
    'Rpg': 'RPG',
    'Fps': 'FPS',
    'Rts': 'RTS',
    'Mmo': 'MMO',
    'Mmorpg': 'MMORPG'
  }

  // Appliquer les corrections exactes
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

/**
 * Analyse les types de jeux dans un dataset pour identifier les problèmes
 */
export function analyzeGameTypes(rows, headers) {
  const gameTypeIndex = headers.indexOf('Titre des étiquettes génériques de genre')
  if (gameTypeIndex === -1) {
    return {
      error: 'Colonne "Titre des étiquettes génériques de genre" non trouvée',
      stats: null
    }
  }

  const analysis = {
    total: 0,
    empty: 0,
    withProblems: 0,
    cleaned: 0,
    problems: [],
    beforeAfter: [],
    uniqueTypes: new Set(),
    uniqueTypesClean: new Set()
  }

  rows.forEach((row, index) => {
    const gameType = row[gameTypeIndex]
    analysis.total++

    if (!gameType || gameType === '' || gameType === '0') {
      analysis.empty++
      return
    }

    const original = String(gameType)
    const processed = processGameTypes(original)

    // Détecter les problèmes
    const hasQuotes = /["'`«»„""''‚']/.test(original)
    const hasMultipleSpaces = /\s{2,}/.test(original)
    const hasControlChars = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/.test(original)
    const hasProblems = hasQuotes || hasMultipleSpaces || hasControlChars

    if (hasProblems) {
      analysis.withProblems++
      analysis.problems.push({
        index,
        original,
        processed,
        issues: {
          quotes: hasQuotes,
          multipleSpaces: hasMultipleSpaces,
          controlChars: hasControlChars
        }
      })
    }

    if (processed.length > 0) {
      analysis.cleaned++
      analysis.beforeAfter.push({
        original,
        cleaned: processed.join(', ')
      })
    }

    // Ajouter aux sets pour compter les uniques
    original.split(/[\/,;]+/).forEach(t => {
      const trimmed = t.trim()
      if (trimmed) analysis.uniqueTypes.add(trimmed)
    })

    processed.forEach(t => analysis.uniqueTypesClean.add(t))
  })

  return {
    stats: {
      total: analysis.total,
      empty: analysis.empty,
      withProblems: analysis.withProblems,
      cleaned: analysis.cleaned,
      uniqueTypesBefore: analysis.uniqueTypes.size,
      uniqueTypesAfter: analysis.uniqueTypesClean.size
    },
    problems: analysis.problems.slice(0, 10), // Premiers 10 problèmes
    beforeAfter: analysis.beforeAfter.slice(0, 10), // Premiers 10 exemples
    uniqueTypesBefore: Array.from(analysis.uniqueTypes).sort(),
    uniqueTypesAfter: Array.from(analysis.uniqueTypesClean).sort()
  }
}

/**
 * Affiche un rapport d'analyse dans la console
 */
export function logGameTypesAnalysis(analysis) {
  if (analysis.error) {
    console.error('❌ Erreur d\'analyse:', analysis.error)
    return
  }

  const { stats, problems, beforeAfter } = analysis

  console.group('📊 Analyse des types de jeux')

  console.log('📈 Statistiques:')
  console.log(`  • Total de lignes: ${stats.total}`)
  console.log(`  • Lignes vides: ${stats.empty}`)
  console.log(`  • Lignes avec problèmes: ${stats.withProblems}`)
  console.log(`  • Lignes nettoyées: ${stats.cleaned}`)
  console.log(`  • Types uniques avant: ${stats.uniqueTypesBefore}`)
  console.log(`  • Types uniques après: ${stats.uniqueTypesAfter}`)

  if (problems.length > 0) {
    console.log('\n🔧 Exemples de problèmes détectés:')
    problems.forEach((problem, i) => {
      console.log(`  ${i + 1}. Ligne ${problem.index}:`)
      console.log(`     Original: "${problem.original}"`)
      console.log(`     Nettoyé: [${problem.processed.join(', ')}]`)
      console.log(`     Problèmes: ${Object.entries(problem.issues).filter(([, v]) => v).map(([k]) => k).join(', ')}`)
    })
  }

  if (beforeAfter.length > 0) {
    console.log('\n✨ Exemples de transformations:')
    beforeAfter.slice(0, 5).forEach((example, i) => {
      if (example.original !== example.cleaned) {
        console.log(`  ${i + 1}. "${example.original}" → "${example.cleaned}"`)
      }
    })
  }

  console.groupEnd()
}

/**
 * Fonction de test pour analyser les données actuelles
 */
export function testGameTypesInConsole(headers, rows) {
  const analysis = analyzeGameTypes(rows, headers)
  logGameTypesAnalysis(analysis)
  return analysis
}