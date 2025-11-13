<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')
let checkedOutType = ref('Pays')

const typeArray = [
  'TypeImageUtilise',
  'TitreJeu',
  'Plateforme',
  'TypePlateforme',
  'TypeJeu',
  'Note',
  'Année',
  'Magazine',
  'Auteurs',
  'Pays',
];

// const typeArray = [
//   'TypeImageUtilise',
//   'TitreJeu',
//   'Plateforme',
//   'TypePlateforme',
//   'TypeJeu',
//   'Note',
//   'Année',
//   'Magazine',
//   'Auteurs',
//   'Pays',
//   'CritiqueTitre',
//   'PDF',
//   'NoteGenerale',
//   'NoteVisuelle',
//   'NoteSonore',
//   'NoteContenu',
//   'NoteJouabilite',
//   'NoteTempsJeu',
//   'NoteDifficulte',
//   'NotePrix',
//   'NoteAutre'
// ];






// FiltreActifs {
// magazines: [],
// countries: [],
// platformTypes: [],
// consoles: [],
// gameTypes: [],
// imageTypes: [],
// authorGender: '',
// authorName: '',
// showWithoutAuthors: false,
// yearRange: [1980, 2025],
// monthRange: [1, 12],
// scoreTypes: [],
// scoreRange: [0, 100],
// includeUnscored: true
// }

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  filtreActifs: {
    type: Array,
    required: false
  }
})

let isMultipleFilter = false
const sortKeyOptions = ref('Année')
const sortKeySeries = ref('Pays')
const sortDir = ref('desc')

const filteredAndSorted = computed(() => {
  console.log("filteredAndSorted recalculated");
  let sortedItems = [...props.items];

  if (sortKeyOptions.value) {
    sortedItems = sortedItems.sort((b, a) => {
      const va = a[sortKeyOptions.value];
      const vb = b[sortKeyOptions.value];

      if (va === '-' && vb !== '-') return 1;
      if (vb === '-' && va !== '-') return -1;

      const na = Number(va);
      const nb = Number(vb);
      const bothNum = !Number.isNaN(na) && !Number.isNaN(nb);
      const cmp = bothNum ? (na - nb) : String(va ?? '').localeCompare(String(vb ?? ''));

      return sortDir.value === 'asc' ? cmp : -cmp;
    });
  }

  return sortedItems;
});

const allPays = computed(() => [...new Set(filteredAndSorted.value.map(item => item.Pays))]);

// Initialisation avec des données par défaut
let chartOptionsFinal = ref({
  chart: {
    type: 'line',
    height: 300,
  },
  title: {
    text: 'Nombre Critique selon Année',
    align: 'left'
  },
  xaxis: {
    categories: []
  },
  noData: {
    text: 'Donnée indisponible',
    align: 'center',
    verticalAlign: 'middle',
    style: {
      fontSize: '16px',
      color: '#999'
    }
  }
})

let chartSeriesFinal = ref([{
  name: 'Critiques',
  data: []
}])

const apexchart = ApexChart;

const updateData = (type, mode, select) => {
  // Vérification 1: S'il n'y a aucune donnée
  if (!filteredAndSorted.value || filteredAndSorted.value.length === 0) {
    chartSeriesFinal.value = [{
      name: 'Critiques',
      data: []
    }]
    chartOptionsFinal.value = {
      ...chartOptionsFinal.value,
      chart: {
        type: type,
        height: 300,
      },
      xaxis: {
        categories: []
      },
      noData: {
        text: 'Aucune donnée disponible',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          fontSize: '16px',
          color: '#999'
        }
      }
    }
    isMultipleFilter = false
    return;
  }

  // Vérification 2: Si toutes les années sont indisponibles
  const hasValidYear = filteredAndSorted.value.some(item =>
    item.Année && item.Année !== '-'
  );

  if (!hasValidYear) {
    chartSeriesFinal.value = [{
      name: 'Critiques',
      data: []
    }]
    chartOptionsFinal.value = {
      ...chartOptionsFinal.value,
      chart: {
        type: type,
        height: 300,
      },
      xaxis: {
        categories: []
      },
      noData: {
        text: 'Aucune année disponible pour générer le graphique',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          fontSize: '14px',
          color: '#999'
        }
      }
    }
    isMultipleFilter = false
    return;
  }

  // Génération du graphique avec logique combine/divided



  chartSeriesFinal.value = arrayY01

  chartOptionsFinal.value = { 
    chart: {
      type: type,
      height: 300,
    },
    title: {
      text: 'Nombre Critique selon Année',
      align: 'left'
    },
    xaxis: {
      categories: arrayX01
    },
    noData: {
      text: 'Donnée indisponible',
      align: 'center',
      verticalAlign: 'middle',
      style: {
        fontSize: '16px',
        color: '#999'
      }
    }
  }
}

function ChartLine() {

}

function ChartBar() {

}

