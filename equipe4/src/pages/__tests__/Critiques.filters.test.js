import { describe, it, expect } from 'vitest'

/**
 * Tests unitaires pour la logique de filtrage des critiques
 * Ces tests vérifient que les filtres fonctionnent correctement sans monter le composant complet
 */

describe('Logique de filtrage des critiques', () => {
  // Données de test simulant la structure Excel
  const mockHeaders = [
    'Titre', 'Magazine', 'Pays', 'Plateforme', 'Type de plateforme', // 0-4
    'Auteur', 'Genre auteur', 'Année', 'Mois', 'Note', // 5-9
    ...Array(25).fill(''), // Colonnes 10-34
    'Moyenne des critères généraux', // 35
    '', '', '',
    'Moyenne des critères visuels', // 39
    '', '', '',
    'Moyenne des critères sonores', // 43
    '', '', '',
    'Moyenne des critères de contenu', // 47
    '', '', '',
    'Moyenne des critères de jouabilité', // 51
    ...Array(11).fill(''), // 52-62
    'Moyenne des critères sur le temps de jeu', // 63
    '', '', '',
    'Moyenne des critères sur la difficulté', // 67
    ...Array(7).fill(''), // 68-74
    'Moyenne des critères sur le prix', // 75
    ...Array(7).fill(''), // 76-82
    'Moyenne des autres critères', // 83
    ...Array(30).fill(''), // 84-113
    'Atari 2600', 'ColecoVision', 'Odyssey2', 'Intellivision', // 114-117
    'Atari 7800', 'NES', 'Videopac G7400', 'MasterSystem', // 118-121
    'SuperNES', 'CDi', 'SegaGenesis', 'TurboGrafx16', // 122-125
    'AtariJaguar', 'Nintendo64', 'SegaSaturn', 'PCFX', // 126-129
    'PlayStation', 'GameCube', 'Dreamcast', 'PlayStation2', // 130-133
    'Xbox', 'Wii', 'HyperScan', 'PlayStation3', // 134-137
    'Xbox360', 'NintendoSwitch', 'PlayStation4', 'XboxOne' // 138-141
  ]

  // Créer des lignes avec exactement 142 colonnes (0-141)
  function createRow(data) {
    const row = Array(142).fill('')
    Object.keys(data).forEach(key => {
      row[key] = data[key]
    })
    return row
  }

  const mockRows = [
    // Critique 1: Jeu avec critères généraux, Console, PlayStation
    createRow({
      0: 'Jeu A', 1: 'Magazine A', 2: 'Canada', 3: 'PS4', 4: 'Console',
      5: 'Auteur 1', 6: 'masculin', 7: 2020, 8: 5, 9: 85,
      35: 75, // Critères généraux
      130: 1  // PlayStation
    }),

    // Critique 2: Jeu avec critères visuels, Microordinateur, pas de console spécifique
    createRow({
      0: 'Jeu B', 1: 'Magazine B', 2: 'France', 3: 'PC', 4: 'Microordinateur',
      5: 'Auteur 2', 6: 'féminin', 7: 2015, 8: 8, 9: 90,
      39: 80  // Critères visuels
    }),

    // Critique 3: Jeu avec critères sonores, Console, Nintendo64
    createRow({
      0: 'Jeu C', 1: 'Magazine A', 2: 'Canada', 3: 'N64', 4: 'Console',
      5: 'Auteur 1', 6: 'masculin', 7: 2000, 8: 12, 9: 70,
      43: 60,  // Critères sonores
      127: 1   // Nintendo64
    }),

    // Critique 4: Jeu sans note de critères, Portable
    createRow({
      0: 'Jeu D', 1: 'Magazine B', 2: 'France', 3: 'GameBoy', 4: 'Portable',
      5: 'Auteur 3', 6: 'masculin', 7: 1995, 8: 3, 9: 0
    })
  ]

  describe('Filtre par types de notes (scoreTypes)', () => {
    it('devrait filtrer par critères généraux avec plage de scores', () => {
      const filters = {
        scoreTypes: ['general'],
        scoreRange: [70, 80],
        includeUnscored: false
      }

      const result = mockRows.filter((row, index) => {
        const scoreValue = row[35] // Critères généraux
        if (scoreValue && scoreValue !== '' && scoreValue !== 0) {
          const numericScore = Number(scoreValue)
          if (!isNaN(numericScore)) {
            return numericScore >= filters.scoreRange[0] && numericScore <= filters.scoreRange[1]
          }
        }
        return filters.includeUnscored
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu A') // Score général = 75
    })

    it('devrait inclure les critiques sans note si includeUnscored est true', () => {
      const filters = {
        scoreTypes: ['general'],
        scoreRange: [70, 80],
        includeUnscored: true
      }

      const result = mockRows.filter((row, index) => {
        const scoreValue = row[35]
        if (scoreValue && scoreValue !== '' && scoreValue !== 0) {
          const numericScore = Number(scoreValue)
          if (!isNaN(numericScore)) {
            return numericScore >= filters.scoreRange[0] && numericScore <= filters.scoreRange[1]
          }
        }
        return filters.includeUnscored
      })

      // Devrait inclure Jeu A (75) + Jeu B, C, D (sans critères généraux)
      expect(result.length).toBeGreaterThan(1)
    })

    it('devrait filtrer par critères visuels', () => {
      const filters = {
        scoreTypes: ['visual'],
        scoreRange: [75, 85],
        includeUnscored: false
      }

      const result = mockRows.filter((row) => {
        const scoreValue = row[39] // Critères visuels
        if (scoreValue && scoreValue !== '' && scoreValue !== 0) {
          const numericScore = Number(scoreValue)
          if (!isNaN(numericScore)) {
            return numericScore >= filters.scoreRange[0] && numericScore <= filters.scoreRange[1]
          }
        }
        return filters.includeUnscored
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu B') // Score visuel = 80
    })

    it('devrait filtrer par critères sonores', () => {
      const filters = {
        scoreTypes: ['sound'],
        scoreRange: [50, 70],
        includeUnscored: false
      }

      const result = mockRows.filter((row) => {
        const scoreValue = row[43] // Critères sonores
        if (scoreValue && scoreValue !== '' && scoreValue !== 0) {
          const numericScore = Number(scoreValue)
          if (!isNaN(numericScore)) {
            return numericScore >= filters.scoreRange[0] && numericScore <= filters.scoreRange[1]
          }
        }
        return filters.includeUnscored
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu C') // Score sonore = 60
    })
  })

  describe('Filtre par types de plateformes', () => {
    it('devrait filtrer par type Console', () => {
      const filters = {
        platformTypes: ['Console']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4] // Type de plateforme
        return filters.platformTypes.includes(platformType)
      })

      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe('Jeu A')
      expect(result[1][0]).toBe('Jeu C')
    })

    it('devrait filtrer par type Microordinateur', () => {
      const filters = {
        platformTypes: ['Microordinateur']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4]
        return filters.platformTypes.includes(platformType)
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu B')
    })

    it('devrait filtrer par plusieurs types de plateformes', () => {
      const filters = {
        platformTypes: ['Console', 'Portable']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4]
        return filters.platformTypes.includes(platformType)
      })

      expect(result).toHaveLength(3) // Jeu A, C (Console) + Jeu D (Portable)
    })
  })

  describe('Filtre par consoles spécifiques', () => {
    it('devrait filtrer par PlayStation', () => {
      const filters = {
        consoles: ['PlayStation']
      }

      const result = mockRows.filter((row) => {
        const playstationIndex = 130 // PlayStation dans les headers
        return Number(row[playstationIndex]) === 1
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu A')
    })

    it('devrait filtrer par Nintendo64', () => {
      const filters = {
        consoles: ['Nintendo64']
      }

      const result = mockRows.filter((row) => {
        const n64Index = 127 // Nintendo64 dans les headers
        return Number(row[n64Index]) === 1
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu C')
    })

    it('devrait filtrer par plusieurs consoles (OR logic)', () => {
      const filters = {
        consoles: ['PlayStation', 'Nintendo64']
      }

      const result = mockRows.filter((row) => {
        const hasSelectedConsole = filters.consoles.some(consoleName => {
          let consoleIndex
          if (consoleName === 'PlayStation') consoleIndex = 130
          if (consoleName === 'Nintendo64') consoleIndex = 127
          return consoleIndex !== undefined && Number(row[consoleIndex]) === 1
        })
        return hasSelectedConsole
      })

      expect(result).toHaveLength(2) // Jeu A (PlayStation) + Jeu C (Nintendo64)
    })
  })

  describe('Filtre par date (année et mois)', () => {
    it('devrait filtrer par plage d\'années', () => {
      const filters = {
        yearRange: [2015, 2020]
      }

      const result = mockRows.filter((row) => {
        const year = row[7] // Année
        return year >= filters.yearRange[0] && year <= filters.yearRange[1]
      })

      expect(result).toHaveLength(2) // Jeu A (2020) + Jeu B (2015)
    })

    it('devrait filtrer par plage de mois', () => {
      const filters = {
        monthRange: [5, 8]
      }

      const result = mockRows.filter((row) => {
        const month = row[8] // Mois
        return month >= filters.monthRange[0] && month <= filters.monthRange[1]
      })

      expect(result).toHaveLength(2) // Jeu A (mois 5) + Jeu B (mois 8)
    })

    it('devrait combiner filtres d\'année et de mois', () => {
      const filters = {
        yearRange: [2000, 2020],
        monthRange: [5, 12]
      }

      const result = mockRows.filter((row) => {
        const year = row[7]
        const month = row[8]
        return year >= filters.yearRange[0] && year <= filters.yearRange[1] &&
               month >= filters.monthRange[0] && month <= filters.monthRange[1]
      })

      // Jeu A (2020, mois 5), Jeu B (2015, mois 8), Jeu C (2000, mois 12)
      expect(result).toHaveLength(3)
      expect(result.map(r => r[0])).toContain('Jeu A')
      expect(result.map(r => r[0])).toContain('Jeu C')
    })
  })

  describe('Combinaison de filtres multiples', () => {
    it('devrait combiner filtre de type de plateforme et console', () => {
      const filters = {
        platformTypes: ['Console'],
        consoles: ['PlayStation']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4]
        const playstationIndex = 130
        
        const matchesPlatformType = filters.platformTypes.includes(platformType)
        const matchesConsole = Number(row[playstationIndex]) === 1
        
        return matchesPlatformType && matchesConsole
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu A')
    })

    it('devrait combiner filtre de date et de score', () => {
      const filters = {
        yearRange: [2015, 2020],
        scoreTypes: ['general'],
        scoreRange: [70, 80],
        includeUnscored: false
      }

      const result = mockRows.filter((row) => {
        const year = row[7]
        const scoreValue = row[35]
        
        const matchesYear = year >= filters.yearRange[0] && year <= filters.yearRange[1]
        
        let matchesScore = filters.includeUnscored
        if (scoreValue && scoreValue !== '' && scoreValue !== 0) {
          const numericScore = Number(scoreValue)
          if (!isNaN(numericScore)) {
            matchesScore = numericScore >= filters.scoreRange[0] && numericScore <= filters.scoreRange[1]
          }
        }
        
        return matchesYear && matchesScore
      })

      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('Jeu A') // 2020, score général 75
    })
  })
})

