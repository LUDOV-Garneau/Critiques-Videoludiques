<script setup>
import { ref, watch, computed } from 'vue'
import ApexChart from 'vue3-apexcharts'

let checkedTypeCharts = ref('line')


const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

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

const updateData = (type) => {
  let anneeCourante = filteredAndSorted.value[0].Année
  const anneeMax = filteredAndSorted.value[filteredAndSorted.value.length - 1].Année
    let nbOccurence = 0
    let arrayY01 = []
    let arrayX01 = []

    while(anneeCourante === '-' || anneeCourante <= anneeMax) {
      nbOccurence = filteredAndSorted.value.filter(item => item.Année === anneeCourante).length
      arrayY01.push(nbOccurence) // Y
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

    }

    chartSeriesFinal.value = [{
      name: 'Critiques',
      data: arrayY01
    }
]

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
  updateData(checkedTypeCharts.value)
});

watch(checkedTypeCharts, (newType) => {
  updateData(newType)
})
</script>

<template>
  <div>
    <div>
      <!-- <div v-for="(item, index) in listCritique" :key="index">
        {{ item }}
      </div> -->
      <div>Type de graphique</div>
      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" checked/>
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

    
  </div>
</template>
