<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')
let checkedOutOptions = ref('Année')
let checkedOutSeries = ref('Pays')
let histogramBinSize = ref(5)

const emit = defineEmits(['chart-click'])


let isValideGraphsX = ref(false)
let isValideGraphsY = ref(false)

// const typeArray = [
//   "Titre", // 0
//   "TitreJeu", // 1
//   "Plateforme", // 2
//   "Modele", //3
//   "TypePlateforme", //4
//   "Année", //5
//   "Magazine", //6
//   "Auteurs", //7
//   "Pays", //8
//   "CritiqueTitre", //9
//   "PDF", //10
//   "Consoles", //11
//   "ImageType",//12
//   "Mois", //13
//   "Volume", //14
//   "Numéro", //15
//   "Pages", //16
//   "GenreAuteur" //17
// ];

const typeArray = [
  "ImageType",          // 0
  "TitreJeu",           // 1
  "Plateforme",         // 2
  "Modele",             // 3
  "TypePlateforme",     // 4
  "Genre",              // 5
  "Note",               // 6
  "Année",              // 7
  "Magazine",           // 8
  "Auteurs",            // 9
  "GenreAuteur",        // 10
  "Pays",               // 11
  "CritiqueTitre",      // 12
  "PDF",                // 13
  "NoteGenerale",       // 14
  "NoteVisuelle",       // 15
  "NoteSonore",         // 16
  "NoteContenu",        // 17
  "NoteJouabilite",     // 18
  "NoteTempsJeu",       // 19
  "NoteDifficulte",     // 20
  "NotePrix",           // 21
  "NoteAutre",          // 22
  "Mois",               // 23
  "Volume",             // 24
  "Numéro",             // 25
  "Page",               // 26
  "NombrePages"         // 27

];



let OptionsOriginalArray = []
let OptionsParameterArray = ref([])
let SeriesOriginalArray = []
let SeriesParameterArray = ref([])

// const sidebarFilters = ref({
//   magazines: [],
//   countries: [],
//   platformTypes: [],
//   platforms: [],
//   gameTypes: [],
//   gameTypesLogic: 'OU', // Ajout de la logique ET/OU pour les types de jeux
//   imageTypes: [],
//   authorGender: '',
//   authorCharacteristics: [],
//   authorName: '',
//   showWithoutAuthors: false,
//   yearRange: [1980, 2025],
//   monthRange: [1, 12],
//   scoreTypes: [],
//   scoreRange: [0, 100],
//   includeUnscored: true
// })


const months = [
  "1 (janvier)",
  "2 (février)",
  "3 (mars)",
  "4 (avril)",
  "5 (mai)",
  "6 (juin)",
  "7 (juillet)",
  "8 (août)",
  "9 (septembre)",
  "10 (octobre)",
  "11 (novembre)",
  "12 (décembre)"
];


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
const sortDir = ref('desc')

let clickIndexOptions = ref(-1)
let clickIndexSeries = ref(-1)
let clickNameOptions = ref("")
let clickNameSeries = ref("")

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

  // Vérification 2: Si toutes les années sont indisponibles (sauf pour pie, treemap et histogram)
  if (type !== 'pie' && type !== 'treemap' && type !== 'histogram') {
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
  if (type === 'histogram') {
    const histoData = generateHistogramData();
    ChartGeneration(histoData.categories, histoData.series, type);
    return;
  }

  const [ArrayX, ArrayY] = dividedY(mode, select)
  ChartGeneration(ArrayX, ArrayY, type)
}

function erreurCharts() {

}

