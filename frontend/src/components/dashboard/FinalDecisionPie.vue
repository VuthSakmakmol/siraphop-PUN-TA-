<template>
  <v-card class="pa-4" elevation="3" style="height: 500px;">
    <v-card-title class="text-h6 font-weight-bold mb-2">Final Decision</v-card-title>
    <v-divider class="mb-4" />
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
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
    default: () => ({
      'Hired': 0,
      'Candidate in Process': 0,
      'Candidate Refusal': 0,
      'Not Hired': 0
    })
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const colors = [
  '#66bb6a', // Hired
  '#42a5f5', // Candidate in Process
  '#ef5350', // Candidate Refusal
  '#ffb74d'  // Not Hired
]

// 🧠 Custom center label plugin
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { width, height, ctx } = chart
    ctx.save()
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
    ctx.font = 'bold 18px Roboto'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${total} Total`, width / 2, height / 2)
    ctx.restore()
  }
}

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  const labels = Object.keys(props.data)
  const values = Object.values(props.data)

  chartInstance = new Chart(chartCanvas.value, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: 12
            }
          }
        },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: (val, ctx) => {
            const data = ctx.chart.data.datasets[0].data
            const total = data.reduce((sum, val) => sum + val, 0)
            const percent = total > 0 ? ((val / total) * 100) : 0
            if (percent === 0) return '' // ✅ Hide if 0%
            return `${percent.toFixed(1)}%`
          }
        }
      }
    },
    plugins: [ChartDataLabels, centerTextPlugin]
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 400px;
  position: relative;
}
</style>
