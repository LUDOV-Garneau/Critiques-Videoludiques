<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')
let checkedOutSeries = ref('Pays')

const typeArray = [
  "Titre", // 0
  "TitreJeu", // 1
  "Plateforme", // 2
  "TypePlateforme", //3
  "TypeJeu", //4
  "Note", //5
  "Année", //6
  "Magazine", //7
  "Auteurs", //8
  "Pays", //9
  "CritiqueTitre", //10
  "PDF", //11
  "Consoles", //12
  "NoteGenerale", //13
  "NoteVisuelle", //14
  "NoteSonore", //15
  "NoteContenu",  //16
  "NoteJouabilite", //17
  "NoteTempsJeu", //18
  "NoteDifficulte", //19
  "NotePrix", //20
  "NoteAutre", //21
  "ImageType",//22
  "GenreAuteur" //23
];

const SeriesParameterArray = ref([])

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
    type: Object,
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

  // Vérification 2: Si toutes les années sont indisponibles (sauf pour pie chart)
  if (type !== 'pie') {
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
  }

  // Génération du graphique avec logique combine/divided
  const [ArrayX, ArrayY] = dividedY(mode, select)
  ChartGeneration(ArrayX, ArrayY, type)
}

function erreurCharts() {

}

function dividedY(mode) {

  const keyX = sortKeyOptions.value;
  const keySeries = checkedOutSeries.value;

  const items = filteredAndSorted.value;

  // Initialisation
  const ValeurUniqueOptions = [...new Set(items.map(i => i._full[keyX]).sort())];
  const ValeurUniqueSeries = [...new Set(items.map(i => i._full[keySeries]).sort())];

  const map = Object.create(null);

  for (const item of items) {
    const ValeursX = item._full[keyX];
    const ValeursY = item._full[keySeries];

    // skip si valeurs invalides
    if (!ValeursX || ValeursX === '-' || !ValeursY || ValeursY === '-') {
      continue;
    }

    if (!map[ValeursX]) map[ValeursX] = Object.create(null);
    if (!map[ValeursX][ValeursY]) map[ValeursX][ValeursY] = 0;

    map[ValeursX][ValeursY]++;
  }

  // Construction X et Y
  const arrayX01 = ValeurUniqueOptions.map(v => v.toString());
  const arrayY01 = [];

  if (ValeurUniqueSeries.length === 1 || mode === "combine") {

    // Combiner --> 1 seule série
    const data = ValeurUniqueOptions.map(ValeursX => {
      const row = map[ValeursX];
      if (!row) return 0;
      return Object.values(row).reduce((a, b) => a + b, 0);
    });

    arrayY01.push({ name: "Critiques", data });
    isMultipleFilter = ValeurUniqueSeries.length > 1;

  } else {

    // Diviser --> 1 série par Valeur Unique (Y)
    for (const seriesValue of ValeurUniqueSeries) {
      const data = ValeurUniqueOptions.map(ValeursX => (map[ValeursX]?.[seriesValue] ?? 0));

      arrayY01.push({
        name: seriesValue,
        data
      });
    }

    isMultipleFilter = true;
  }

  return [arrayX01, arrayY01];
}

