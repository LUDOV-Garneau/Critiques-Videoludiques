<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')
let checkedOutOptions = ref('Année')
let checkedOutSeries = ref('Pays')

let isValideGraphsX = ref(false)
let isValideGraphsY = ref(false)

//tpp
const typeArray = [
  "Titre", // 0
  "TitreJeu", // 1
  "Plateforme", // 2
  "Modele", //3
  "TypePlateforme", //4
  "Année", //5
  "Magazine", //6
  "Auteurs", //7
  "Pays", //8
  "CritiqueTitre", //9
  "PDF", //10
  "Consoles", //11
  "ImageType",//12
  "Mois", //13
  "Volume", //14
  "Numéro", //15
  "Pages", //16
  "GenreAuteur" //17
];
let OptionsOriginalArray = []
let OptionsParameterArray = ref([])
let SeriesOriginalArray = []
let SeriesParameterArray = ref([])

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
const sortDir = ref('desc')

const filteredAndSorted = computed(() => {
  console.log("filteredAndSorted recalculated");
  let sortedItems = [...props.items];

  if (checkedOutOptions.value) {
    sortedItems = sortedItems.sort((b, a) => {
      const va = a[checkedOutOptions.value];
      const vb = b[checkedOutOptions.value];

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
  const keyX = checkedOutOptions.value;
  const keySeries = checkedOutSeries.value;
  const items = filteredAndSorted.value;

  // Fonction helper pour séparer les valeurs multiples
  const splitMultipleValues = (value) => {
    if (!value || value === '-') return [];
    return String(value)
      .split(/\s*;\s*/)  // Séparer par " ; "
      .map(v => v.trim())
      .filter(v => v);
  };

  // Initialisation
  const ValeurUniqueOptions = [...new Set(
    items.flatMap(i => splitMultipleValues(i[keyX]))
  )].sort();

  const ValeurUniqueSeries = [...new Set(
    items.flatMap(i => splitMultipleValues(i[keySeries]))
  )].sort();

  const map = Object.create(null);

  for (const item of items) {
    const valeursX = splitMultipleValues(item[keyX]);
    const valeursY = splitMultipleValues(item[keySeries]);

    // Si pas de valeurs valides, skip
    if (valeursX.length === 0 || valeursY.length === 0) continue;

    // Compter chaque combinaison X-Y
    for (const valX of valeursX) {
      if (!map[valX]) map[valX] = Object.create(null);

      for (const valY of valeursY) {
        if (!map[valX][valY]) map[valX][valY] = 0;
        // Diviser le compte par le nombre de combinaisons pour éviter le double-comptage
        map[valX][valY] += 1 / (valeursX.length * valeursY.length);
      }
    }
  }

  // Construction X et Y
  const arrayX01 = ValeurUniqueOptions.map(v => v.toString());
  const arrayY01 = [];

  if (ValeurUniqueSeries.length === 1 || mode === "combine") {
    // Combiner
    const data = ValeurUniqueOptions.map(valX => {
      const row = map[valX];
      if (!row) return 0;
      return Math.round(Object.values(row).reduce((a, b) => a + b, 0));
    });

    arrayY01.push({ name: "Critiques", data });
    isMultipleFilter = ValeurUniqueSeries.length > 1;

  } else {
    // Diviser
    for (const seriesValue of ValeurUniqueSeries) {
      const data = ValeurUniqueOptions.map(valX => {
        return Math.round(map[valX]?.[seriesValue] ?? 0);
      });

      arrayY01.push({
        name: seriesValue,
        data
      });
    }

    isMultipleFilter = true;
  }

  return [arrayX01, arrayY01];
}

function generateHeatmapData() {
  const keyX = checkedOutOptions.value;  // Année
  const keySeries = checkedOutSeries.value;  // Pays, Magazine, etc.
  const items = filteredAndSorted.value;

  // Fonction helper pour séparer les valeurs multiples
  const splitMultipleValues = (value) => {
    if (!value || value === '-') return [];
    return String(value)
      .split(/\s*;\s*/)
      .map(v => v.trim())
      .filter(v => v);
  };

  // Obtenir toutes les valeurs uniques pour X et Y
  const valeursX = [...new Set(
    items.flatMap(i => splitMultipleValues(i[keyX]))
  )].sort();
  
  const valeursY = [...new Set(
    items.flatMap(i => splitMultipleValues(i[keySeries]))
  )].sort();

  // Créer une map pour compter les occurrences
  const map = {};
  
  for (const item of items) {
    const itemValeursX = splitMultipleValues(item[keyX]);
    const itemValeursY = splitMultipleValues(item[keySeries]);

    if (itemValeursX.length === 0 || itemValeursY.length === 0) continue;

    for (const valX of itemValeursX) {
      for (const valY of itemValeursY) {
        const key = `${valY}|||${valX}`;  // Format: "Pays|||Année"
        if (!map[key]) map[key] = 0;
        map[key] += 1 / (itemValeursX.length * itemValeursY.length);
      }
    }
  }

  // Construire les séries pour le heatmap
  // Chaque série = une ligne (un pays, un magazine, etc.)
  const series = valeursY.map(valY => {
    const data = valeursX.map(valX => {
      const key = `${valY}|||${valX}`;
      return {
        x: valX.toString(),
        y: Math.round(map[key] || 0)
      };
    });

    return {
      name: valY,
      data: data
    };
  });

  return { series, categories: valeursX };
}

function ChartGeneration(arrayX01, arrayY01, type) {

  switch (type) {

    case 'line':
      isValideGraphsX = false
      isValideGraphsY = true
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
      isValideGraphsX = true
      isValideGraphsY = true
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
      isValideGraphsX = false
      isValideGraphsY = true
      // Pour pie chart, on compte la distribution du paramètre Series dans les données filtrées
      const keySeries = checkedOutSeries.value;
      const items = filteredAndSorted.value;

      // Fonction helper pour séparer les valeurs multiples (même que dans dividedY)
      const splitMultipleValues = (value) => {
        if (!value || value === '-') return [];
        return String(value)
          .split(/\s*;\s*/)  // Séparer par " ; "
          .map(v => v.trim())
          .filter(v => v);
      };

      const countMap = {};
      for (const item of items) {
        const values = splitMultipleValues(item[keySeries]); // ← Séparer les valeurs multiples

        // Compter chaque valeur séparément
        for (const value of values) {
          if (value) {
            // Diviser par le nombre de valeurs pour éviter le surcomptage
            countMap[value] = (countMap[value] || 0) + (1 / values.length);
          }
        }
      }

      // Arrondir les valeurs et trier par nom pour cohérence
      const sortedEntries = Object.entries(countMap)
        .map(([key, value]) => [key, Math.round(value)])
        .sort((a, b) => a[0].localeCompare(b[0]));

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

      case 'heatmap':
      isValideGraphsX = true
      isValideGraphsY = true
      const { series: heatmapSeries, categories: heatmapCategories } = generateHeatmapData();
      
      chartSeriesFinal.value = heatmapSeries;
      chartOptionsFinal.value = {
        chart: {
          type: 'heatmap',
          height: 450,
          toolbar: {
            show: true
          }
        },
        title: {
          text: `Heatmap: ${checkedOutSeries.value} par ${checkedOutOptions.value}`,
          align: 'left'
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 0,
            useFillColorAsStroke: false,
            colorScale: {
              ranges: [
                {
                  from: 0,
                  to: 10,
                  color: '#008FFB',
                  name: '0-10'
                },
                {
                  from: 11,
                  to: 30,
                  color: '#00E396',
                  name: '11-30'
                },
                {
                  from: 31,
                  to: 60,
                  color: '#FEB019',
                  name: '31-60'
                },
                {
                  from: 61,
                  to: 100,
                  color: '#FF4560',
                  name: '61-100'
                },
                {
                  from: 101,
                  to: 999,
                  color: '#775DD0',
                  name: '100+'
                }
              ]
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          type: 'category',
          categories: heatmapCategories,
          title: {
            text: checkedOutOptions.value
          }
        },
        yaxis: {
          title: {
            text: checkedOutSeries.value
          }
        },
        tooltip: {
          y: {
            formatter: function(value) {
              return value + ' critiques';
            }
          }
        },
        legend: {
          position: 'right',
          horizontalAlign: 'center'
        },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
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
      checkedOutOptions.value = 'Année';
      SeriesOriginalArray.value = [
        typeArray[2],
        typeArray[3],
        typeArray[4],
        typeArray[6],
        typeArray[8],
        typeArray[12],
        typeArray[13],
        typeArray[17]
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays';
      }

      SeriesParameterArray.value = [...SeriesOriginalArray.value];
      break;

    case 'bar':
      SeriesOriginalArray.value = [
        typeArray[4],
        typeArray[6],
        typeArray[8],
        typeArray[12],
        typeArray[13],
        typeArray[17]
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays';
      }

      OptionsOriginalArray.value = [...SeriesOriginalArray.value];

      if (!OptionsOriginalArray.value.includes(checkedOutOptions.value)) {
        checkedOutOptions.value = 'ImageType';
      }

      SeriesParameterArray.value = SeriesOriginalArray.value.filter(
        item => item !== checkedOutOptions.value
      );
      OptionsParameterArray.value = OptionsOriginalArray.value.filter(
        item => item !== checkedOutSeries.value
      );
      break;

    case 'pie':
      SeriesParameterArray.value = [
        typeArray[2],
        typeArray[4],
        typeArray[6],
        typeArray[8],
        typeArray[12],
        typeArray[17]
      ].sort();

      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'GenreAuteur';
      }
      break;

    case 'heatmap':
      SeriesOriginalArray.value = [
        typeArray[4],
        typeArray[6],
        typeArray[8],
        typeArray[12],
        typeArray[13],
        typeArray[17]
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Mois';
      }

      OptionsOriginalArray.value = [
        typeArray[5],
        typeArray[13]
      ].sort();

      if (!OptionsOriginalArray.value.includes(checkedOutOptions.value)) {
        checkedOutOptions.value = 'Année';
      }

      SeriesParameterArray.value = SeriesOriginalArray.value.filter(
        item => item !== checkedOutOptions.value
      );
      OptionsParameterArray.value = OptionsOriginalArray.value.filter(
        item => item !== checkedOutSeries.value
      );
      break;

    default:
      SeriesParameterArray.value = [...typeArray];
  }
}



// Initialiser le graphique au montage du composant
onMounted(() => {
  updateChartSpecific(checkedTypeCharts.value)
  updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutSeries.value)
})

watch(
  [filteredAndSorted, checkedTypeCharts, checkedOutData, checkedOutOptions, checkedOutSeries],
  () => {
    updateChartSpecific(checkedTypeCharts.value);
    updateData(
      checkedTypeCharts.value,
      checkedOutData.value,
      checkedOutSeries.value
    );
  }
);




// watch(filteredAndSorted, () => {
//   updateChartSpecific(checkedTypeCharts.value)
//   updateData(checkedTypeCharts.value, checkedOutData.value, checkedOutSeries.value)
// });

// watch(checkedTypeCharts, (newChart) => {
//   updateChartSpecific(newChart)
//   updateData(newChart, 'combine', checkedOutSeries.value)
// })

// watch(checkedOutData, (newMode) => {
//   updateData(checkedTypeCharts.value, newMode, checkedOutSeries.value)
// })

// watch(checkedOutSeries, (newSelect) => {
//   updateData(checkedTypeCharts.value, checkedOutData.value, newSelect)
// })

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

      <input type="radio" id="heatmap" name="charts" value="heatmap" v-model="checkedTypeCharts" />
      <label for="heatmap">Heatmap</label>
    </div>
    
    <div v-if="isValideGraphsY">Ligne Y
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

    <div>
      <apexchart :key="checkedTypeCharts" width="100%" height="300" :options="chartOptionsFinal"
        :series="chartSeriesFinal" />
    </div>
    
    <div v-if="isValideGraphsX">Ligne X
      <select v-model="checkedOutOptions">
        <option v-for="type in OptionsParameterArray" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

  </div>
</template>