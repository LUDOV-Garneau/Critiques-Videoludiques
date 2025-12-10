import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Critiques from './pages/Critiques.vue'
import Guide from './pages/Guide.vue'
import NotFound from './pages/NotFound.vue'
import faviconUrl from './assets/favicon.png'
import VueApexCharts from "vue3-apexcharts";


const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'critiques', component: Critiques, meta: { title: 'Critiques - LUDOV' } },
    { path: '/critiques', redirect: '/' },
    { path: '/guide', name: 'guide', component: Guide, meta: { title: 'Guide - LUDOV' } },
    // Route 404 - doit être en dernier
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: 'Page non trouvée - LUDOV' } },
  ],
  scrollBehavior() { return { top: 0 } },
})

// Mise à jour du titre de la page selon la route
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'LUDOV - Critiques Vidéoludiques'
  next()
})

const app = createApp(App).use(router).mount('#app')
app.use(VueApexCharts);

const link = document.querySelector('link[rel="icon"]') || document.createElement('link')
link.rel = 'icon'
link.type = 'image/png'
link.href = faviconUrl
if (!link.isConnected) document.head.appendChild(link)