// Helper pour fix le sort (fix "1, 10, 2" dans l'ordre du mois)
const naturalSort = (a, b) => {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

// Fonction helper pour séparer les valeurs multiples
const splitMultipleValues = (value) => {
  if (!value || value === '-') return [];
  return String(value)
    .split(/\s*;\s*/)  // Séparer par " ; "
    .map(v => v.trim())
    .filter(v => v);
};
const splitMultipleValuesGenre = (value) => {
  if (!value || value === '-') return [];
  return String(value)
    .split(/\s*,\s*/)  // Séparer par " , "
    .map(v => v.trim())
    .filter(v => v);
};

function dividedY(mode) {
  const keyX = checkedOutOptions.value;
  const keySeries = checkedOutSeries.value;
  const items = filteredAndSorted.value;



  // Initialisation
  const ValeurUniqueOptions = limiteGraphs(items, keyX)

  // BUG FIXES
  const ValeurUniqueSeries = limiteGraphs(items, keySeries)

  const map = Object.create(null);

  for (const item of items) {
    const valeursX = splitMultipleValues(item[keyX]);

    let valeursY = []
    if (checkedOutSeries.value === "Genre") {
    valeursY = splitMultipleValuesGenre(item[keySeries]);
    } else {
    valeursY = splitMultipleValues(item[keySeries]);
    }


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

  if (mode === "combine") {
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

function sameValuesIgnoringOrder(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);

  if (setA.size !== setB.size) return false;

  for (const val of setA) {
    if (!setB.has(val)) return false;
  }
  return true;
}

// Cas si plusieures parametres sont possible (ex. Plateforme)
function limiteGraphs(items, parameter) {
  let ValeursUniques = []
  let ValeursTrier = []

  const test = props.filtreActifs
  let critereSelectionner = []

  switch (parameter) {
    case "Plateforme": //
      critereSelectionner = test.platforms
      break;
    case "TypePlateforme": //
      critereSelectionner = test.platformTypes
      break;
    case "TypeImageUtilise": //
      critereSelectionner = test.imageTypes
      break;
    case "Genre": //
      critereSelectionner = test.gameTypes
      break;
    case "GenreAuteur": // Probleme avec le La lettre majuscule
      function capitalizeFirstLetter(str) {
        if (!str) return "";
        str = str.toString().toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      if (test.authorGender === "") {
        critereSelectionner = []
      } else {
        critereSelectionner.push(capitalizeFirstLetter(test.authorGender));
      } 


      break;
    default:
      critereSelectionner = []
      break;
  }

 if (parameter === "Genre") {
  ValeursTrier = [...new Set(
    items.flatMap(i => splitMultipleValuesGenre(i[parameter]))
  )].sort(naturalSort);
 } else {
  ValeursTrier = [...new Set(
    items.flatMap(i => splitMultipleValues(i[parameter]))
  )].sort(naturalSort);
 }

  if (critereSelectionner.length > 0 ) {
    ValeursUniques = critereSelectionner
  } else {
    ValeursUniques = ValeursTrier
  }

  return ValeursUniques
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
  )].sort(naturalSort);

  const valeursY = [...new Set(
    items.flatMap(i => splitMultipleValues(i[keySeries]))
  )].sort(naturalSort);

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

// logique du histogramme basée sur la taille d'intervalle (années)
function generateHistogramData() {
  const items = filteredAndSorted.value;
  const minYear = 1981;
  const maxYear = 2021;

  // On récupère la taille du saut (ex: 2 ans, 5 ans)
  const step = parseInt(histogramBinSize.value) || 5;

  // Calcul dynamique du nombre de buckets nécessaires
  const totalRange = maxYear - minYear;
  const binCount = Math.ceil(totalRange / step) + 1; // +1 pour être sûr de couvrir le maxYear si pas diviseur exact

  // Helper pour séparer les valeurs multiples
  const splitMultipleValues = (value) => {
    if (!value || value === '-') return [];
    return String(value).split(/\s*;\s*/).map(v => v.trim()).filter(v => v);
  };

  // Préparer les catégories (Labels des Bins)
  let categories = [];
  for (let i = 0; i < binCount; i++) {
    let start = minYear + (i * step);
    let end = start + step;

    // Si step = 1, on affiche juste l'année. Sinon "1981-1983"
    let label = (step === 1) ? `${start}` : `${start}-${end - 1}`;
    categories.push(label);
  }

  // Si mode "Combiné" ou pas de série sélectionnée
  if (checkedOutData.value === 'combine') {
    let counts = new Array(binCount).fill(0);
    for (const item of items) {
      const valYear = parseInt(item.Année);
      if (isNaN(valYear) || valYear < minYear || valYear > maxYear) continue;

      // Calcul index
      let index = Math.floor((valYear - minYear) / step);
      // Sécurité
      if (index >= binCount) index = binCount - 1;
      if (index < 0) index = 0;

      counts[index]++;
    }
    return { categories, series: [{ name: 'Fréquence', data: counts }] };
  }

  // mode divisé : sépare par la valeur Y
  const keySeries = checkedOutSeries.value;
  const seriesMap = {};

  for (const item of items) {
    const valYear = parseInt(item.Année);
    if (isNaN(valYear) || valYear < minYear || valYear > maxYear) continue;

    let binIndex = Math.floor((valYear - minYear) / step);
    if (binIndex >= binCount) binIndex = binCount - 1;
    if (binIndex < 0) binIndex = 0;

    const seriesValues = splitMultipleValues(item[keySeries]);

    if (seriesValues.length === 0) continue;

    for (const valY of seriesValues) {
      if (!seriesMap[valY]) {
        seriesMap[valY] = new Array(binCount).fill(0);
      }
      seriesMap[valY][binIndex] += 1 / seriesValues.length;
    }
  }

  const finalSeries = Object.entries(seriesMap).map(([name, data]) => ({
    name: name,
    data: data.map(d => Math.round(d))
  })).sort((a, b) => a.name.localeCompare(b.name));

  return { categories, series: finalSeries };
}

function ChartGeneration(arrayX01, arrayY01, type) {

  switch (type) {

    case 'line':
      isValideGraphsX = false
      isValideGraphsY = true
      chartSeriesFinal.value = arrayY01;
      chartOptionsFinal.value = {
        chart: {
          type: 'line',
          height: 300,
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
          }
        },
        title: { text: 'Nombre de critiques selon Année', align: 'left' },
        xaxis: { categories: arrayX01 },
        legend: { position: 'right', horizontalAlign: 'center' },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        },
        tooltip: {
          shared: false, intersect: true,
          enabled: true,
          custom: coloredTooltip(5, false)
        },
        markers: { size: 5 }
      };
      break;

    case 'bar':
      isValideGraphsX = true
      isValideGraphsY = true
      chartSeriesFinal.value = arrayY01
      chartOptionsFinal.value = {
        chart: {
          type: 'bar', height: 300, stacked: true,
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
          }
        },
        title: { text: `Nombre de critiques par ${checkedOutOptions.value}`, align: 'left' },
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

    case 'histogram':
      isValideGraphsX = false
      isValideGraphsY = true

      chartSeriesFinal.value = arrayY01;

      chartOptionsFinal.value = {
        chart: {
          type: 'bar',
          height: 300,
          stacked: true,
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '98%',
            borderRadius: 0
          }
        },
        dataLabels: {
          enabled: false
        },
        title: { text: `Histogramme (Intervalle: ${histogramBinSize.value} ans) par ${checkedOutSeries.value}`, align: 'left' },
        xaxis: {
          categories: arrayX01,
          title: { text: 'Périodes (Années)' }
        },
        yaxis: {
          title: { text: 'Nombre' }
        },
        legend: {
          show: true,
          position: 'right'
        },
        noData: {
          text: 'Donnée indisponible',
          align: 'center',
          style: { fontSize: '16px', color: '#999' }
        },
        tooltip: {
          shared: true,
          intersect: false,
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
        .sort((a, b) => naturalSort(a[0], b[0]));

      const pieLabels = sortedEntries.map(([key]) => key);
      const pieValues = sortedEntries.map(([, value]) => value);

      chartSeriesFinal.value = pieValues;
      chartOptionsFinal.value = {
        chart: {
          type: 'pie',
          height: 300,
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
          }
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

    case 'treemap':
      isValideGraphsX = false
      isValideGraphsY = true
      const keySeriesTM = checkedOutSeries.value;
      const itemsTM = filteredAndSorted.value;

      const splitValuesTM = (value) => {
        if (!value || value === '-') return [];
        return String(value).split(/\s*;\s*/).map(v => v.trim()).filter(v => v);
      };

      const countMapTM = {};
      for (const item of itemsTM) {
        const values = splitValuesTM(item[keySeriesTM]);
        for (const value of values) {
          if (value) {
            countMapTM[value] = (countMapTM[value] || 0) + (1 / values.length);
          }
        }
      }

      const tmData = Object.entries(countMapTM)
        .map(([key, value]) => ({
          x: key,
          y: Math.round(value)
        }))
        .sort((a, b) => b.y - a.y);

      chartSeriesFinal.value = [{ data: tmData }];
      chartOptionsFinal.value = {
        chart: {
          type: 'treemap',
          height: 300,
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
          }
        },
        title: {
          text: `Treemap: ${keySeriesTM}`,
          align: 'left'
        },
        legend: {
          show: true
        },
        colors: [
          '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
          '#3F51B5', '#546E7A', '#D4526E', '#8D5B4C', '#F86624'
        ],
        plotOptions: {
          treemap: {
            distributed: true,
            enableShades: false
          }
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
          },
          events: {
            dataPointSelection: (e, chart, opts) => {
              customClick(e, chart, opts)
            }
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
                  to: 0,
                  color: '#799EB2',
                  name: '0'
                },
                {
                  from: 1,
                  to: 10,
                  color: '#008FFB',
                  name: '1-10'
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
            formatter: function (value) {
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
        typeArray[0], // TypeImage
        typeArray[2], // Plateforme
        typeArray[4], // TypePlateforme
        typeArray[5], // TypeJeu
        typeArray[8], // Magazine
        typeArray[10], // GenreAuteur
        typeArray[11], // Pays 
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays';
      }
      SeriesParameterArray.value = [...SeriesOriginalArray.value];
      break;

    case 'bar':
      SeriesOriginalArray.value = [
        typeArray[0], // Type d'image
        typeArray[2], // Plateforme 
        typeArray[4], // TypePlateforme
        typeArray[5], // TypeJeu
        typeArray[8], // Magazine
        typeArray[10], // GenreAuteur
        typeArray[11], // Pays
        typeArray[23] // Mois
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays';
      }

      OptionsOriginalArray.value = [...SeriesOriginalArray.value];

      if (!OptionsOriginalArray.value.includes(checkedOutOptions.value)) {
        checkedOutOptions.value = 'ImageType';
      }

      if (checkedOutOptions.value === checkedOutSeries.value) {
        checkedOutOptions.value = 'ImageType'
        checkedOutSeries.value = 'Pays'
      }

      SeriesParameterArray.value = SeriesOriginalArray.value.filter(
        item => item !== checkedOutOptions.value
      );
      OptionsParameterArray.value = OptionsOriginalArray.value.filter(
        item => item !== checkedOutSeries.value
      );
      break;

    case 'pie':
    case 'treemap':
      SeriesParameterArray.value = [
        typeArray[0], // Type Image
        typeArray[2], // Plateforme
        typeArray[4], // Type plateforme
        typeArray[8], // Magazine
        typeArray[10], // GenreAuteur
        typeArray[11], // Pays
        typeArray[23] // Mois

      ].sort();

      if (!SeriesParameterArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'GenreAuteur';
      }
      break;

    case 'heatmap':
      SeriesOriginalArray.value = [
        typeArray[0], // Type Image
        typeArray[4], // Type plateforme
        typeArray[7], // Année
        typeArray[8], // Magazine
        typeArray[10], // GenreAuteur
        typeArray[11], // Pays
        typeArray[23] // Mois
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Mois';
      }

      OptionsOriginalArray.value = [
        typeArray[7], // Année
        typeArray[23] // Mois
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

    // Configuration Histogramme
    case 'histogram':
      SeriesOriginalArray.value = [
        typeArray[0], // ImageType
        typeArray[4], // TypePlateforme
        typeArray[8], // Magazine
        typeArray[10],  // GenreAuteur
        typeArray[11], // Pays
        typeArray[23] // Mois
      ].sort();

      if (!SeriesOriginalArray.value.includes(checkedOutSeries.value)) {
        checkedOutSeries.value = 'Pays';
      }

      SeriesParameterArray.value = [...SeriesOriginalArray.value];
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
  [filteredAndSorted, checkedTypeCharts, checkedOutData, checkedOutOptions, checkedOutSeries, histogramBinSize],
  () => {
    updateChartSpecific(checkedTypeCharts.value);
    updateData(
      checkedTypeCharts.value,
      checkedOutData.value,
      checkedOutSeries.value
    );
    clickIndexOptions.value = -1
    clickIndexSeries.value = -1
    clickNameOptions.value = ""
    clickNameSeries.value = ""
    emit('chart-click', {
      indexX: clickIndexOptions.value,
      indexY: clickIndexSeries.value,
      nameX: clickNameOptions.value,
      nameY: clickNameSeries.value
    })
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
    let entries = w.config.series.map((s, i) => ({
      name: s.name,
      value: s.data[dataPointIndex],
      color: w.globals.colors[i]
    }));

    //enleve si value est 0 ou null
    entries = entries.filter(entry => entry.value !== null && entry.value > 0);

    // si pas de data return empty string
    if (entries.length === 0) return '';

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

function customClick(e, chart, opts) {
  clickIndexOptions.value = opts.dataPointIndex
  clickIndexSeries.value = opts.seriesIndex

  switch (checkedTypeCharts.value) {
    case 'line':
      clickNameOptions.value = opts.w.globals.categoryLabels[clickIndexOptions.value];
      clickNameSeries.value = opts.w.config.series[clickIndexSeries.value].name;
      break;
    case 'bar':
    case 'heatmap':
      clickNameOptions.value = chartOptionsFinal.value.xaxis.categories[clickIndexOptions.value];
      clickNameSeries.value = opts.w.config.series[clickIndexSeries.value].name;
      break;
    case 'histogram':
      clickNameOptions.value = chartOptionsFinal.value.xaxis.categories[clickIndexOptions.value];
      if (opts.w.config.series[clickIndexSeries.value]) {
        clickNameSeries.value = opts.w.config.series[clickIndexSeries.value].name;
      } else {
        clickNameSeries.value = "Total";
      }
      break;
    case 'pie':
      clickNameOptions.value = opts.w.config.labels[clickIndexOptions.value];
      checkedOutOptions.value = checkedOutSeries.value
      break;
    case 'treemap':
      // Pour le treemap, le nom se trouve dans data[index].x
      const tmData = opts.w.config.series[0].data;
      if (tmData && tmData[clickIndexOptions.value]) {
        clickNameOptions.value = tmData[clickIndexOptions.value].x;
      }
      checkedOutOptions.value = checkedOutSeries.value
      break;
  }
  let isClicked = false
  if (clickIndexOptions !== -1 && clickIndexSeries !== -1) {
    isClicked = true
  }
  emit('chart-click', {
    isClick: isClicked,
    nameX: clickNameOptions.value,
    nameY: clickNameSeries.value,
    critereTrieX: checkedOutOptions.value,
    critereTrieY: checkedOutSeries.value
  })

}


</script>

<template>
  <div>
    <div>

      <div>Type de graphique</div>
      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" checked />
      <label for="line">Ligne du Temps</label>

      <input type="radio" id="bar" name="charts" value="bar" v-model="checkedTypeCharts" />
      <label for="bar">Barres</label>

      <input type="radio" id="pie" name="charts" value="pie" v-model="checkedTypeCharts" />
      <label for="pie">Pie</label>

      <input type="radio" id="heatmap" name="charts" value="heatmap" v-model="checkedTypeCharts" />
      <label for="heatmap">Heatmap</label>

      <input type="radio" id="treemap" name="charts" value="treemap" v-model="checkedTypeCharts" />
      <label for="treemap">Treemap</label>

      <input type="radio" id="histogram" name="charts" value="histogram" v-model="checkedTypeCharts" />
      <label for="histogram">Histogramme</label>
    </div>

    <div v-if="checkedTypeCharts === 'histogram'" style="margin-top: 10px;">
      <label for="histoSize">Intervalle (Années) : </label>
      <select id="histoSize" v-model="histogramBinSize">
        <option :value="1">1 an</option>
        <option :value="2">2 ans</option>
        <option :value="3">3 ans</option>
        <option :value="4">4 ans</option>
        <option :value="5">5 ans</option>
        <option :value="6">6 ans</option>
        <option :value="7">7 ans</option>
        <option :value="8">8 ans</option>
        <option :value="9">9 ans</option>
        <option :value="10">10 ans</option>
      </select>
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
    <div v-if="clickIndexOptions !== -1 && clickIndexSeries !== -1">
      <p>Sélection : {{ clickNameOptions }}<span
          v-if="clickNameSeries !== 'Critiques' && checkedTypeCharts !== 'pie' && checkedTypeCharts !== 'treemap' && checkedTypeCharts !== 'histogram'">,
          {{ clickNameSeries }}</span></p>
    </div>
  </div>
</template>