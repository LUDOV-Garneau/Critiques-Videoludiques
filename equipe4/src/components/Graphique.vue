<script setup>
import { ref, watch } from 'vue'
import ApexChart from 'vue3-apexcharts'

const checkedTypeCharts = ref('line')

const chartOptions = ref({
  chart: {
    type: checkedTypeCharts.value,
    height: 300
  },
  title: {
    text: 'Product Trends by Month',
    align: 'left'
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  }
})

const chartSeries = ref([
  {
    name: 'Sales',
    data: [16.4, 5.4, 21.7, 2, 25.4, 3, 19, 2, 10.9]
  }
])

watch(checkedTypeCharts, (newType) => {
  chartOptions.value = {
    ...chartOptions.value,
    chart: {
      ...chartOptions.value.chart,
      type: newType
    }
  }
})
</script>

<template>
  <div>
    <div>
      <div>Checked chart type: {{ checkedTypeCharts }}</div>

      <input type="radio" id="line" name="charts" value="line" v-model="checkedTypeCharts" />
      <label for="line">Line</label>

      <input type="radio" id="bar" name="charts" value="bar" v-model="checkedTypeCharts" />
      <label for="bar">Bar</label>

      <input type="radio" id="scatter" name="charts" value="scatter" v-model="checkedTypeCharts" />
      <label for="scatter">Scatter</label>
    </div>

    <apexchart
      width="100%"
      height="300"
      :options="chartOptions"
      :series="chartSeries"
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
