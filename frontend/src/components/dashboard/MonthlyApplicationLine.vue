<template>
  <v-card class="pa-4" elevation="3">
    <!-- 🏷️ Title + Year Filter -->
    <v-row class="mb-2" align="center">
      <v-col cols="6">
        <div class="chart-title">Monthly Applications</div>
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          label="Select Year"
          density="compact"
          variant="outlined"
          hide-details
          class="float-right"
        />
      </v-col>
    </v-row>

    <!-- 📈 Chart -->
    <v-row>
      <v-col cols="12">
        <apexchart
          type="line"
          height="350"
          :options="chartOptions"
          :series="series"
        />
        <div v-if="!series[0].data.length" class="text-caption text-grey mt-2">
          No application data.
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 📅 Year Filter State
const currentYear = dayjs().year()
const selectedYear = ref(currentYear)

// Generate year options (5 years back to now)
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i).reverse()

// 📈 Chart Data Series
const series = ref([
  {
    name: 'Applications',
    data: [] // [{ x: 'Jan', y: 5 }]
  }
])

// ⚙️ Chart Options
const chartOptions = ref({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  stroke: { curve: 'smooth' },
  markers: { size: 5 },
  xaxis: {
    type: 'category',
    labels: {
      rotate: -45,
      style: { fontSize: '12px' }
    }
  },
  yaxis: {
    labels: { style: { fontSize: '12px' } }
  },
  colors: ['#2196F3'],
  tooltip: {
  y: {
    formatter: val => `${val} applications`
  },
  style: {
    fontSize: '12px'
  },
  theme: 'light',
  marker: {
    show: true
  },
  custom: ({ series, seriesIndex, dataPointIndex, w }) => {
    const label = w.globals.labels[dataPointIndex]
    const value = series[seriesIndex][dataPointIndex]
    return `
      <div style="background-color: rgba(255, 255, 255, 0.8); padding: 8px; border-radius: 4px;">
        <strong>${label}</strong><br>
        <span style="color: #2196F3;">●</span> Applications: <strong>${value}</strong>
      </div>
    `
  }
}

})

// 📡 Fetch Monthly Applications by Year
const fetchMonthly = async () => {
  try {
    const res = await axios.post('/api/dashboard/stats', {
      year: selectedYear.value
    })

    const monthly = res.data?.monthly || { labels: [], counts: [] }

    const formatted = monthly.labels.map((label, i) => ({
      x: label,
      y: monthly.counts[i]
    }))

    series.value[0].data = formatted

    console.log('📆 Monthly Year:', selectedYear.value, formatted)
  } catch (err) {
    console.error('❌ Monthly chart fetch error:', err)
  }
}

watch(selectedYear, fetchMonthly, { immediate: true })
onMounted(fetchMonthly)
</script>

<style scoped>
.chart-title {
  font-weight: 600;
  font-size: 16px;
  color: #444;
}
</style>
