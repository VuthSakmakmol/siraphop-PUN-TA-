<template>
  <v-card class="pa-4" elevation="3">
    <v-card-title class="text-h6">Monthly Applications</v-card-title>
    <v-divider class="mb-3" />
    <div style="height: 220px">
      <canvas ref="lineChart" />
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'
import dayjs from 'dayjs'

// 📊 Register chart components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

// ✅ Props structure: { labels: ['2024-01', '2024-02'], counts: [10, 14] }
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      labels: [],
      counts: []
    })
  }
})

const lineChart = ref(null)
let chartInstance = null

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  const labels = props.data.labels || []
  const counts = props.data.counts || []

  // 🗓️ Format as Jan, Feb, Mar etc.
  const formattedLabels = labels.map(label => {
    const [year, month] = label.split('-')
    return dayjs(`${year}-${month}-01`).format('MMM')
  })

  chartInstance = new Chart(lineChart.value, {
    type: 'line',
    data: {
      labels: formattedLabels,
      datasets: [{
        label: 'Applications',
        data: counts,
        fill: false,
        tension: 0.3,
        borderColor: '#1976d2',
        borderWidth: 2,
        pointBackgroundColor: '#1976d2',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  })
}

// 🔁 React to prop changes
onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>
