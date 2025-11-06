# Projet de l'équipe 4

---

<sub>Réalisé par : Yassine, Ludo, Divin et Nazarie</sub>


# Documentation de la pipeline CI/CD
ce document explique la pipeline CI/CD pour ce projet
la pipeline automatise le build, test, et le déploiement vers netlify en utilisant github actions

Outils:
- GitHub Actions 
- Netlify 
- Node.js 
- npm

But: chaque push sur la branche main est automatiquement testé et déployé

# Architecture de la pipeline 
workflow:
Développeur → GitHub push (dev/main) → GitHub Actions → Build + Test → Déploiement sur Netlify

Détails :
	Code source principal : /src (projet Vue.js)
	Build final : /equipe4/dist
	Tests automatisés : npm run test
	Workflow : un seul fichier .yml gère tout (build + test + deploy)

Branches :
dev → build et test uniquement pour vérifier les changements
main → build, test et déploiement en production sur netlify

# fichier test
Critiques-Videoludiques/.github/workflows/test.yml
name: Test and Build
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20' 
      - name: Clean install dependencies
        run: |
          rm -rf node_modules package-lock.json
          npm install
        working-directory: ./equipe4
      - name: Run tests
        run: npm run test
        working-directory: ./equipe4
		
		

# Build et Déploiement Netlify

Fichier Netlify : netlify.toml

[build]
  base = "equipe4"
  command = "rm -rf node_modules package-lock.json && npm install && npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

Explication
base : dossier contenant le projet (equipe4)
command : commande exécutée pour nettoyer, installer les dépendances et builder
publish : dossier à déployer (dist)
redirects : redirection pour SPA Vue.js