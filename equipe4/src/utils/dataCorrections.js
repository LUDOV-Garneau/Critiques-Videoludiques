/**
 * Utilitaire de corrections de données
 */

/**
 * Normalise une note sur une échelle de 0 à 100
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
 * Corrige le type de plateforme
 */
export function correctPlatformType(platformType, platform) {
  if (!platformType) return platformType
  
  const type = String(platformType).toLowerCase().trim()
  const platformName = String(platform || '').toLowerCase().trim()
  
  if (type === 'autre') {
    if (platformName.includes('/')) {
      return 'Autre'
    }

    if (platformName.includes('pc') ||
        platformName.includes('windows') ||
        platformName.includes('dos') ||
        platformName.includes('ordinateur') ||
        platformName.includes('computer')) {
      return 'Microordinateur'
    }

    if (platformName.includes('arcade') ||
        platformName.includes('borne')) {
      return 'Arcade'
    }

    return 'Autre'
  }
  return platformType
}

/**
 * Corrige les données géographiques
 */
export function correctCountryData(country, magazine) {
  if (!country || !magazine) return country
  
  const mag = String(magazine).toLowerCase().trim()
  const countryName = String(country).toLowerCase().trim()
  
  if (mag.includes('joypad') &&
      (countryName.includes('royaume-uni') ||
       countryName.includes('united kingdom') ||
       countryName.includes('uk'))) {
    return 'France'
  }
  
  return country
}

/**
 * Corrige les données de critères
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
 * Applique les corrections de données
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