function ChartGeneration(arrayX01, arrayY01, type) {

  switch (type) {

    case 'line':
      chartSeriesFinal.value = arrayY01;
      chartOptionsFinal.value = {
        chart: { type: 'line', height: 300 },
        title: { text: 'Nombre Critique selon Année', align: 'left' },
        xaxis: { categories: arrayX01 },
        legend: { position: 'right', horizontalAlign: 'center' },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        },
        tooltip: {
          enabled: true,
          custom: coloredTooltip(5, false)
        }
      };
      break;

    case 'bar':
      chartSeriesFinal.value = arrayY01;
      chartOptionsFinal.value = {
        chart: { type: 'bar', height: 300, stacked: true },
        title: { text: 'Nombre de critiques par année', align: 'left' },
        xaxis: { categories: arrayX01 },
        legend: { position: 'right', horizontalAlign: 'center' },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        },
        tooltip: {
          shared: true,
          intersect: false,
          enabled: true,
          custom: coloredTooltip(5, true)
        }
      };
      break;

    
    case 'pie':
      // Pour pie chart, on compte la distribution du paramètre Series dans les données filtrées
      const keySeries = checkedOutSeries.value;
      const items = filteredAndSorted.value;

      // Compter les occurrences
      const countMap = {};
      for (const item of items) {
        const value = item._full[keySeries];
        if (value && value !== '-') {
          countMap[value] = (countMap[value] || 0) + 1;
        }
      }

      // Trier par nom pour cohérence
      const sortedEntries = Object.entries(countMap).sort((a, b) => a[0].localeCompare(b[0]));
      const pieLabels = sortedEntries.map(([key]) => key);
      const pieValues = sortedEntries.map(([, value]) => value);

      chartSeriesFinal.value = pieValues;
      chartOptionsFinal.value = {
        chart: {
          type: 'pie',
          height: 300
        },
        title: {
          text: `Distribution des critiques par ${keySeries}`,
          align: 'left'
        },
        labels: pieLabels,
        legend: {
          position: 'right',
          horizontalAlign: 'center'
        },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val) {
              return val + ' critiques'
            }
          }
        }
      };
      break;

    default:
      chartSeriesFinal.value = arrayY01;
      chartOptionsFinal.value = {
        chart: { type: 'line', height: 300 },
        title: { text: 'Nombre Critique selon Année', align: 'left' },
        xaxis: { categories: arrayX01 },
        legend: { position: 'right', horizontalAlign: 'center' },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        }
      };
  }
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
      ].sort();
      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays'
      }
      break;

    case 'bar':
      sortKeyOptions.value = 'Année'
      SeriesParameterArray.value = [
        ...typeArray.slice(3, 6),
        ...typeArray.slice(7, 10),
        typeArray[12],
        typeArray[typeArray.length - 1]
      ].sort();
      break;

    case 'pie':
      
      SeriesParameterArray.value = [
        typeArray[2],  // Plateforme
        typeArray[3],  // TypePlateforme
        typeArray[7],  // Magazine
        typeArray[9],  // Pays
        typeArray[22], // ImageType
        
      ].sort();
      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays'
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

function coloredTooltip(itemsPerColumn = 5, sort = false) {
  return function ({ series, dataPointIndex, w }) {
    const itemsPerColumn = 5;

    // Initialisation
    let entries = w.config.series.map((s, i) => ({
      name: s.name,
      value: s.data[dataPointIndex],
      color: w.globals.colors[i]
    }));

    // Sorting par Nom d'attribut
    entries.sort((a, b) => a.name.localeCompare(b.name));

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

    entries.forEach((entry, i) => {
      if (i % itemsPerColumn === 0) {
        html += `<div style="flex:1; min-width:140px;">`;
      }

      html += `
        <div style="white-space: normal; word-wrap: break-word; margin-bottom:5px;">
          <strong style="color:${entry.color}">${entry.name}</strong> : ${entry.value}
        </div>
      `;

      if ((i + 1) % itemsPerColumn === 0 || i === entries.length - 1) {
        html += `</div>`;
      }
    });

    html += `</div>`;
    return html;
  }
}

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

      <input type="radio" id="pie" name="charts" value="pie" v-model="checkedTypeCharts" />
      <label for="pie">Pie</label>
    </div>
    <div>
      <apexchart :key="checkedTypeCharts" width="100%" height="300" :options="chartOptionsFinal"
        :series="chartSeriesFinal" />
    </div>
    <div v-if="isMultipleFilter === true">

      <select v-model="checkedOutSeries">
        <option v-for="type in SeriesParameterArray" :key="type" :value="type">
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