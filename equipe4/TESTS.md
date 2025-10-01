# Guide des Tests Unitaires

Ce document explique comment exécuter et comprendre les tests unitaires pour le système de filtrage.

## Installation

Les dépendances de test sont déjà installées. Si vous devez les réinstaller :

```bash
npm install --save-dev vitest @vue/test-utils happy-dom
```

## Exécution des Tests

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests en mode watch (re-exécution automatique)
```bash
npm test
```

### Exécuter les tests une seule fois
```bash
npm run test:run
```

### Exécuter les tests avec l'interface UI (optionnel)
```bash
npm run test:ui
```

## Structure des Tests

### 1. Tests du composant FiltersSidebar
**Fichier:** `src/components/__tests__/FiltersSidebar.test.js`

Ces tests vérifient le comportement du composant de filtrage :

#### Filtre par notes (scoreTypes)
- ✅ Sélection d'un type de critère
- ✅ Sélection multiple de types de critères
- ✅ Désélection d'un type de critère
- ✅ Gestion de l'option `includeUnscored`
- ✅ Mise à jour de la plage de scores
- ✅ Affichage des filtres actifs

#### Filtre par date
- ✅ Plage complète par défaut (pas de filtre actif)
- ✅ Mise à jour de la plage d'années
- ✅ Mise à jour de la plage de mois
- ✅ Détection d'un filtre de date actif
- ✅ Réinitialisation de la plage de dates

#### Filtre par types de plateformes
- ✅ Sélection d'un type de plateforme
- ✅ Sélection multiple de types
- ✅ Désélection d'un type
- ✅ Affichage des filtres actifs

#### Filtre par consoles spécifiques
- ✅ Sélection d'une console
- ✅ Sélection multiple de consoles
- ✅ Désélection d'une console

#### Réinitialisation
- ✅ Réinitialisation de tous les filtres
- ✅ Réinitialisation d'un filtre spécifique

### 2. Tests de la logique de filtrage
**Fichier:** `src/pages/__tests__/Critiques.filters.test.js`

Ces tests vérifient la logique de filtrage des données :

#### Filtre par types de notes
- ✅ Filtrage par critères généraux avec plage de scores
- ✅ Inclusion des critiques sans note
- ✅ Filtrage par critères visuels
- ✅ Filtrage par critères sonores

#### Filtre par types de plateformes
- ✅ Filtrage par type Console
- ✅ Filtrage par type Microordinateur
- ✅ Filtrage par plusieurs types

#### Filtre par consoles spécifiques
- ✅ Filtrage par PlayStation
- ✅ Filtrage par Nintendo64
- ✅ Filtrage par plusieurs consoles (logique OR)

#### Filtre par date
- ✅ Filtrage par plage d'années
- ✅ Filtrage par plage de mois
- ✅ Combinaison année + mois

#### Combinaisons de filtres
- ✅ Type de plateforme + console
- ✅ Date + score

## Données de Test

Les tests utilisent des données mockées qui simulent la structure du fichier Excel :

### Structure des critiques de test

**Jeu A:**
- Type: Console (PlayStation)
- Année: 2020, Mois: 5
- Critères généraux: 75

**Jeu B:**
- Type: Microordinateur (PC)
- Année: 2015, Mois: 8
- Critères visuels: 80

**Jeu C:**
- Type: Console (Nintendo64)
- Année: 2000, Mois: 12
- Critères sonores: 60

**Jeu D:**
- Type: Portable (GameBoy)
- Année: 1995, Mois: 3
- Sans notes de critères

## Comprendre les Résultats

### Succès ✅
```
✓ src/components/__tests__/FiltersSidebar.test.js (25)
✓ src/pages/__tests__/Critiques.filters.test.js (18)

Test Files  2 passed (2)
Tests  43 passed (43)
```

### Échec ❌
Si un test échoue, vous verrez :
```
❌ devrait filtrer par critères généraux
  Expected: 1
  Received: 0
```

Cela indique que le filtre ne fonctionne pas comme prévu.

## Ajouter de Nouveaux Tests

Pour ajouter un nouveau test :

```javascript
it('devrait faire quelque chose de spécifique', async () => {
  const component = wrapper.vm
  
  // Arranger - Préparer les données
  component.toggleScoreType('general')
  
  // Agir - Exécuter l'action
  await wrapper.vm.$nextTick()
  
  // Affirmer - Vérifier le résultat
  expect(component.localFilters.scoreTypes).toContain('general')
})
```

## Couverture de Code (Optionnel)

Pour voir la couverture de code :

```bash
npm test -- --coverage
```

## Bonnes Pratiques

1. **Exécutez les tests avant de commiter** : `npm run test:run`
2. **Gardez les tests simples** : Un test = Une fonctionnalité
3. **Nommez clairement** : Le nom du test doit décrire ce qu'il teste
4. **Testez les cas limites** : Valeurs nulles, tableaux vides, etc.

## Dépannage

### Les tests ne s'exécutent pas
- Vérifiez que les dépendances sont installées : `npm install`
- Vérifiez la configuration dans `vite.config.js`

### Erreurs de module
- Assurez-vous que tous les imports sont corrects
- Vérifiez que les chemins relatifs sont bons

### Tests qui passent localement mais échouent en CI
- Vérifiez les différences d'environnement
- Assurez-vous que les données de test sont cohérentes

## Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Documentation Vue Test Utils](https://test-utils.vuejs.org/)
- [Guide de test Vue.js](https://vuejs.org/guide/scaling-up/testing.html)

