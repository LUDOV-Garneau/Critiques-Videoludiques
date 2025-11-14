<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')
let checkedOutSeries = ref('Pays')

const typeArray = [
  "Titre",
  "TitreJeu",
  "Plateforme",
  "TypePlateforme",
  "TypeJeu",
  "Note",
  "Année",
  "Magazine",
  "Auteurs",
  "Pays",
  "CritiqueTitre",
  "PDF",
  "Consoles",
  "NoteGenerale",
  "NoteVisuelle",
  "NoteSonore",
  "NoteContenu",
  "NoteJouabilite",
  "NoteTempsJeu",
  "NoteDifficulte",
  "NotePrix",
  "NoteAutre",
  "ImageType"
];



const SeriesParameterArray = ref([])

// {
//   "Titre": "Mario Kart 64",
//   "Plateforme spécifique": "Console",
//   "Année": "-",
//   "Pays": "Canada",
//   "Auteurs": "-",
//   "Magazine": "NEdgeComputer Gaming World",
//   "_full": {
//     "Titre": "Mario Kart 64",
//     "TitreJeu": "Mario Kart 64",
//     "Plateforme": 1,
//     "TypePlateforme": "Console",
//     "TypeJeu": "Course automobile",
//     "Note": 0,
//     "Année": "-",
//     "Magazine": "NEdgeComputer Gaming World",
//     "Auteurs": "-",
//     "Pays": "Canada",
//     "CritiqueTitre": "MARIO KART 64",
//     "PDF": "N64-no-001-critiques.pdf",
//     "Consoles": "Nintendo64",
//     "NoteGenerale": 1,
//     "NoteVisuelle": 0,
//     "NoteSonore": 0,
//     "NoteContenu": 0,
//     "NoteJouabilite": 0,
//     "NoteTempsJeu": 0,
//     "NoteDifficulte": 0,
//     "NotePrix": 0,
//     "NoteAutre": 0,
//     "ImageType": "Illustration"
//   }
// }


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
  const [ArrayX, ArrayY] = dividedY(mode, select)
  ChartGeneration(ArrayX, ArrayY, type)

  
}

function erreurCharts() {

}

function ChartGeneration(arrayX01, arrayY01, type) {
  switch (type) {
    case 'line':
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
        },
        tooltip: {
    enabled: true,
    custom: function({ series, seriesIndex, dataPointIndex, w }) {
      const itemsPerColumn = 5; // Number of items per column

      let html = `<div style="
        display:flex; 
        flex-wrap: wrap; 
        max-width: 500px; 
        gap: 20px; 
        background:#222; 
        color:#fff; 
        padding:10px; 
        border-radius:5px;
      ">`;

      w.config.series.forEach((s, i) => {
        const value = s.data[dataPointIndex];

        // Start new column every `itemsPerColumn` items
        if (i % itemsPerColumn === 0) {
          html += `<div style="flex:1; min-width:140px;">`;
        }

        // Each row with wrapped text
        html += `<div style="
          white-space: normal; 
          word-wrap: break-word; 
          margin-bottom:5px;
        ">${s.name} : ${value}</div>`;

        // Close column div at end of column or last item
        if ((i + 1) % itemsPerColumn === 0 || i === w.config.series.length - 1) {
          html += `</div>`;
        }
      });

      html += `</div>`;
      return html;
    }
  }
      }
      break;
    case 'bar':
      chartSeriesFinal.value = arrayY01

      chartOptionsFinal.value = {
        chart: {
          type: type,
          height: 300,
        },
        title: {
          text: 'Nombre Critique selon Pays',
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

      break;
  }
}

