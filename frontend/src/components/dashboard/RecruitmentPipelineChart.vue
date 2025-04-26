<template>
  <v-container>
    <!-- Recruitment Pipeline Chart Only -->
    <v-row dense>
      <v-col cols="12">
        <v-card class="pa-4" elevation="2">
          <h3 class="text-h6 font-weight-bold mb-2">Recruitment Pipeline Overview</h3>
          <apexchart type="bar" height="400" :options="pipelineOptions" :series="pipelineSeries" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const pipelineSeries = ref([])
const pipelineOptions = ref({})

// Stage labels
const stageOrder = [
  '1.1 Received Application',
  '1.2 Sent to Manager',
  '1.3 Interviews',
  '1.4 Job Offer',
  '1.5 Hired',
  '1.6 Onboard'
]

// Colors for stages
const colorMap = [
  '#42a5f5', // Application
  '#66bb6a', // ManagerReview
  '#ffa726', // Interview
  '#ab47bc', // JobOffer
  '#26c6da', // Hired
  '#ef5350'  // Onboard
]

// Fetch Report Data
const fetchReport = async () => {
  try {
    const res = await axios.get('/api/report')
    const { rows } = res.data

    const pipelineData = stageOrder.map((label, idx) => {
      const row = rows.find(r => r.label === label)
      const value = row ? row.values.reduce((a, b) => a + b, 0) : 0
      return {
        x: label.replace(/^1\.\d+\s/, ''), // Remove "1.1 " etc.
        y: value,
        color: colorMap[idx]
      }
    })

    pipelineSeries.value = [{
      data: pipelineData.map(item => ({
        x: item.x,
        y: item.y
      }))
    }]

    pipelineOptions.value = {
      chart: { type: 'bar', stacked: false, toolbar: { show: false } },
      plotOptions: {
        bar: { horizontal: true }
      },
      xaxis: {
        categories: pipelineData.map(item => item.x)
      },
      colors: pipelineData.map(item => item.color),
      dataLabels: { enabled: true },
      tooltip: {
        y: {
          formatter: (val) => `${val} Candidates`
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to load pipeline chart:', err)
  }
}

onMounted(fetchReport)
</script>

<style scoped>
h3 {
  font-weight: bold;
  margin-bottom: 12px;
}
</style>
