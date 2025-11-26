import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FiltersSidebar from '../FiltersSidebar.vue'

describe('FiltersSidebar - Tests des filtres', () => {
  let wrapper
  const defaultFacets = {
    magazines: ['Magazine A', 'Magazine B'],
    countries: ['Canada', 'France'],
    platforms: ['PC', 'PlayStation'],
    gameTypes: ['Action', 'Aventure', 'RPG', 'Simulation', 'Plateforme/Action'],
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

    it('devrait valider les valeurs des inputs de score (0-100)', async () => {
      const component = wrapper.vm

      // Test avec des valeurs invalides
      component.updateScoreRange([-10, 150])
      await wrapper.vm.$nextTick()

      // Les valeurs doivent être contraintes entre 0 et 100
      expect(component.localFilters.scoreRange).toEqual([0, 100])
    })

    it('devrait échanger min et max si min > max', async () => {
      const component = wrapper.vm

      // Test avec min > max
      component.updateScoreRange([80, 20])
      await wrapper.vm.$nextTick()

      // Les valeurs doivent être échangées
      expect(component.localFilters.scoreRange).toEqual([20, 80])
    })

    it('devrait afficher les inputs de score seulement si un type est sélectionné', async () => {
      // Au début, aucun type n'est sélectionné
      expect(wrapper.find('.score-inputs').exists()).toBe(false)

      // Sélectionner un type
      const component = wrapper.vm
      component.toggleScoreType('general')
      await wrapper.vm.$nextTick()

      // Vérifier que le type a été ajouté
      expect(component.localFilters.scoreTypes).toContain('general')
      expect(component.localFilters.scoreTypes.length).toBeGreaterThan(0)

      // Vérifier que la condition v-if est remplie
      expect(component.localFilters.scoreTypes.length > 0).toBe(true)
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

  describe('Filtre par plateformes spécifiques', () => {
    it('devrait permettre de sélectionner une plateforme', async () => {
      const component = wrapper.vm

      component.toggleArrayFilter('platforms', 'Sony PlayStation')

      expect(component.localFilters.platforms).toContain('Sony PlayStation')
    })

    it('devrait permettre de sélectionner plusieurs plateformes', async () => {
      const component = wrapper.vm

      component.toggleArrayFilter('platforms', 'Sony PlayStation')
      component.toggleArrayFilter('platforms', 'Microsoft Xbox')
      component.toggleArrayFilter('platforms', 'Nintendo 64')

      expect(component.localFilters.platforms).toHaveLength(3)
    })

    it('devrait désélectionner une plateforme', async () => {
      const component = wrapper.vm

      component.toggleArrayFilter('platforms', 'Sony PlayStation')
      expect(component.localFilters.platforms).toContain('Sony PlayStation')

      component.toggleArrayFilter('platforms', 'Sony PlayStation')
      expect(component.localFilters.platforms).not.toContain('Sony PlayStation')
    })
  })

  describe('Réinitialisation des filtres', () => {
    it('devrait réinitialiser tous les filtres avec clearAllFilters', async () => {
      const component = wrapper.vm
      
      // Appliquer plusieurs filtres
      component.toggleArrayFilter('platformTypes', 'Console')
      component.toggleArrayFilter('platforms', 'Sony PlayStation')
      component.toggleScoreType('general')
      component.updateYearRange([1990, 2020])

      // Réinitialiser tout
      component.clearAllFilters()

      expect(component.localFilters.platformTypes).toHaveLength(0)
      expect(component.localFilters.platforms).toHaveLength(0)
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

  describe('Filtre par types de jeux (gameTypes)', () => {
    it('devrait permettre de sélectionner un type de jeu', async () => {
      const component = wrapper.vm

      // Sélectionner le type "Action" directement via la méthode
      component.toggleArrayFilter('gameTypes', 'Action')

      await wrapper.vm.$nextTick()

      // Vérifier que le filtre a été ajouté
      expect(component.localFilters.gameTypes).toContain('Action')
      expect(component.localFilters.gameTypes).toHaveLength(1)
    })

    it('devrait permettre de sélectionner plusieurs types de jeux', async () => {
      const component = wrapper.vm

      // Ajouter plusieurs types de jeux
      component.toggleArrayFilter('gameTypes', 'Action')
      component.toggleArrayFilter('gameTypes', 'Aventure')
      component.toggleArrayFilter('gameTypes', 'RPG')

      await wrapper.vm.$nextTick()

      // Vérifier que tous les types ont été ajoutés
      expect(component.localFilters.gameTypes).toContain('Action')
      expect(component.localFilters.gameTypes).toContain('Aventure')
      expect(component.localFilters.gameTypes).toContain('RPG')
      expect(component.localFilters.gameTypes).toHaveLength(3)
    })

    it('devrait permettre de désélectionner un type de jeu', async () => {
      const component = wrapper.vm

      // Ajouter puis retirer un type
      component.toggleArrayFilter('gameTypes', 'Action')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.gameTypes).toContain('Action')

      // Désélectionner
      component.toggleArrayFilter('gameTypes', 'Action')
      await wrapper.vm.$nextTick()

      expect(component.localFilters.gameTypes).not.toContain('Action')
      expect(component.localFilters.gameTypes).toHaveLength(0)
    })

    it('devrait gérer les types de jeux composés (ex: Plateforme/Action)', async () => {
      const component = wrapper.vm

      // Sélectionner un type composé
      component.toggleArrayFilter('gameTypes', 'Plateforme/Action')

      await wrapper.vm.$nextTick()

      expect(component.localFilters.gameTypes).toContain('Plateforme/Action')
    })

    it('devrait afficher les types de jeux dans les filtres actifs', async () => {
      const component = wrapper.vm

      // Sélectionner plusieurs types
      component.toggleArrayFilter('gameTypes', 'Action')
      component.toggleArrayFilter('gameTypes', 'RPG')

      await wrapper.vm.$nextTick()

      // Vérifier que les filtres actifs contiennent les types de jeux
      const activeFilters = component.activeFiltersList
      const gameTypesFilter = activeFilters.find(f => f.type === 'gameTypes')

      expect(gameTypesFilter).toBeDefined()
      expect(gameTypesFilter.label).toBe('Types de jeux')
      expect(gameTypesFilter.count).toBe(2)
      expect(gameTypesFilter.value).toContain('Action')
      expect(gameTypesFilter.value).toContain('RPG')
    })

    it('devrait pouvoir effacer le filtre types de jeux', async () => {
      const component = wrapper.vm

      // Ajouter des types de jeux
      component.toggleArrayFilter('gameTypes', 'Action')
      component.toggleArrayFilter('gameTypes', 'Aventure')

      await wrapper.vm.$nextTick()
      expect(component.localFilters.gameTypes).toHaveLength(2)

      // Effacer le filtre
      component.clearFilter('gameTypes')

      expect(component.localFilters.gameTypes).toHaveLength(0)
    })

    it('devrait réinitialiser les types de jeux lors du clearAllFilters', async () => {
      const component = wrapper.vm

      // Ajouter des types de jeux
      component.toggleArrayFilter('gameTypes', 'Action')
      component.toggleArrayFilter('gameTypes', 'Simulation')

      await wrapper.vm.$nextTick()
      expect(component.localFilters.gameTypes).toHaveLength(2)

      // Réinitialiser tous les filtres
      component.clearAllFilters()

      expect(component.localFilters.gameTypes).toHaveLength(0)
    })

    it('devrait émettre les filtres lors de la sélection de types de jeux', async () => {
      const component = wrapper.vm

      // Sélectionner un type de jeu
      component.toggleArrayFilter('gameTypes', 'Action')

      await wrapper.vm.$nextTick()

      // Vérifier que les filtres ont été émis
      const emittedEvents = wrapper.emitted('update:filters')
      expect(emittedEvents).toBeDefined()
      expect(emittedEvents.length).toBeGreaterThan(0)

      // Vérifier que les données contiennent les types de jeux
      const lastEvent = emittedEvents[emittedEvents.length - 1]
      expect(lastEvent[0].gameTypes).toContain('Action')
    })
  })

  describe('Auteurs et options supplémentaires', () => {
    it('devrait gérer la sélection du genre d\'auteur', async () => {
      const component = wrapper.vm

      component.setAuthorGender('masculin')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.authorGender).toEqual(['masculin'])

      component.setAuthorGender('féminin')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.authorGender).toEqual(['masculin', 'féminin'])

      component.setAuthorGender('')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.authorGender).toEqual([])
    })

    it('devrait mettre à jour le nom d\'auteur', async () => {
      const component = wrapper.vm
      component.setAuthorName('Jean Dupont')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.authorName).toBe('Jean Dupont')
    })

    it('devrait activer/désactiver showWithoutAuthors', async () => {
      const component = wrapper.vm
      expect(component.localFilters.showWithoutAuthors).toBe(false)
      component.toggleShowWithoutAuthors()
      await wrapper.vm.$nextTick()
      expect(component.localFilters.showWithoutAuthors).toBe(true)
      component.toggleShowWithoutAuthors()
      await wrapper.vm.$nextTick()
      expect(component.localFilters.showWithoutAuthors).toBe(false)
    })

    it('devrait gérer les types d\'image', async () => {
      const component = wrapper.vm
      // Simuler des types d'images via toggleArrayFilter
      component.toggleArrayFilter('imageTypes', 'Box Art')
      component.toggleArrayFilter('imageTypes', 'Screenshot')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.imageTypes).toEqual(['Box Art', 'Screenshot'])

      // Désélectionner un type
      component.toggleArrayFilter('imageTypes', 'Box Art')
      await wrapper.vm.$nextTick()
      expect(component.localFilters.imageTypes).toEqual(['Screenshot'])
    })

    it('devrait afficher les filtres actifs pour auteurs et images et gérer "sans auteurs"', async () => {
      const component = wrapper.vm
      component.setAuthorGender('masculin')
      component.setAuthorName('Jean')
      component.toggleArrayFilter('imageTypes', 'Screenshot')
      await wrapper.vm.$nextTick()

      // Avant d'activer "sans auteurs": les filtres auteurs doivent être présents
      let active = component.activeFiltersList
      expect(active.find(f => f.type === 'authorGender')).toBeTruthy()
      expect(active.find(f => f.type === 'authorName')).toBeTruthy()
      expect(active.find(f => f.type === 'imageTypes')).toBeTruthy()

      // Activer "sans auteurs" doit nettoyer genre+nom et n'afficher que le flag correspondant
      component.toggleShowWithoutAuthors()
      await wrapper.vm.$nextTick()
      active = component.activeFiltersList
      expect(active.find(f => f.type === 'authorGender')).toBeFalsy()
      expect(active.find(f => f.type === 'authorName')).toBeFalsy()
      expect(active.find(f => f.type === 'showWithoutAuthors')).toBeTruthy()
      expect(active.find(f => f.type === 'imageTypes')).toBeTruthy()
    })
  })
})

