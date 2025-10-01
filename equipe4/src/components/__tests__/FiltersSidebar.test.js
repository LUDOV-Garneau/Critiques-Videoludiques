import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FiltersSidebar from '../FiltersSidebar.vue'

describe('FiltersSidebar - Tests des filtres', () => {
  let wrapper
  const defaultFacets = {
    magazines: ['Magazine A', 'Magazine B'],
    countries: ['Canada', 'France'],
    platforms: ['PC', 'PlayStation'],
    authors: ['Auteur 1', 'Auteur 2'],
    minYear: 1980,
    maxYear: 2025,
    minScore: 0,
    maxScore: 100
  }

  beforeEach(() => {
    wrapper = mount(FiltersSidebar, {
      props: {
        facets: defaultFacets,
        activeFilters: {}
      }
    })
  })

  describe('Filtre par notes (scoreTypes)', () => {
    it('devrait permettre de sélectionner un type de critère', async () => {
      const component = wrapper.vm

      // Sélectionner le type "general" directement via la méthode
      component.toggleScoreType('general')

      await wrapper.vm.$nextTick()

      // Vérifier que le filtre a été ajouté
      expect(component.localFilters.scoreTypes).toContain('general')
    })

    it('devrait permettre de sélectionner plusieurs types de critères', async () => {
      // Simuler la sélection de plusieurs types
      const component = wrapper.vm
      
      // Ajouter plusieurs types de critères
      component.toggleScoreType('general')
      component.toggleScoreType('visual')
      component.toggleScoreType('sound')
      
      await wrapper.vm.$nextTick()
      
      // Vérifier que les 3 types sont sélectionnés
      expect(component.localFilters.scoreTypes).toHaveLength(3)
      expect(component.localFilters.scoreTypes).toContain('general')
      expect(component.localFilters.scoreTypes).toContain('visual')
      expect(component.localFilters.scoreTypes).toContain('sound')
    })

    it('devrait désélectionner un type de critère déjà sélectionné', async () => {
      const component = wrapper.vm
      
      // Sélectionner puis désélectionner
      component.toggleScoreType('general')
      expect(component.localFilters.scoreTypes).toContain('general')
      
      component.toggleScoreType('general')
      expect(component.localFilters.scoreTypes).not.toContain('general')
    })

    it('devrait gérer l\'option includeUnscored', async () => {
      const component = wrapper.vm
      
      // Par défaut, includeUnscored devrait être true
      expect(component.localFilters.includeUnscored).toBe(true)
      
      // Changer à false
      component.setIncludeUnscored(false)
      expect(component.localFilters.includeUnscored).toBe(false)
      
      // Revenir à true
      component.setIncludeUnscored(true)
      expect(component.localFilters.includeUnscored).toBe(true)
    })

    it('devrait mettre à jour la plage de scores', async () => {
      const component = wrapper.vm
      
      // Mettre à jour la plage de scores
      component.updateScoreRange([50, 90])
      
      expect(component.localFilters.scoreRange).toEqual([50, 90])
    })

    it('devrait afficher le filtre actif pour les types de notes sélectionnés', async () => {
      const component = wrapper.vm
      
      // Sélectionner des types de critères
      component.toggleScoreType('general')
      component.toggleScoreType('visual')
      
      await wrapper.vm.$nextTick()
      
      // Vérifier que le filtre actif est affiché
      const activeFilters = component.activeFiltersList
      const scoreFilter = activeFilters.find(f => f.type === 'scoreTypes')
      
      expect(scoreFilter).toBeTruthy()
      expect(scoreFilter.count).toBe(2)
    })
  })

  describe('Filtre par date (yearRange et monthRange)', () => {
    it('devrait avoir la plage complète par défaut (pas de filtre actif)', () => {
      const component = wrapper.vm
      
      expect(component.localFilters.yearRange).toEqual([1980, 2025])
      expect(component.localFilters.monthRange).toEqual([1, 12])
    })

    it('devrait mettre à jour la plage d\'années', async () => {
      const component = wrapper.vm
      
      component.updateYearRange([1990, 2020])
      
      expect(component.localFilters.yearRange).toEqual([1990, 2020])
    })

    it('devrait mettre à jour la plage de mois', async () => {
      const component = wrapper.vm
      
      component.updateMonthRange([3, 9])
      
      expect(component.localFilters.monthRange).toEqual([3, 9])
    })

    it('devrait détecter un filtre de date actif', async () => {
      const component = wrapper.vm
      
      // Modifier la plage d'années
      component.updateYearRange([1990, 2020])
      
      await wrapper.vm.$nextTick()
      
      // Vérifier que le filtre est détecté comme actif
      const activeFilters = component.activeFiltersList
      const yearFilter = activeFilters.find(f => f.type === 'yearRange')
      
      expect(yearFilter).toBeTruthy()
    })

    it('devrait réinitialiser la plage de dates lors du clear', async () => {
      const component = wrapper.vm
      
      // Modifier la plage
      component.updateYearRange([1990, 2020])
      component.updateMonthRange([3, 9])
      
      // Réinitialiser
      component.clearFilter('yearRange')
      
      expect(component.localFilters.yearRange).toEqual([1980, 2025])
      expect(component.localFilters.monthRange).toEqual([1, 12])
    })
  })

  describe('Filtre par types de plateformes', () => {
    it('devrait permettre de sélectionner un type de plateforme', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('platformTypes', 'Console')
      
      expect(component.localFilters.platformTypes).toContain('Console')
    })

    it('devrait permettre de sélectionner plusieurs types de plateformes', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('platformTypes', 'Console')
      component.toggleArrayFilter('platformTypes', 'Microordinateur')
      component.toggleArrayFilter('platformTypes', 'Portable')
      
      expect(component.localFilters.platformTypes).toHaveLength(3)
      expect(component.localFilters.platformTypes).toContain('Console')
      expect(component.localFilters.platformTypes).toContain('Microordinateur')
      expect(component.localFilters.platformTypes).toContain('Portable')
    })

    it('devrait désélectionner un type de plateforme', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('platformTypes', 'Console')
      expect(component.localFilters.platformTypes).toContain('Console')
      
      component.toggleArrayFilter('platformTypes', 'Console')
      expect(component.localFilters.platformTypes).not.toContain('Console')
    })

    it('devrait afficher le filtre actif pour les types de plateformes', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('platformTypes', 'Console')
      component.toggleArrayFilter('platformTypes', 'Portable')
      
      await wrapper.vm.$nextTick()
      
      const activeFilters = component.activeFiltersList
      const platformFilter = activeFilters.find(f => f.type === 'platformTypes')
      
      expect(platformFilter).toBeTruthy()
      expect(platformFilter.count).toBe(2)
    })
  })

  describe('Filtre par consoles spécifiques', () => {
    it('devrait permettre de sélectionner une console', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('consoles', 'PlayStation')
      
      expect(component.localFilters.consoles).toContain('PlayStation')
    })

    it('devrait permettre de sélectionner plusieurs consoles', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('consoles', 'PlayStation')
      component.toggleArrayFilter('consoles', 'Xbox')
      component.toggleArrayFilter('consoles', 'Nintendo64')
      
      expect(component.localFilters.consoles).toHaveLength(3)
    })

    it('devrait désélectionner une console', async () => {
      const component = wrapper.vm
      
      component.toggleArrayFilter('consoles', 'PlayStation')
      expect(component.localFilters.consoles).toContain('PlayStation')
      
      component.toggleArrayFilter('consoles', 'PlayStation')
      expect(component.localFilters.consoles).not.toContain('PlayStation')
    })
  })

  describe('Réinitialisation des filtres', () => {
    it('devrait réinitialiser tous les filtres avec clearAllFilters', async () => {
      const component = wrapper.vm
      
      // Appliquer plusieurs filtres
      component.toggleArrayFilter('platformTypes', 'Console')
      component.toggleArrayFilter('consoles', 'PlayStation')
      component.toggleScoreType('general')
      component.updateYearRange([1990, 2020])
      
      // Réinitialiser tout
      component.clearAllFilters()
      
      expect(component.localFilters.platformTypes).toHaveLength(0)
      expect(component.localFilters.consoles).toHaveLength(0)
      expect(component.localFilters.scoreTypes).toHaveLength(0)
      expect(component.localFilters.yearRange).toEqual([1980, 2025])
      expect(component.localFilters.includeUnscored).toBe(true)
    })

    it('devrait réinitialiser un filtre spécifique', async () => {
      const component = wrapper.vm
      
      // Appliquer des filtres
      component.toggleArrayFilter('platformTypes', 'Console')
      component.toggleScoreType('general')
      
      // Réinitialiser seulement les types de plateformes
      component.clearFilter('platformTypes')
      
      expect(component.localFilters.platformTypes).toHaveLength(0)
      expect(component.localFilters.scoreTypes).toContain('general')
    })
  })
})

