<template>
  <v-card class="pa-4" elevation="3">
    <v-card-title class="text-h6 font-weight-bold">Recruitment Pipeline</v-card-title>
    <v-divider class="mb-3" />
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels)

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      Application: 0,
      ManagerReview: 0,
      Interview: 0,
      JobOffer: 0,
      Hired: 0,
      Onboard: 0
    })
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const stageLabels = {
  Application: 'Received Application',
  ManagerReview: 'Sent to Manager',
  Interview: 'Interviews',
  JobOffer: 'Job Offer',
  Hired: 'Hired',
  Onboard: 'Onboard'
}

const stageColors = [
  '#66bb6a', // Application
  '#42a5f5', // ManagerReview
  '#26c6da', // Interview
  '#ffa726', // JobOffer
  '#ef5350', // Hired
  '#ab47bc'  // Onboard
]

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  const labels = Object.keys(props.data).map(key => stageLabels[key] || key)
  const values = Object.values(props.data)

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: stageColors,
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#fff',
          font: {
            weight: 'bold',
            size: 14
          }
        }
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw} candidate(s)`
          }
        },
        datalabels: {
          display: true,
          anchor: 'center',
          align: 'center',
          formatter: value => value
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1
          },
          suggestedMax: Math.max(...values, 5)
        }
      }
    },
    plugins: [ChartDataLabels]
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 340px;
  position: relative;
}
</style>
