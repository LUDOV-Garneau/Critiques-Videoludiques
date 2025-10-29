/**
 * Utilitaire pour corriger et normaliser les données selon les recommandations du client
 */

/**
 * Normalise une note sur une échelle de 0 à 100
 * - Arrondit les notes décimales
 * - Filtre les notes > 100 et les divisions par zéro
 * - Retourne undefined pour les valeurs invalides
 */
export function normalizeScore(value) {
  if (value === undefined || value === null || value === '') return undefined
  
  const num = Number(value)
  
  // Filtrer les valeurs invalides
  if (isNaN(num) || num < 0 || num > 100) return undefined
  
  // Arrondir les décimales
  return Math.round(num)
}

/**
 * Corrige le type de plateforme selon les recommandations du client
 * - "Autre" est majoritairement utilisé pour les PC (93% des cas)
 * - Gère les cas d'arcade, plateformes hybrides, etc.
 */
export function correctPlatformType(platformType, platform) {
  if (!platformType) return platformType
  
  const type = String(platformType).toLowerCase().trim()
  const platformName = String(platform || '').toLowerCase().trim()
  
  // "Autre" est principalement utilisé pour les PC
  if (type === 'autre') {
    // Garder "Autre" pour les plateformes vraiment hybrides (contenant "/")
    if (platformName.includes('/')) {
      return 'Autre'
    }

    // Détecter si c'est un PC basé sur le nom de la plateforme
    if (platformName.includes('pc') ||
        platformName.includes('windows') ||
        platformName.includes('dos') ||
        platformName.includes('ordinateur') ||
        platformName.includes('computer')) {
      return 'Microordinateur'
    }

    // Détecter les jeux d'arcade
    if (platformName.includes('arcade') ||
        platformName.includes('borne')) {
      return 'Arcade'
    }

    // Garder "Autre" pour les cas vraiment hybrides ou indéterminés
    return 'Autre'
  }
  
  // Garder les autres types tels quels
  return platformType
}

/**
 * Corrige les données géographiques selon les recommandations du client
 * - Joypad est une revue française, pas du Royaume-Uni
 */
export function correctCountryData(country, magazine) {
  if (!country || !magazine) return country
  
  const mag = String(magazine).toLowerCase().trim()
  const countryName = String(country).toLowerCase().trim()
  
  // Corriger Joypad comme revue française
  if (mag.includes('joypad') &&
      (countryName.includes('royaume-uni') ||
       countryName.includes('united kingdom') ||
       countryName.includes('uk'))) {
    return 'France'
  }
  
  return country
}

/**
 * Valide et corrige les données de critères généraux vs nombre de critères
 * Selon le client : AG (critère général) et AH (nombre de critères) sont parfois inversés
 */
export function correctCriteriaData(generalScore, criteriaCount) {
  // Si le score général est 1 ou 2 et le nombre de critères est plus élevé,
  // ils sont probablement inversés
  if (generalScore && criteriaCount) {
    const general = Number(generalScore)
    const count = Number(criteriaCount)
    
    if (!isNaN(general) && !isNaN(count)) {
      // Si le "score général" est très bas (1-2) et le "nombre" est plus élevé,
      // ils sont probablement inversés
      if (general <= 2 && count > general) {
        return {
          generalScore: count,
          criteriaCount: general
        }
      }
    }
  }
  
  return {
    generalScore,
    criteriaCount
  }
}

/**
 * Nettoie et valide une valeur de données
 */
export function cleanDataValue(value) {
  if (value === undefined || value === null) return undefined
  
  const str = String(value).trim()
  
  // Retourner undefined pour les valeurs vides ou invalides
  if (str === '' || str === '0' || str === '-' || str.toLowerCase() === 'null') {
    return undefined
  }
  
  return str
}

/**
 * Applique toutes les corrections de données à un objet critique
 */
export function applyDataCorrections(critique, rawRow, headers) {
  const corrected = { ...critique }
  
  // Normaliser toutes les notes
  const scoreFields = [
    'Note', 'NoteGenerale', 'NoteVisuelle', 'NoteSonore', 
    'NoteContenu', 'NoteJouabilite', 'NoteTempsJeu', 
    'NoteDifficulte', 'NotePrix', 'NoteAutre'
  ]
  
  scoreFields.forEach(field => {
    if (corrected[field] !== undefined) {
      corrected[field] = normalizeScore(corrected[field])
    }
  })
  
  // Corriger le type de plateforme
  corrected.TypePlateforme = correctPlatformType(
    corrected.TypePlateforme, 
    corrected.Plateforme
  )
  
  // Corriger les données géographiques
  corrected.Pays = correctCountryData(corrected.Pays, corrected.Magazine)
  
  // Corriger les données de critères (si disponibles dans rawRow)
  if (rawRow && headers) {
    const generalScoreIndex = headers.indexOf('Critères généraux')
    const criteriaCountIndex = headers.indexOf('Nombre de critères')
    
    if (generalScoreIndex >= 0 && criteriaCountIndex >= 0) {
      const correctedCriteria = correctCriteriaData(
        rawRow[generalScoreIndex],
        rawRow[criteriaCountIndex]
      )
      
      // Mettre à jour les valeurs corrigées si nécessaire
      if (correctedCriteria.generalScore !== rawRow[generalScoreIndex]) {
        corrected.NoteGenerale = normalizeScore(correctedCriteria.generalScore)
      }
    }
  }
  
  return corrected
}

/**
 * Statistiques sur les corrections appliquées
 */
export function getDataCorrectionStats(originalData, correctedData) {
  const stats = {
    totalRecords: originalData.length,
    scoresNormalized: 0,
    scoresFiltered: 0,
    platformTypesCorreted: 0,
    countriesCorreted: 0,
    criteriaSwapped: 0
  }
  
  for (let i = 0; i < originalData.length; i++) {
    const original = originalData[i]
    const corrected = correctedData[i]
    
    // Compter les notes normalisées
    const scoreFields = ['Note', 'NoteGenerale', 'NoteVisuelle', 'NoteSonore']
    scoreFields.forEach(field => {
      if (original[field] !== corrected[field]) {
        if (corrected[field] === undefined) {
          stats.scoresFiltered++
        } else {
          stats.scoresNormalized++
        }
      }
    })
    
    // Compter les corrections de type de plateforme
    if (original.TypePlateforme !== corrected.TypePlateforme) {
      stats.platformTypesCorreted++
    }
    
    // Compter les corrections de pays
    if (original.Pays !== corrected.Pays) {
      stats.countriesCorreted++
    }
  }
  
  return stats
}
