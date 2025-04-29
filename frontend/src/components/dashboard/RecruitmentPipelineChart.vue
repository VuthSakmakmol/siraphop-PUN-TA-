<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-card class="pa-4" elevation="3" style="height: 685px;">
          <!-- Filters -->
          <v-row dense class="mb-2">
            <v-col cols="12">
              <v-select
                v-model="filterView"
                :items="['Month', 'Quarter', 'Year']"
                label="View By"
                density="compact"
                hide-details
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="filterYear"
                :items="yearOptions"
                label="Year"
                density="compact"
                hide-details
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="filterType"
                :items="['All', 'White Collar', 'Blue Collar']"
                label="Type"
                density="compact"
                hide-details
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Title and Chart -->
          <h3 class="text-h6 font-weight-bold mb-2">Recruitment Pipeline</h3>

          <div v-if="pipelineOptions && pipelineSeries.length">
            <apexchart type="bar" height="400" :options="pipelineOptions" :series="pipelineSeries" />
          </div>

          <div v-else class="text-center py-6">
            <v-progress-circular indeterminate color="primary" size="50" />
            <div class="text-caption mt-2">Loading chart...</div>
          </div>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const filterView = ref('Month')
const filterYear = ref(new Date().getFullYear())
const filterType = ref('All')

const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

const pipelineSeries = ref([])
const pipelineOptions = ref(null)

const stageOrder = [
  '1.1 Received Application',
  '1.2 Sent to Manager',
  '1.3 Interviews',
  '1.4 Job Offer',
  '1.5 Hired',
  '1.6 Onboard'
]

const colorMap = [
  '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#26c6da', '#ef5350'
]

const fetchReport = async () => {
  try {
    pipelineSeries.value = []
    pipelineOptions.value = null

    const res = await axios.get('/api/report', {
      params: {
        view: filterView.value.toLowerCase(),
        year: filterYear.value,
        type: filterType.value
      }
    })

    const { rows } = res.data

    const pipelineData = stageOrder.map((label, idx) => {
      const row = rows.find(r => r.label === label)
      const value = row ? row.values.reduce((a, b) => a + b, 0) : 0
      return {
        x: label.replace(/^1\.\d+\s/, ''),
        y: value,
        color: colorMap[idx]
      }
    })

    pipelineSeries.value = [{
      name: '',  // Optional: you can set 'Candidates' here
      data: pipelineData.map(item => ({
        x: item.x,
        y: item.y
      }))
    }]

    pipelineOptions.value = {
      chart: { type: 'bar', stacked: false, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true } },
      xaxis: {
        categories: pipelineData.map(item => item.x),
        labels: {
          formatter: (val) => parseInt(val)
        },
        tickAmount: 'dataPoints'
      },
      yaxis: {
        forceNiceScale: true,
        decimalsInFloat: 0
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
watch([filterView, filterYear, filterType], fetchReport)
</script>

<style scoped>
h3 {
  font-weight: bold;
  margin-bottom: 12px;
}
</style>
