<template>
  <v-card class="pa-4" elevation="3">
    <v-card-title class="text-h6 font-weight-bold">Application Source</v-card-title>
    <v-divider class="mb-3" />
    <div class="chart-container">
      <canvas ref="pieCanvas"></canvas>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels)

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const pieCanvas = ref(null)
let chartInstance = null

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  const labels = Object.keys(props.data)
  const values = Object.values(props.data)
  const colors = [
    '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc',
    '#26c6da', '#8d6e63', '#5c6bc0', '#26a69a'
  ]

  chartInstance = new Chart(pieCanvas.value, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (val, ctx) => {
            const label = ctx.chart.data.labels[ctx.dataIndex]
            return `${label}: ${val}`
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12 }
        },
        datalabels: {
          display: true
        },
        tooltip: {
          enabled: true
        }
      }
    }
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 300px;
  position: relative;
}
</style>
