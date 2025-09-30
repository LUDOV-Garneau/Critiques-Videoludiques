<script setup>
import { ref, watch } from 'vue'
import ApexChart from 'vue3-apexcharts'

const checkedTypeCharts = ref('line')

// Line/Bar base options
const baseOptions = {
  title: {
    text: 'Produit par Mois',
    align: 'left'
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  }
}

// Scatter options
const scatterOptions = {
  title: {
    text: 'Produit par Mois',
    align: 'left'
  },
  xaxis: {
    tickAmount: 10,
    labels: {
      formatter: (val) => parseFloat(val).toFixed(1)
    }
  },
  yaxis: {
    tickAmount: 7
  }
}

const lineBarSeries = [
  {
    name: 'Sales',
    data: [16.4, 5.4, 21.7, 2, 25.4, 3, 19, 2, 10.9]
  }
]

const scatterSeries = [
  {
    name: 'Sales',
    data: [
      [16.4, 5.4], [21.7, 2], [25.4, 3], [19, 2], [10.9, 1],
      [13.6, 3.2], [10.9, 7.4], [10.9, 0], [10.9, 8.2], [16.4, 0],
      [16.4, 1.8], [13.6, 0.3], [13.6, 0], [29.9, 0], [27.1, 2.3],
      [16.4, 0], [13.6, 3.7], [10.9, 5.2], [16.4, 6.5], [10.9, 0],
      [24.5, 7.1], [10.9, 0], [8.1, 4.7], [19, 0], [21.7, 1.8],
      [27.1, 0], [24.5, 0], [27.1, 0], [29.9, 1.5], [27.1, 0.8], [22.1, 2]
    ]
  }
]

const chartOptionsFinal = ref({})
const chartSeriesFinal = ref([])

const updateChart = (type) => {
  if (type === 'scatter') {
    chartOptionsFinal.value = {
      chart: {
        type: type,
        height: 300
      },
      ...scatterOptions
    }
    chartSeriesFinal.value = scatterSeries
  } else {
    chartOptionsFinal.value = {
      chart: {
        type: type,
        height: 300
      },
      ...baseOptions
    }
    chartSeriesFinal.value = lineBarSeries
  }
}

watch(checkedTypeCharts, (newType) => {
  updateChart(newType)
})
</script>

<template>
  <div>
    <div>
      <!-- <div>Chart Type: {{ checkedTypeCharts }}</div> -->
      <div>Type de graphique</div>
      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" />
      <label for="line">Line</label>

      <input type="radio" id="bar" name="charts" value="bar" v-model="checkedTypeCharts" />
      <label for="bar">Bar</label>

      <input type="radio" id="scatter" name="charts" value="scatter" v-model="checkedTypeCharts" />
      <label for="scatter">Scatter</label>
    </div>

    <apexchart
      :key="checkedTypeCharts"
      width="100%"
      height="300"
      :options="chartOptionsFinal"
      :series="chartSeriesFinal"
    />
  </div>
</template>

<script>
export default {
  components: {
    apexchart: ApexChart
  }
}
</script>