function dividedY(newMode) {
  let ValeurCourante = filteredAndSorted.value[0]._full[sortKeyOptions.value]
  const ValeurUniqueOptions = [...new Set(filteredAndSorted.value.map(item => item._full[sortKeyOptions.value]))]
  const ValeurUniqueSeries = [...new Set(filteredAndSorted.value.map(item => item._full[checkedOutSeries.value]))]
  let nbOccurence = 0
  let arrayY01 = []
  let arrayX01 = []

  for (let i = 0; i < ValeurUniqueOptions.length; i++) {
    
    if (ValeurUniqueSeries.length === 1) {
      // Si 1 seul pays filtré
      if (arrayY01.length <= 0) {
        arrayY01.push({ name: ValeurUniqueSeries[0], data: [] })
      }

      nbOccurence = filteredAndSorted.value.filter(item => item._full[sortKeyOptions.value] === ValeurUniqueOptions[i]).length
      arrayY01[0].data.push(nbOccurence) // Y

      isMultipleFilter = false

    } else {
      // Plusieurs pays filtrés
      if (newMode === 'divided') {
        // SÉPARER selon choix DropDown Y

          for (let j = 0; j < ValeurUniqueSeries.length; j++) {
            if (arrayY01.length < ValeurUniqueSeries.length) {
              arrayY01.push({ name: ValeurUniqueSeries[j], data: [] })
            }
            nbOccurence = filteredAndSorted.value.filter(item => item._full[sortKeyOptions.value] === ValeurUniqueOptions[i] && item._full[checkedOutSeries.value] === ValeurUniqueSeries[j]).length
            arrayY01[j].data.push(nbOccurence)
          }

      } else {
        // COMBINER les pays filtrés
        if (arrayY01.length <= 0) {
          arrayY01.push({ name: 'Critiques', data: [] })
        }

        nbOccurence = filteredAndSorted.value.filter(item => item._full[sortKeyOptions.value] === ValeurUniqueOptions[i]).length
        arrayY01[0].data.push(nbOccurence) // Y
      }
      isMultipleFilter = true
    }

    arrayX01.push(ValeurUniqueOptions[i].toString()) // X
    // Passer à l'année suivante;
  }
  
  return [arrayX01, arrayY01]

  
}

function updateChartSpecific(newChart) {
  switch (newChart) {
    case 'line':
      sortKeyOptions.value = 'Année';

      SeriesParameterArray.value = [
        ...typeArray.slice(3, 6),
        ...typeArray.slice(7, 10),
        typeArray[12],
        typeArray[typeArray.length - 1]
      ];
      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays'
      }
      break;

    case 'bar':
      sortKeyOptions.value = 'Pays'
      SeriesParameterArray.value = typeArray.slice(12, typeArray.length - 1)
      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Consoles'
      }
      break;

    default:
      SeriesParameterArray.value = [...typeArray]

  }
}


// Initialiser le graphique au montage du composant
onMounted(() => {
  updateChartSpecific(checkedTypeCharts.value)
  updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutSeries.value)
})

watch(filteredAndSorted, () => {
  updateChartSpecific(checkedTypeCharts.value)
  updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutSeries.value)
});

watch(checkedTypeCharts, (newChart) => {
  updateChartSpecific(newChart)
  updateData(newChart, 'combine', checkedOutSeries.value)
})

watch(checkedOutData, (newMode) => {
  updateData(checkedTypeCharts.value, newMode, checkedOutSeries.value)
})

watch(checkedOutSeries, (newSelect) => {
  updateData(checkedTypeCharts.value, checkedOutData.value, newSelect)
})

</script>

<template>
  <div>
    <div>
      <!-- <div v-for="(item, index) in filteredAndSorted" :key="index">
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
      <apexchart :key="checkedTypeCharts" width="100%" height="300" :options="chartOptionsFinal"
        :series="chartSeriesFinal" />
    </div>
    <div v-if="isMultipleFilter === true">

      <select v-model="checkedOutSeries">
        <option 
          v-for="type in SeriesParameterArray"
          :key="type" 
          :value="type">
          {{ type }}
        </option>
      </select>

      <input type="radio" id="combine" name="Data" value="combine" v-model="checkedOutData" />
      <label for="combine">Combiner</label>

      <input type="radio" id="divided" name="Data" value="divided" v-model="checkedOutData" />
      <label for="divided">Diviser</label>
    </div>

  </div>
</template>