function dividedY(newSelect) {
let ValeurXCourante = filteredAndSorted.value[0][sortKey.value]
  const ValeurMax = filteredAndSorted.value[filteredAndSorted.value.length - 1][sortKey.value]
  let nbOccurence = 0
  let arrayY01 = []
  let arrayX01 = []
  let filtres = props.filtreActifs

  while(ValeurXCourante === '-' || ValeurXCourante !== '?') {
    arrayX01.push(anneeCourante.toString()) // X


    let maxFiltrePays = filtres.countries.length
    
    // Si plusieurs Pays
     arrayY01[0].data.push(dividedY(maxFiltrePays)) // Y

    // Passer à l'année suivante
    if (anneeCourante === '-') {
      const nextItem = filteredAndSorted.value.find(item => item.Année !== '-')
      if (nextItem === undefined) {
        anneeCourante = "?"
      } else {
        anneeCourante = nextItem.Année
      }
    } else {
      anneeCourante++
    }
  }



switch (maxFiltrePays) {
      case 0:
        // Aucun filtre pays actif
        if (mode === 'divided') {
          // SÉPARER par pays
          if (arrayY01.length <= 0) {
            for (let i = 0; i < allPays.value.length; i++) {
              arrayY01.push({ name: allPays.value[i], data: [] })
            }
          }
          for (let i = 0; i < allPays.value.length; i++) {
            nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante && item.Pays === allPays.value[i]).length
            arrayY01[i].data.push(nbOccurence)
          }
        } else {
          // COMBINER tous les pays
          if (arrayY01.length <= 0) { 
            arrayY01.push({ name: 'Critiques', data: [] })
          }

          nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante).length
          arrayY01[0].data.push(nbOccurence) // Y
        }
        isMultipleFilter = allPays.value.length > 1
        break;

      case 1:
        // Si 1 seul pays filtré
        if (arrayY01.length <= 0) { 
          arrayY01.push({ name: filtres.countries[0], data: [] })
        }

        nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante && item.Pays === filtres.countries[0]).length
        arrayY01[0].data.push(nbOccurence) // Y

        isMultipleFilter = false
        break;

      default:
        // Plusieurs pays filtrés
        if (mode === 'divided') {
          // SÉPARER par pays filtrés
          if (arrayY01.length <= 0) {
            for (let i = 0; i < maxFiltrePays; i++) {
              arrayY01.push({ name: filtres.countries[i], data: [] })
            }
          }
          for (let i = 0; i < maxFiltrePays; i++) {
            nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante && item.Pays === filtres.countries[i]).length
            arrayY01[i].data.push(nbOccurence)
          }
        } else {
          // COMBINER les pays filtrés
          if (arrayY01.length <= 0) { 
            arrayY01.push({ name: 'Critiques', data: [] })
          }

          nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante).length
          arrayY01[0].data.push(nbOccurence) // Y
        }
        isMultipleFilter = true
        break;
    }

    return nbOccurence
}

function updateSortKeyOptions(newType) {
  switch(newType) {
    case 'line':
      sortKeyOptions.value = 'Année'
    break;

    case 'bar':
      sortKeyOptions.value = 'Pays'
      break;

      default:


  }
}


// Initialiser le graphique au montage du composant
onMounted(() => {
  updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutType.value)
})

watch(filteredAndSorted, () => {
  updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutType.value)
});

watch(checkedTypeCharts, (newType) => {
  updateSortKeyOptions(newType)
  updateData(newType, 'combine', checkedOutType.value)
})

watch(checkedOutData, (newMode) => {
  updateData(checkedTypeCharts.value, newMode, checkedOutType.value)
})

watch(checkedOutType, (newSelect) => {
  updateData(checkedTypeCharts.value, checkedOutData.value, newSelect)
})

</script>

<template>
  <div>
    <div>
      <!-- <div v-for="(item, index) in listCritique" :key="index">
        {{ item }}
      </div> -->
      <div>Type de graphique</div>
      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" checked />
      <label for="line">Ligne du Temps</label>

      <input type="radio" id="bar" name="charts" value="bar" v-model="checkedTypeCharts" />
      <label for="bar">Barres</label>

      <input type="radio" id="scatter" name="charts" value="scatter" v-model="checkedTypeCharts" />
      <label for="scatter">Nuage de points</label>
    </div>
    <div>
      <apexchart 
      :key="checkedTypeCharts" 
      width="100%" 
      height="300" 
      :options="chartOptionsFinal"
      :series="chartSeriesFinal" />
    </div>
    <div v-if="isMultipleFilter === true">

    <select v-model="checkedOutType">
      <option 
        v-for="type in typeArray" 
        :key="type" 
        :id="type" 
        :value="type"
      >
        {{ type }}
      </option>
    </select>

      <input type="radio" id="combine" name="Data" value="combine" v-model="checkedOutData"/>
      <label for="combine">Combiner</label>

      <input type="radio" id="divided" name="Data" value="divided" v-model="checkedOutData" />
      <label for="divided">Diviser</label>
    </div>
    
  </div>
</template>