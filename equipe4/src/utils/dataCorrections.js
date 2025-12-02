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
  
  const type = String(platformType).trim()
  const platformName = String(platform || '').toLowerCase().trim()
  
  // Gérer les valeurs multiples séparées par " ; "
  if (type.includes(' ; ')) {
    const types = type.split(/\s*;\s*/).map(t => {
      const trimmed = t.trim()
      const trimmedLower = trimmed.toLowerCase()
      
      // Normaliser "Microordinateur" en "Micro-ordinateur"
      if (trimmedLower === 'microordinateur') {
        return 'Micro-ordinateur'
      }
      
      // Gérer le cas "autre" pour chaque type individuel
      if (trimmedLower === 'autre') {
        if (platformName.includes('/')) {
          return 'Autre'
        }
        if (platformName.includes('pc') ||
            platformName.includes('windows') ||
            platformName.includes('dos') ||
            platformName.includes('ordinateur') ||
            platformName.includes('computer')) {
          return 'Micro-ordinateur'
        }
        if (platformName.includes('arcade') ||
            platformName.includes('borne')) {
          return 'Arcade'
        }
        return 'Autre'
      }
      
      return trimmed
    })
    return types.join(' ; ')
  }
  
  // Gérer les valeurs simples
  const typeLower = type.toLowerCase()
  
  // Normaliser "Microordinateur" en "Micro-ordinateur" (avec tiret)
  if (typeLower === 'microordinateur') {
    return 'Micro-ordinateur'
  }
  
  if (typeLower === 'autre') {
    if (platformName.includes('/')) {
      return 'Autre'
    }

    if (platformName.includes('pc') ||
        platformName.includes('windows') ||
        platformName.includes('dos') ||
        platformName.includes('ordinateur') ||
        platformName.includes('computer')) {
      return 'Micro-ordinateur'
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

export function correctCriteriaData(generalScore, criteriaCount) {
  if (generalScore && criteriaCount) {
    const general = Number(generalScore)
    const count = Number(criteriaCount)

    if (!isNaN(general) && !isNaN(count)) {
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

export function applyDataCorrections(critique, rawRow, headers) {
  const corrected = { ...critique }

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

  corrected.TypePlateforme = correctPlatformType(
    corrected.TypePlateforme,
    corrected.Plateforme
  )

  corrected.Pays = correctCountryData(corrected.Pays, corrected.Magazine)

  if (rawRow && headers) {
    const generalScoreIndex = headers.indexOf('Critères généraux')
    const criteriaCountIndex = headers.indexOf('Nombre de critères')

    if (generalScoreIndex >= 0 && criteriaCountIndex >= 0) {
      const correctedCriteria = correctCriteriaData(
        rawRow[generalScoreIndex],
        rawRow[criteriaCountIndex]
      )

      if (correctedCriteria.generalScore !== rawRow[generalScoreIndex]) {
        corrected.NoteGenerale = normalizeScore(correctedCriteria.generalScore)
      }
    }
  }

  return corrected
}


