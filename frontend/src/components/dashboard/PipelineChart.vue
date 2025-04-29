<template>
    <v-card class="pa-4" elevation="2">
      <h3 class="text-subtitle-1 mb-4">Recruitment Pipelineaa</h3>
      <canvas ref="chartRef" height="180" />
    </v-card>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
  import Chart from 'chart.js/auto'
  
  const props = defineProps({
    data: {
      type: Object,
      default: () => ({
        Application: 0,
        ManagerReview: 0,
        Interview: 0,
        Offer: 0,
        Hired: 0,
        Onboard: 0
      })
    }
  })
  
  const chartRef = ref(null)
  let chartInstance = null
  
  const renderChart = () => {
    if (!chartRef.value) return
  
    const ctx = chartRef.value.getContext('2d')
  
    if (chartInstance) {
      chartInstance.destroy()
    }
  
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Application', 'Manager Review', 'Interview', 'Offer', 'Hired', 'Onboard'],
        datasets: [{
          label: 'Candidates',
          data: [
            props.data.Application || 0,
            props.data.ManagerReview || 0,
            props.data.Interview || 0,
            props.data.Offer || 0,
            props.data.Hired || 0,
            props.data.Onboard || 0
          ],
          backgroundColor: '#1976d2'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    })
  }
  
  onMounted(() => {
    renderChart()
  })
  
  watch(() => props.data, () => {
    renderChart()
  }, { deep: true })
  </script>
  
  <style scoped>
  canvas {
    max-width: 100%;
  }
  </style>
  