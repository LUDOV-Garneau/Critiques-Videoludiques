# Guide des Dépendances de Test

Ce document explique le fonctionnement des 3 dépendances principales utilisées pour les tests unitaires dans ce projet.

---

## 📦 Les 3 Dépendances

### 1. **Vitest** - Le Framework de Test
### 2. **@vue/test-utils** - Les Utilitaires Vue
### 3. **happy-dom** - L'Environnement DOM

---

## 1️⃣ Vitest

### Qu'est-ce que c'est?
Vitest est un **framework de test unitaire** ultra-rapide conçu spécifiquement pour les projets Vite. C'est l'équivalent moderne de Jest, mais optimisé pour Vite.

### Pourquoi Vitest?
- ⚡ **Très rapide** - Utilise le même moteur que Vite (esbuild)
- 🔄 **Hot Module Replacement (HMR)** - Les tests se re-exécutent instantanément
- 🎯 **Compatible avec Jest** - Même API que Jest (describe, it, expect)
- 📦 **Pas de configuration complexe** - Fonctionne out-of-the-box avec Vite

### Comment ça fonctionne?

#### Structure de base d'un test
```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Groupe de tests', () => {
  beforeEach(() => {
    // Code exécuté avant chaque test
  })

  it('devrait faire quelque chose', () => {
    // Arranger (Arrange) - Préparer les données
    const valeur = 2 + 2

    // Affirmer (Assert) - Vérifier le résultat
    expect(valeur).toBe(4)
  })
})
```

#### Fonctions principales

**Organisateurs:**
- `describe(nom, fonction)` - Groupe plusieurs tests ensemble
- `it(nom, fonction)` ou `test(nom, fonction)` - Définit un test individuel

**Hooks de cycle de vie:**
- `beforeEach(fonction)` - Exécuté avant chaque test
- `afterEach(fonction)` - Exécuté après chaque test
- `beforeAll(fonction)` - Exécuté une fois avant tous les tests
- `afterAll(fonction)` - Exécuté une fois après tous les tests

**Assertions (expect):**
```javascript
expect(valeur).toBe(4)                    // Égalité stricte (===)
expect(valeur).toEqual({ a: 1 })          // Égalité profonde (objets/arrays)
expect(array).toHaveLength(3)             // Longueur d'un tableau
expect(array).toContain('item')           // Contient un élément
expect(valeur).toBeTruthy()               // Valeur truthy
expect(valeur).toBeFalsy()                // Valeur falsy
expect(fonction).toThrow()                // Lance une erreur
expect(objet).toHaveProperty('key')       // A une propriété
```

### Configuration dans le projet

**vite.config.js:**
```javascript
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,           // Rend describe, it, expect globaux
    environment: 'happy-dom' // Utilise happy-dom comme environnement
  }
})
```

**package.json:**
```json
{
  "scripts": {
    "test": "vitest",              // Mode watch (re-exécution auto)
    "test:run": "vitest run",      // Exécution unique
    "test:ui": "vitest --ui"       // Interface graphique
  }
}
```

---

## 2️⃣ @vue/test-utils

### Qu'est-ce que c'est?
**@vue/test-utils** est la bibliothèque officielle pour tester les composants Vue. Elle permet de monter des composants, simuler des interactions et vérifier leur comportement.

### Pourquoi @vue/test-utils?
- 🎭 **Monte les composants** - Crée des instances de composants pour les tester
- 🖱️ **Simule les interactions** - Clics, saisies, événements
- 🔍 **Trouve les éléments** - Sélecteurs CSS, attributs, texte
- ✅ **Vérifie le rendu** - HTML généré, props, état

### Comment ça fonctionne?

#### Monter un composant
```javascript
import { mount } from '@vue/test-utils'
import MonComposant from './MonComposant.vue'

const wrapper = mount(MonComposant, {
  props: {
    titre: 'Test',
    actif: true
  }
})
```

#### Fonctions principales

**Montage:**
- `mount(composant, options)` - Monte le composant avec tous ses enfants
- `shallowMount(composant, options)` - Monte le composant sans ses enfants (stubs)

**Options de montage:**
```javascript
mount(Composant, {
  props: { titre: 'Test' },           // Props à passer
  data() { return { count: 0 } },     // État initial
  global: {
    plugins: [router, store],         // Plugins Vue
    stubs: ['RouterLink']             // Composants à stubber
  }
})
```

**Trouver des éléments:**
```javascript
wrapper.find('.ma-classe')            // Sélecteur CSS
wrapper.findAll('button')             // Tous les éléments
wrapper.findComponent(ChildComponent) // Composant enfant
wrapper.get('.ma-classe')             // Comme find, mais lance erreur si absent
```

**Interagir avec les éléments:**
```javascript
await wrapper.find('button').trigger('click')     // Déclencher un événement
await wrapper.find('input').setValue('texte')     // Définir une valeur
await wrapper.vm.$nextTick()                      // Attendre la mise à jour du DOM
```

**Accéder à l'instance Vue:**
```javascript
wrapper.vm                            // Instance du composant
wrapper.vm.maMethode()                // Appeler une méthode
wrapper.vm.maPropriete                // Accéder à une propriété
wrapper.emitted('mon-event')          // Événements émis
```

