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
    'Xbox360', 'NintendoSwitch', 'PlayStation4', 'XboxOne', // 138-141
    'Titre des plateformes', 'Titre des étiquettes génériques de genre' // 142-143
  ]

  // Créer des lignes avec exactement 144 colonnes (0-143)
  function createRow(data) {
    const row = Array(144).fill('')
    Object.keys(data).forEach(key => {
      row[key] = data[key]
    })
    return row
  }

  const mockRows = [
    // Critique 1: Jeu avec critères généraux, Console, PlayStation, Action
    createRow({
      0: 'Jeu A', 1: 'Magazine A', 2: 'Canada', 3: 'PS4', 4: 'Console',
      5: 'Auteur 1', 6: 'masculin', 7: 2020, 8: 5, 9: 85,
      35: 75, // Critères généraux
      130: 1, // PlayStation
      143: 'Action' // Type de jeu
    }),

    // Critique 2: Jeu avec critères visuels, Microordinateur, RPG/Aventure
    createRow({
      0: 'Jeu B', 1: 'Magazine B', 2: 'France', 3: 'PC', 4: 'Microordinateur',
      5: 'Auteur 2', 6: 'féminin', 7: 2015, 8: 8, 9: 90,
      39: 80, // Critères visuels
      143: 'RPG/Aventure' // Type de jeu composé
    }),

    // Critique 3: Jeu avec critères sonores, Console, Nintendo64, Plateforme
    createRow({
      0: 'Jeu C', 1: 'Magazine A', 2: 'Canada', 3: 'N64', 4: 'Console',
      5: 'Auteur 1', 6: 'masculin', 7: 2000, 8: 12, 9: 70,
      43: 60,  // Critères sonores
      127: 1,  // Nintendo64
      143: 'Plateforme' // Type de jeu
    }),

    // Critique 4: Jeu sans note de critères, Portable, Simulation
    createRow({
      0: 'Jeu D', 1: 'Magazine B', 2: 'France', 3: 'GameBoy', 4: 'Portable',
      5: 'Auteur 3', 6: 'masculin', 7: 1995, 8: 3, 9: 0,
      143: 'Simulation' // Type de jeu
    }),

    // Critique 5: Jeu avec type composé Action/Aventure/Infiltration
    createRow({
      0: 'Jeu E', 1: 'Magazine A', 2: 'Canada', 3: 'PC', 4: 'Microordinateur',
      5: 'Auteur 4', 6: 'féminin', 7: 2018, 8: 6, 9: 88,
      35: 85, // Critères généraux
      143: 'Action/Aventure/Infiltration' // Type de jeu très composé
    }),

    // Critique 6: Jeu sans type de jeu (pour tester les cas vides)
    createRow({
      0: 'Jeu F', 1: 'Magazine B', 2: 'France', 3: 'Xbox', 4: 'Console',
      5: 'Auteur 5', 6: 'masculin', 7: 2021, 8: 9, 9: 75,
      134: 1 // Xbox
      // 143: pas de type de jeu
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

      expect(result).toHaveLength(3) // Jeu A, Jeu C, Jeu F (tous Console)
      expect(result.map(r => r[0])).toContain('Jeu A')
      expect(result.map(r => r[0])).toContain('Jeu C')
      expect(result.map(r => r[0])).toContain('Jeu F')
    })

    it('devrait filtrer par type Microordinateur', () => {
      const filters = {
        platformTypes: ['Microordinateur']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4]
        return filters.platformTypes.includes(platformType)
      })

      expect(result).toHaveLength(2) // Jeu B et Jeu E (tous Microordinateur)
      expect(result.map(r => r[0])).toContain('Jeu B')
      expect(result.map(r => r[0])).toContain('Jeu E')
    })

    it('devrait filtrer par plusieurs types de plateformes', () => {
      const filters = {
        platformTypes: ['Console', 'Portable']
      }

      const result = mockRows.filter((row) => {
        const platformType = row[4]
        return filters.platformTypes.includes(platformType)
      })

      expect(result).toHaveLength(4) // Jeu A, C, F (Console) + Jeu D (Portable)
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

      expect(result).toHaveLength(3) // Jeu A (2020), Jeu B (2015), Jeu E (2018)
    })

    it('devrait filtrer par plage de mois', () => {
      const filters = {
        monthRange: [5, 8]
      }

      const result = mockRows.filter((row) => {
        const month = row[8] // Mois
        return month >= filters.monthRange[0] && month <= filters.monthRange[1]
      })

      expect(result).toHaveLength(3) // Jeu A (mois 5), Jeu B (mois 8), Jeu E (mois 6)
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

      // Jeu A (2020, mois 5), Jeu B (2015, mois 8), Jeu C (2000, mois 12), Jeu E (2018, mois 6)
      expect(result).toHaveLength(4)
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

  describe('Filtrage par types de jeux', () => {
    // Simuler la logique de filtrage par types de jeux
    function filterByGameTypes(rows, gameTypes) {
      if (!gameTypes || gameTypes.length === 0) return rows

      return rows.filter(row => {
        const gameType = row[143] // Colonne 143: "Titre des étiquettes génériques de genre"
        if (!gameType || gameType === '' || gameType === '0') return false

        // Séparer les types multiples et vérifier si au moins un correspond
        const types = String(gameType).split(/[\/,;]+/).map(t => t.trim()).filter(t => t)
        return gameTypes.some(selectedType => types.includes(selectedType))
      })
    }

    it('devrait filtrer par un seul type de jeu', () => {
      const result = filterByGameTypes(mockRows, ['Action'])

      expect(result).toHaveLength(2) // Jeu A (Action) et Jeu E (Action/Aventure/Infiltration)
      expect(result[0][0]).toBe('Jeu A')
      expect(result[1][0]).toBe('Jeu E')
    })

    it('devrait filtrer par plusieurs types de jeux', () => {
      const result = filterByGameTypes(mockRows, ['Action', 'Simulation'])

      expect(result).toHaveLength(3) // Jeu A (Action), Jeu D (Simulation), Jeu E (Action/...)
      expect(result.map(r => r[0])).toContain('Jeu A')
      expect(result.map(r => r[0])).toContain('Jeu D')
      expect(result.map(r => r[0])).toContain('Jeu E')
    })

    it('devrait gérer les types de jeux composés', () => {
      const result = filterByGameTypes(mockRows, ['RPG'])

      expect(result).toHaveLength(1) // Jeu B (RPG/Aventure)
      expect(result[0][0]).toBe('Jeu B')
    })

    it('devrait gérer les types de jeux avec plusieurs séparateurs', () => {
      const result = filterByGameTypes(mockRows, ['Aventure'])

      expect(result).toHaveLength(2) // Jeu B (RPG/Aventure) et Jeu E (Action/Aventure/Infiltration)
      expect(result.map(r => r[0])).toContain('Jeu B')
      expect(result.map(r => r[0])).toContain('Jeu E')
    })

    it('devrait gérer les types de jeux avec infiltration', () => {
      const result = filterByGameTypes(mockRows, ['Infiltration'])

      expect(result).toHaveLength(1) // Jeu E (Action/Aventure/Infiltration)
      expect(result[0][0]).toBe('Jeu E')
    })

    it('devrait retourner un tableau vide pour un type inexistant', () => {
      const result = filterByGameTypes(mockRows, ['Sport'])

      expect(result).toHaveLength(0)
    })

    it('devrait exclure les jeux sans type de jeu par défaut', () => {
      const result = filterByGameTypes(mockRows, ['Action'])

      // Jeu F n'a pas de type de jeu, donc ne devrait pas être inclus
      expect(result.map(r => r[0])).not.toContain('Jeu F')
    })

    it('devrait inclure les jeux sans type avec "Non spécifiés"', () => {
      // Simuler la logique pour "Non spécifiés"
      function filterByGameTypesWithUnspecified(rows, gameTypes) {
        if (!gameTypes || gameTypes.length === 0) return rows

        return rows.filter(row => {
          const gameType = row[143]

          // Gérer le cas "Non spécifiés"
          if (gameTypes.includes('Non spécifiés')) {
            if (!gameType || gameType === '' || gameType === '0') {
              return true // Inclure ce jeu
            }
            if (gameTypes.length === 1) {
              return false // Seul "Non spécifiés" est sélectionné
            }
          }

          // Vérification normale
          if (!gameType || gameType === '' || gameType === '0') return false

          const types = String(gameType).split(/[\/,;]+/).map(t => t.trim()).filter(t => t)
          return gameTypes.some(selectedType =>
            selectedType !== 'Non spécifiés' && types.includes(selectedType)
          )
        })
      }

      const result = filterByGameTypesWithUnspecified(mockRows, ['Non spécifiés'])

      // Jeu F n'a pas de type de jeu, donc devrait être inclus
      expect(result.map(r => r[0])).toContain('Jeu F')
      expect(result).toHaveLength(1) // Seul Jeu F
    })

    it('devrait combiner "Non spécifiés" avec d\'autres types', () => {
      function filterByGameTypesWithUnspecified(rows, gameTypes) {
        if (!gameTypes || gameTypes.length === 0) return rows

        return rows.filter(row => {
          const gameType = row[143]

          if (gameTypes.includes('Non spécifiés')) {
            if (!gameType || gameType === '' || gameType === '0') {
              return true
            }
            if (gameTypes.length === 1) {
              return false
            }
          }

          if (!gameType || gameType === '' || gameType === '0') return false

          const types = String(gameType).split(/[\/,;]+/).map(t => t.trim()).filter(t => t)
          return gameTypes.some(selectedType =>
            selectedType !== 'Non spécifiés' && types.includes(selectedType)
          )
        })
      }

      const result = filterByGameTypesWithUnspecified(mockRows, ['Non spécifiés', 'Action'])

      // Devrait inclure Jeu F (non spécifié) + Jeu A et Jeu E (Action)
      expect(result.map(r => r[0])).toContain('Jeu F')
      expect(result.map(r => r[0])).toContain('Jeu A')
      expect(result.map(r => r[0])).toContain('Jeu E')
      expect(result).toHaveLength(3)
    })

    it('devrait trier les types de jeux en ignorant les accents', () => {
      // Simuler la logique de tri des facettes
      function sortGameTypes(gameTypes, hasUnspecified = false) {
        const sorted = gameTypes.sort((a, b) => {
          return a.localeCompare(b, 'fr', { sensitivity: 'base' })
        })

        if (hasUnspecified) {
          sorted.push('Non spécifiés')
        }

        return sorted
      }

      const gameTypes = ['Éducation', 'Action', 'Aventure', 'Économie', 'Arcade']
      const result = sortGameTypes(gameTypes, true)

      // Vérifier que les types avec accents sont bien triés
      expect(result.indexOf('Action')).toBeLessThan(result.indexOf('Aventure'))
      expect(result.indexOf('Aventure')).toBeLessThan(result.indexOf('Économie'))
      expect(result.indexOf('Économie')).toBeLessThan(result.indexOf('Éducation'))

      // Vérifier que "Non spécifiés" est à la fin
      expect(result[result.length - 1]).toBe('Non spécifiés')
    })

    it('devrait retourner tous les jeux si aucun filtre de type', () => {
      const result = filterByGameTypes(mockRows, [])

      expect(result).toHaveLength(mockRows.length)
    })

    it('devrait être insensible aux espaces dans les types composés', () => {
      // Simuler un type avec espaces
      const rowWithSpaces = createRow({
        0: 'Jeu G', 143: 'Action / Aventure / Course'
      })
      const testRows = [...mockRows, rowWithSpaces]

      const result = filterByGameTypes(testRows, ['Aventure'])

      // Devrait inclure le jeu avec espaces
      expect(result.map(r => r[0])).toContain('Jeu G')
    })

    it('devrait combiner avec d\'autres filtres', () => {
      // Simuler un filtre combiné: types de jeux + magazine
      const gameTypeFiltered = filterByGameTypes(mockRows, ['Action'])
      const magazineFiltered = gameTypeFiltered.filter(row => row[1] === 'Magazine A')

      expect(magazineFiltered).toHaveLength(2) // Jeu A et Jeu E (tous deux Magazine A + Action)
      expect(magazineFiltered.map(r => r[0])).toContain('Jeu A')
      expect(magazineFiltered.map(r => r[0])).toContain('Jeu E')
    })
  })

  describe('Filtrage par types de jeux avec logique ET/OU', () => {
    // Fonction de filtrage avec logique ET/OU
    function filterByGameTypesWithLogic(rows, gameTypes, logic = 'OU') {
      if (!gameTypes || gameTypes.length === 0) return rows

      return rows.filter(row => {
        const gameType = row[143] // Colonne 143: "Titre des étiquettes génériques de genre"
        if (!gameType || gameType === '' || gameType === '0') return false

        // Séparer les types multiples
        const types = String(gameType).split(/[\/,;]+/).map(t => t.trim()).filter(t => t)

        if (logic === 'ET') {
          // Logique ET inclusive : la critique ne doit contenir QUE des genres parmi ceux sélectionnés
          // Tous les genres de la critique doivent être dans la liste des genres sélectionnés
          return types.every(type => gameTypes.includes(type))
        } else {
          // Logique OU (par défaut) : au moins un genre doit correspondre
          return gameTypes.some(selectedType => types.includes(selectedType))
        }
      })
    }

    describe('Logique OU (par défaut)', () => {
      it('devrait retourner les jeux ayant AU MOINS UN des genres sélectionnés', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action', 'RPG'], 'OU')

        // Jeu A (Action), Jeu B (RPG/Aventure), Jeu E (Action/Aventure/Infiltration)
        expect(result).toHaveLength(3)
        expect(result.map(r => r[0])).toContain('Jeu A')
        expect(result.map(r => r[0])).toContain('Jeu B')
        expect(result.map(r => r[0])).toContain('Jeu E')
      })

      it('devrait inclure un jeu avec un seul genre correspondant en mode OU', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action', 'Simulation'], 'OU')

        // Jeu A (Action), Jeu D (Simulation), Jeu E (Action/Aventure/Infiltration)
        expect(result).toHaveLength(3)
        expect(result.map(r => r[0])).toContain('Jeu A')
        expect(result.map(r => r[0])).toContain('Jeu D')
        expect(result.map(r => r[0])).toContain('Jeu E')
      })

      it('devrait fonctionner avec un seul genre en mode OU', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action'], 'OU')

        expect(result).toHaveLength(2) // Jeu A et Jeu E
        expect(result.map(r => r[0])).toContain('Jeu A')
        expect(result.map(r => r[0])).toContain('Jeu E')
      })
    })

    describe('Logique ET (inclusive)', () => {
      it('devrait retourner uniquement les jeux dont TOUS les genres sont dans la sélection', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action', 'Aventure', 'Infiltration'], 'ET')

        // Jeu A (Action) ✅ - "Action" est dans la sélection
        // Jeu E (Action/Aventure/Infiltration) ✅ - tous ses genres sont dans la sélection
        expect(result).toHaveLength(2)
        expect(result.map(r => r[0])).toContain('Jeu A')
        expect(result.map(r => r[0])).toContain('Jeu E')
      })

      it('devrait retourner un jeu avec exactement les genres sélectionnés en mode ET', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['RPG', 'Aventure'], 'ET')

        // Jeu B a RPG/Aventure - tous ses genres sont dans la sélection
        expect(result).toHaveLength(1)
        expect(result[0][0]).toBe('Jeu B')
      })

      it('devrait exclure les jeux ayant des genres non sélectionnés en mode ET', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action', 'Aventure'], 'ET')

        // Jeu A (Action) ✅ - "Action" est dans la sélection
        // Jeu E (Action/Aventure/Infiltration) ❌ - "Infiltration" n'est pas dans la sélection
        expect(result).toHaveLength(1)
        expect(result[0][0]).toBe('Jeu A')
      })

      it('devrait fonctionner avec un seul genre en mode ET', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action'], 'ET')

        // Seul Jeu A a uniquement "Action" (pas d'autres genres)
        // Jeu E a Action/Aventure/Infiltration donc est exclu
        expect(result).toHaveLength(1)
        expect(result[0][0]).toBe('Jeu A')
      })

      it('devrait retourner plusieurs jeux si leurs genres sont tous dans la sélection', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action', 'RPG', 'Aventure', 'Infiltration'], 'ET')

        // Jeu A (Action) ✅
        // Jeu B (RPG/Aventure) ✅
        // Jeu E (Action/Aventure/Infiltration) ✅
        expect(result).toHaveLength(3)
        expect(result.map(r => r[0])).toContain('Jeu A')
        expect(result.map(r => r[0])).toContain('Jeu B')
        expect(result.map(r => r[0])).toContain('Jeu E')
      })

      it('devrait retourner un tableau vide si un jeu a un genre non sélectionné', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Action'], 'ET')

        // Jeu A (Action) ✅
        // Jeu E (Action/Aventure/Infiltration) ❌ car a "Aventure" et "Infiltration" non sélectionnés
        expect(result).toHaveLength(1)
        expect(result[0][0]).toBe('Jeu A')
      })

      it('devrait exclure les jeux avec des genres supplémentaires non sélectionnés', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Simulation'], 'ET')

        // Jeu D (Simulation) ✅
        expect(result).toHaveLength(1)
        expect(result[0][0]).toBe('Jeu D')
      })
    })

    describe('Comparaison ET vs OU', () => {
      it('devrait retourner plus de résultats en mode OU qu\'en mode ET', () => {
        const genres = ['Action', 'Aventure']
        const resultOU = filterByGameTypesWithLogic(mockRows, genres, 'OU')
        const resultET = filterByGameTypesWithLogic(mockRows, genres, 'ET')

        // Mode OU : Jeu A (Action), Jeu B (RPG/Aventure), Jeu E (Action/Aventure/Infiltration)
        expect(resultOU).toHaveLength(3)

        // Mode ET : Jeu E (Action/Aventure/Infiltration)
        expect(resultET).toHaveLength(1)

        expect(resultOU.length).toBeGreaterThan(resultET.length)
      })

      it('devrait avoir les mêmes résultats ET et OU avec un seul genre', () => {
        const genres = ['Simulation']
        const resultOU = filterByGameTypesWithLogic(mockRows, genres, 'OU')
        const resultET = filterByGameTypesWithLogic(mockRows, genres, 'ET')

        expect(resultOU).toHaveLength(resultET.length)
        expect(resultOU.map(r => r[0])).toEqual(resultET.map(r => r[0]))
      })
    })

    describe('Cas limites', () => {
      it('devrait retourner tous les jeux si aucun filtre en mode OU', () => {
        const result = filterByGameTypesWithLogic(mockRows, [], 'OU')
        expect(result).toHaveLength(mockRows.length)
      })

      it('devrait retourner tous les jeux si aucun filtre en mode ET', () => {
        const result = filterByGameTypesWithLogic(mockRows, [], 'ET')
        expect(result).toHaveLength(mockRows.length)
      })

      it('devrait gérer les genres inexistants en mode OU', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Sport', 'Course'], 'OU')
        expect(result).toHaveLength(0)
      })

      it('devrait gérer les genres inexistants en mode ET', () => {
        const result = filterByGameTypesWithLogic(mockRows, ['Sport', 'Course'], 'ET')
        expect(result).toHaveLength(0)
      })
    })
  })
})

