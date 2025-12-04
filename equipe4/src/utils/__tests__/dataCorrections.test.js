import { describe, it, expect } from 'vitest'
import { 
  normalizeScore, 
  correctPlatformType, 
  correctCountryData, 
  correctCriteriaData,
  applyDataCorrections 
} from '../dataCorrections.js'

describe('dataCorrections', () => {
  describe('normalizeScore', () => {
    it('should normalize valid scores', () => {
      expect(normalizeScore(85)).toBe(85)
      expect(normalizeScore(85.7)).toBe(86)
      expect(normalizeScore(85.3)).toBe(85)
      expect(normalizeScore('90')).toBe(90)
      expect(normalizeScore('75.8')).toBe(76)
    })

    it('should filter invalid scores', () => {
      expect(normalizeScore(101)).toBeUndefined()
      expect(normalizeScore(150)).toBeUndefined()
      expect(normalizeScore(-5)).toBeUndefined()
      expect(normalizeScore('invalid')).toBeUndefined()
      expect(normalizeScore(null)).toBeUndefined()
      expect(normalizeScore(undefined)).toBeUndefined()
      expect(normalizeScore('')).toBeUndefined()
    })

    it('should handle edge cases', () => {
      expect(normalizeScore(0)).toBe(0)
      expect(normalizeScore(100)).toBe(100)
      expect(normalizeScore(0.4)).toBe(0)
      expect(normalizeScore(0.6)).toBe(1)
    })
  })

  describe('correctPlatformType', () => {
    it('should correct "Autre" to "Micro-ordinateur" for PC platforms', () => {
      expect(correctPlatformType('Autre', 'PC')).toBe('Micro-ordinateur')
      expect(correctPlatformType('Autre', 'Windows')).toBe('Micro-ordinateur')
      expect(correctPlatformType('Autre', 'DOS')).toBe('Micro-ordinateur')
      expect(correctPlatformType('Autre', 'Ordinateur')).toBe('Micro-ordinateur')
    })

    it('should correct "Autre" to "Arcade" for arcade platforms', () => {
      expect(correctPlatformType('Autre', 'Arcade')).toBe('Arcade')
      expect(correctPlatformType('Autre', 'Borne d\'arcade')).toBe('Arcade')
    })

    it('should keep "Autre" for truly hybrid platforms', () => {
      expect(correctPlatformType('Autre', 'Console/PC')).toBe('Autre')
      expect(correctPlatformType('Autre', 'Plateforme inconnue')).toBe('Autre')
    })

    it('should preserve other platform types', () => {
      expect(correctPlatformType('Console', 'PlayStation')).toBe('Console')
      expect(correctPlatformType('Portable', 'Game Boy')).toBe('Portable')
      expect(correctPlatformType('Mobile', 'iPhone')).toBe('Mobile')
    })
  })

  describe('correctCountryData', () => {
    it('should correct Joypad magazine country', () => {
      expect(correctCountryData('Royaume-Uni', 'Joypad')).toBe('France')
      expect(correctCountryData('Royaume-Uni', 'JOYPAD')).toBe('France')
      expect(correctCountryData('United Kingdom', 'Joypad Magazine')).toBe('France')
    })

    it('should preserve other magazine countries', () => {
      expect(correctCountryData('États-Unis', 'GamePro')).toBe('États-Unis')
      expect(correctCountryData('Japon', 'Famitsu')).toBe('Japon')
      expect(correctCountryData('France', 'Canard PC')).toBe('France')
    })

    it('should handle missing data', () => {
      expect(correctCountryData(null, 'Joypad')).toBeNull()
      expect(correctCountryData('France', null)).toBe('France')
    })
  })

  describe('correctCriteriaData', () => {
    it('should swap inverted criteria data', () => {
      const result = correctCriteriaData(2, 85)
      expect(result.generalScore).toBe(85)
      expect(result.criteriaCount).toBe(2)
    })

    it('should swap when general score is 1', () => {
      const result = correctCriteriaData(1, 92)
      expect(result.generalScore).toBe(92)
      expect(result.criteriaCount).toBe(1)
    })

    it('should not swap when values seem correct', () => {
      const result = correctCriteriaData(85, 2)
      expect(result.generalScore).toBe(85)
      expect(result.criteriaCount).toBe(2)
    })

    it('should handle missing data', () => {
      const result = correctCriteriaData(null, 85)
      expect(result.generalScore).toBeNull()
      expect(result.criteriaCount).toBe(85)
    })
  })

  describe('applyDataCorrections', () => {
    it('should apply all corrections to a critique', () => {
      const critique = {
        Note: 85.7,
        NoteGenerale: 150, // Invalid score
        TypePlateforme: 'Autre',
        Plateforme: 'PC',
        Pays: 'Royaume-Uni',
        Magazine: 'Joypad'
      }

      const corrected = applyDataCorrections(critique, [], [])

      expect(corrected.Note).toBe(86) // Rounded
      expect(corrected.NoteGenerale).toBeUndefined() // Filtered out
      expect(corrected.TypePlateforme).toBe('Micro-ordinateur') // Corrected
      expect(corrected.Pays).toBe('France') // Corrected
    })

    it('should preserve valid data', () => {
      const critique = {
        Note: 85,
        NoteGenerale: 90,
        TypePlateforme: 'Console',
        Plateforme: 'PlayStation',
        Pays: 'États-Unis',
        Magazine: 'GamePro'
      }

      const corrected = applyDataCorrections(critique, [], [])

      expect(corrected.Note).toBe(85)
      expect(corrected.NoteGenerale).toBe(90)
      expect(corrected.TypePlateforme).toBe('Console')
      expect(corrected.Pays).toBe('États-Unis')
    })
  })
})