**Vérifications:**
```javascript
wrapper.exists()                      // Le wrapper existe
wrapper.isVisible()                   // L'élément est visible
wrapper.text()                        // Texte du composant
wrapper.html()                        // HTML du composant
wrapper.classes()                     // Classes CSS
wrapper.attributes('href')            // Attribut spécifique
```

### Exemple complet

```javascript
import { mount } from '@vue/test-utils'
import FiltersSidebar from '../FiltersSidebar.vue'

describe('FiltersSidebar', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(FiltersSidebar, {
      props: {
        facets: {
          magazines: ['Magazine A'],
          minYear: 1980,
          maxYear: 2025
        }
      }
    })
  })

  it('devrait afficher le titre', () => {
    expect(wrapper.text()).toContain('Filtres')
  })

  it('devrait émettre un événement au clic', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:filters')).toBeTruthy()
  })

  it('devrait appeler une méthode', () => {
    wrapper.vm.clearAllFilters()
    expect(wrapper.vm.localFilters.magazines).toHaveLength(0)
  })
})
```

---

## 3️⃣ happy-dom

### Qu'est-ce que c'est?
**happy-dom** est un **environnement DOM léger** qui simule un navigateur pour les tests. C'est une alternative plus rapide à jsdom.

### Pourquoi happy-dom?
- ⚡ **Ultra-rapide** - 2-3x plus rapide que jsdom
- 🪶 **Léger** - Moins de dépendances
- 🎯 **Suffisant pour Vue** - Implémente tout ce dont Vue a besoin
- 🔋 **Moderne** - Supporte les APIs web modernes

### Comment ça fonctionne?

Happy-dom crée un **faux navigateur** en mémoire qui permet à Vue de:
- Créer des éléments DOM (`document.createElement`)
- Manipuler le DOM (`appendChild`, `querySelector`)
- Gérer les événements (`addEventListener`, `click`)
- Utiliser les APIs web (`localStorage`, `fetch`, etc.)

### Ce que happy-dom simule

**APIs DOM:**
```javascript
document.querySelector('.ma-classe')
document.createElement('div')
element.appendChild(child)
element.addEventListener('click', handler)
```

**APIs Web:**
```javascript
window.localStorage
window.sessionStorage
window.location
window.history
```

**Événements:**
```javascript
new Event('click')
new CustomEvent('mon-event')
element.dispatchEvent(event)
```

### Configuration

Dans `vite.config.js`:
```javascript
export default defineConfig({
  test: {
    environment: 'happy-dom'  // Utilise happy-dom au lieu de node
  }
})
```

### Différence avec Node.js pur

**Sans happy-dom (Node.js):**
```javascript
// ❌ Erreur: document is not defined
const div = document.createElement('div')
```

**Avec happy-dom:**
```javascript
// ✅ Fonctionne!
const div = document.createElement('div')
div.textContent = 'Hello'
```

---

## 🔗 Comment les 3 travaillent ensemble

### Flux de travail complet

```
┌─────────────────────────────────────────────────────────┐
│  1. VITEST lance le test                                │
│     - Lit le fichier .test.js                           │
│     - Exécute describe() et it()                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. HAPPY-DOM crée l'environnement                      │
│     - Simule window, document, DOM APIs                 │
│     - Fournit un "faux navigateur"                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. @VUE/TEST-UTILS monte le composant                  │
│     - Crée une instance Vue                             │
│     - Rend le composant dans le DOM simulé              │
│     - Fournit des méthodes pour interagir               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. VITEST vérifie les assertions                       │
│     - expect() compare les valeurs                      │
│     - Rapporte succès ou échec                          │
└─────────────────────────────────────────────────────────┘
```

### Exemple concret

```javascript
// 1. VITEST organise le test
describe('FiltersSidebar', () => {
  it('devrait filtrer par console', async () => {
    
    // 2. HAPPY-DOM fournit le DOM
    // (document, window sont disponibles)
    
    // 3. @VUE/TEST-UTILS monte le composant
    const wrapper = mount(FiltersSidebar, {
      props: { facets: {...} }
    })
    
    // Le composant est rendu dans le DOM simulé
    // wrapper.vm accède à l'instance Vue
    
    // Interaction avec le composant
    wrapper.vm.toggleArrayFilter('consoles', 'PlayStation')
    await wrapper.vm.$nextTick()
    
    // 4. VITEST vérifie le résultat
    expect(wrapper.vm.localFilters.consoles).toContain('PlayStation')
  })
})
```

---

## 📚 Ressources

### Documentation officielle
- **Vitest:** https://vitest.dev/
- **@vue/test-utils:** https://test-utils.vuejs.org/
- **happy-dom:** https://github.com/capricorn86/happy-dom

### Commandes utiles

```bash
# Installer les dépendances
npm install --save-dev vitest @vue/test-utils happy-dom

# Exécuter les tests
npm test                  # Mode watch
npm run test:run          # Une seule fois
npm run test:ui           # Interface graphique

# Voir la couverture
npm test -- --coverage
```

---

## 🎯 Résumé

| Dépendance | Rôle | Analogie |
|------------|------|----------|
| **Vitest** | Framework de test | Le chef d'orchestre qui organise tout |
| **@vue/test-utils** | Utilitaires Vue | Les outils pour manipuler les composants |
| **happy-dom** | Environnement DOM | Le théâtre où se joue la pièce |

**En une phrase:**
- **Vitest** exécute les tests
- **happy-dom** simule le navigateur
- **@vue/test-utils** monte et teste les composants Vue

