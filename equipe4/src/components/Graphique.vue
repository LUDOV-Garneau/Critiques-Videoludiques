<script setup>
import { ref } from 'vue'
import ApexCharts from 'vue3-apexcharts'

const checkedTypeCharts = ref([])

const chartsValue = ref({
  options: {
    chart: {
      id: 'vuechart-example'
    },
    xaxis: {
      categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
    }
  },
  series: [{
    name: 'series-1',
    data: [30, 40, 45, 50, 49, 60, 70, 91]
  }]
})


</script>


<template>
  <div>
    <apexchart
        height="300"
        type= {{checkedTypeCharts}}
        :options="chartsValue.options"
        :series="chartsValue.series"
    />
  </div>
  <div>
    <div>Checked names: {{ checkedTypeCharts }}</div>

    <input type="radio" id="line" value="line" v-model="checkedTypeCharts" checked />
    <label for="line">Line</label>

    <input type="radio" id="bar" value="Bar" v-model="checkedTypeCharts" />
    <label for="bar">Bar</label>

    <input type="radio" id="scatter" value="Scatter" v-model="checkedTypeCharts" />
    <label for="scatter">Scatter</label>

  </div>
</template>

<script>
export default {
  components: {
    apexchart: ApexCharts
  }
}





</script>
