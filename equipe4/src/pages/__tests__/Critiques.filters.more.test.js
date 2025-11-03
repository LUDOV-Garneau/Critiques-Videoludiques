import { describe, it, expect } from 'vitest'

/**
 * Tests complémentaires pour la logique de filtrage non couverte:
 * - magazines
 * - countries
 * - authorName (match exact insensible à la casse sur tokens)
 * - authorGender (en s'appuyant sur colonnes brutes masculins/féminin)
 * - showWithoutAuthors
 * - imageTypes
 */

describe('Logique de filtrage des critiques (compléments)', () => {
  // Construire un tableau (type Excel) pour certains tests bruts (gender)
  const headers = [
    'Titre',             // 0
    'Magazine',          // 1
    'Pays',              // 2
    'Type de plateforme',// 3 (non utilisé ici)
    'Année',             // 4 (non utilisé ici)
    'Nom des auteurs masculins',   // 5
    'Nom des autrices féminin',    // 6
    "Titre des étiquettes génériques de genre", // 7 (non utilisé ici)
    "Type d'images utilisés"      // 8
  ]

  function createRawRow(values) {
    const row = Array(headers.length).fill('')
    Object.entries(values).forEach(([i, v]) => { row[Number(i)] = v })
    return row
  }

  // Objets mappés minimaux (comme mappedObjects), utiles pour magazines/countries/Auteurs/ImageType
  const mapped = [
    { Titre: 'A', Magazine: 'Mag A', Pays: 'Canada', Auteurs: 'Jean Dupont', ImageType: 'Box Art' },
    { Titre: 'B', Magazine: 'Mag B', Pays: 'France', Auteurs: '-', ImageType: 'Screenshot' },
    { Titre: 'C', Magazine: 'Mag A', Pays: 'France', Auteurs: 'Anne; Pierre', ImageType: 'Illustration' },
  ]

  describe('magazines et countries', () => {
    it('filtre par magazines', () => {
      const filters = { magazines: ['Mag A'], countries: [] }
      const result = mapped.filter(x => {
        if (filters.magazines.length > 0 && !filters.magazines.includes(String(x.Magazine))) return false
        if (filters.countries.length > 0 && !filters.countries.includes(String(x.Pays))) return false
        return true
      })
      expect(result.map(x => x.Titre)).toEqual(['A', 'C'])
    })

    it('filtre par countries', () => {
      const filters = { magazines: [], countries: ['France'] }
      const result = mapped.filter(x => {
        if (filters.magazines.length > 0 && !filters.magazines.includes(String(x.Magazine))) return false
        if (filters.countries.length > 0 && !filters.countries.includes(String(x.Pays))) return false
        return true
      })
      expect(result.map(x => x.Titre)).toEqual(['B', 'C'])
    })

    it('combine magazines + countries', () => {
      const filters = { magazines: ['Mag A'], countries: ['France'] }
      const result = mapped.filter(x => {
        if (filters.magazines.length > 0 && !filters.magazines.includes(String(x.Magazine))) return false
        if (filters.countries.length > 0 && !filters.countries.includes(String(x.Pays))) return false
        return true
      })
      expect(result.map(x => x.Titre)).toEqual(['C'])
    })
  })

  describe('authorName exact token (case-insensitive)', () => {
    function normalize(s) { return String(s || '').toLowerCase().trim() }
    function matchByAuthorName(x, authorName) {
      if (!authorName) return true
      const target = normalize(authorName)
      const tokens = new Set()
      const pushTokens = (val) => {
        String(val || '')
          .split(/[,;]+/)
          .map(v => normalize(v))
          .filter(v => v && v !== '0' && !/^\d+$/.test(v))
          .forEach(v => tokens.add(v))
      }
      pushTokens(x.Auteurs)
      return Array.from(tokens).includes(target)
    }

    it('fait un match exact sur un token auteur', () => {
      // Chercher "anne" doit matcher la deuxième entrée
      const result = mapped.filter(x => matchByAuthorName(x, 'anne'))
      expect(result.map(x => x.Titre)).toEqual(['C'])
    })

    it('ne matche pas partiellement au milieu du token', () => {
      // "ean" n'est pas un token exact (partiel de "Jean")
      const result = mapped.filter(x => matchByAuthorName(x, 'ean'))
      expect(result).toHaveLength(0)
    })
  })

  describe('showWithoutAuthors', () => {
    it('garde uniquement les critiques sans auteurs quand activé', () => {
      const filters = { showWithoutAuthors: true }
      const result = mapped.filter(x => {
        if (filters.showWithoutAuthors) {
          if (x.Auteurs !== '-') return false
        }
        return true
      })
      expect(result.map(x => x.Titre)).toEqual(['B'])
    })
  })

  describe('imageTypes', () => {
    it('filtre par type d\'image', () => {
      const filters = { imageTypes: ['Screenshot', 'Illustration'] }
      const result = mapped.filter(x => {
        if (filters.imageTypes && filters.imageTypes.length > 0) {
          if (!filters.imageTypes.includes(x.ImageType)) return false
        }
        return true
      })
      expect(result.map(x => x.Titre)).toEqual(['B', 'C'])
    })
  })

  describe('authorGender basé sur les colonnes brutes', () => {
    const rawRows = [
      // Titre, Magazine, Pays, TypePlatf., Année, Male, Female, GameTypes, ImageType
      createRawRow({ 0: 'A', 1: 'Mag A', 2: 'CA', 5: 'Jean', 6: '', 8: 'Box Art' }),
      createRawRow({ 0: 'B', 1: 'Mag B', 2: 'FR', 5: '', 6: 'Anne; Claire', 8: 'Screenshot' }),
      createRawRow({ 0: 'C', 1: 'Mag A', 2: 'FR', 5: '', 6: '', 8: 'Illustration' }),
    ]

    function matchByAuthorGender(row, gender) {
      const maleAuthor = row[5]
      const femaleAuthor = row[6]
      if (gender === 'masculin') {
        if (!maleAuthor || maleAuthor === '' || maleAuthor === '0') return false
      }
      if (gender === 'féminin') {
        if (!femaleAuthor || femaleAuthor === '' || femaleAuthor === '0') return false
      }
      return true
    }

    it('filtre masculin', () => {
      const result = rawRows.filter(r => matchByAuthorGender(r, 'masculin'))
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('A')
    })

    it('filtre féminin', () => {
      const result = rawRows.filter(r => matchByAuthorGender(r, 'féminin'))
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('B')
    })
  })
})


