<script setup>
import { ref, watch, computed } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')
let checkedOutData = ref('combine')

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
  filtreActifs : {
    type: Array,
    required: false
  }
})

let isMultipleFilter = false
const sortKey = ref('Année')
const sortDir = ref('desc')

const filteredAndSorted = computed(() => {
  console.log("filteredAndSorted recalculated");
  let sortedItems = [...props.items];
  
  if (sortKey.value) {
    sortedItems = sortedItems.sort((b, a) => {
      const va = a[sortKey.value];
      const vb = b[sortKey.value];
      
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

let chartOptionsFinal = ref({})

let chartSeriesFinal = ref()

const apexchart = ApexChart;

const updateData = (type, mode) => {
  let anneeCourante = filteredAndSorted.value[0].Année
  const anneeMax = filteredAndSorted.value[filteredAndSorted.value.length - 1].Année
  let nbOccurence = 0
  let arrayY01 = []
  let arrayX01 = []
  let filtres = props.filtreActifs

  while(anneeCourante === '-' || anneeCourante <= anneeMax) {
    arrayX01.push(anneeCourante.toString()) // X
    let maxFiltrePays = filtres.countries.length
    // Si plusieurs Pays (test)
    if (maxFiltrePays !== 1) {
      if (mode === 'divided') {
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
        if (arrayY01.length <= 0) { 
          arrayY01.push({ name: filtres.countries[0], data: [] })
        }

        nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante).length
        arrayY01[0].data.push(nbOccurence) // Y
        arrayX01.push(anneeCourante.toString()) // X

      }
      

      if (anneeCourante === '-') {
        if (nbOccurence < filteredAndSorted.value.length) {
          anneeCourante = filteredAndSorted.value[nbOccurence].Année
        } else {
          anneeCourante = "?"
        }
      } else {
        anneeCourante++
      }
      isMultipleFilter = true
    } else {
      // Si 1 pays
      if (arrayY01.length <= 0) { 
        arrayY01.push({ name: filtres.countries[0], data: [] })
      }

      nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante && item.Pays === filtres.countries[0]).length
      arrayY01[0].data.push(nbOccurence) // Y
      arrayX01.push(anneeCourante.toString()) // X

      if (anneeCourante === '-') {
        if (nbOccurence < filteredAndSorted.value.length) {
          anneeCourante = filteredAndSorted.value[nbOccurence].Année
        } else {
          anneeCourante = "?"
        }
      } else {
        anneeCourante++
      }
      isMultipleFilter = false
    }
      

    }

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
        }
    }
}


watch(filteredAndSorted, () => {
  updateData(checkedTypeCharts.value, checkedOutData.value)
});

watch(checkedTypeCharts, (newType) => {
  updateData(newType, 'combine')
})

watch(checkedOutData, (newMode) => {
  updateData(checkedTypeCharts.value, newMode)
})
</script>

<template>
  <div>
    <div>
      <!-- <div v-for="(item, index) in listCritique" :key="index">
        {{ item }}
      </div> -->
      <div>Type de graphique</div>
      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" />
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
      :series="chartSeriesFinal"
    />
    </div>
    <div v-if="isMultipleFilter === true">
      
      <input type="radio" id="combine" name="Data" value="combine" v-model="checkedOutData"/>
      <label for="combine">Combiner</label>

      <input type="radio" id="divided" name="Data" value="divided" v-model="checkedOutData" />
      <label for="divided">Diviser</label>
    </div>
    
  </div>
</template>
