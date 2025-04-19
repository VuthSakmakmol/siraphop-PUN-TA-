<template>
    <Bar :data="chartData" :options="options" />
  </template>
  
  <script setup>
  import { Bar } from 'vue-chartjs'
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)
  
  const props = defineProps({ data: Object })
  
  const chartData = {
    labels: Object.keys(props.data),
    datasets: [
      {
        label: 'Applications',
        data: Object.values(props.data),
        backgroundColor: '#42a5f5'
      }
    ]
  }
  
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Applications' }
    }
  }
  </script>
  