import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './pages/Home.vue'
import Critiques from './pages/Critiques.vue'
import faviconUrl from './assets/favicon.png'
import VueApexCharts from "vue3-apexcharts";



const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/critiques', name: 'critiques', component: Critiques },
  ],
  scrollBehavior() { return { top: 0 } },
})

const app = createApp(App).use(router).mount('#app')
app.use(VueApexCharts);

const link = document.querySelector('link[rel="icon"]') || document.createElement('link')
link.rel = 'icon'
link.type = 'image/png'
link.href = faviconUrl
if (!link.isConnected) document.head.appendChild(link)
