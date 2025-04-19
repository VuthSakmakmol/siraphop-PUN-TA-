<template>
  <v-card class="pa-5" elevation="4">
    <v-card-title class="text-subtitle-1 font-weight-bold mb-2">Vacancy Statistics</v-card-title>
    <v-divider class="mb-3" />

    <v-row dense>
      <!-- KPI Cards -->
      <v-col cols="12" md="8">
        <v-row dense>
          <v-col v-for="(item, index) in kpiList" :key="index" cols="12" sm="6">
            <v-sheet class="pa-3 kpi-box" elevation="1">
              <div class="text-caption text-grey-darken-1">{{ item.label }}</div>
              <div class="text-subtitle-2 font-weight-bold text-primary">{{ item.value }}</div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-col>

      <!-- Fill Rate Circle -->
      <v-col cols="12" md="4" class="d-flex align-center justify-center">
        <div class="fillrate-circle-container">
          <svg viewBox="0 0 36 36" class="circular-chart blue">
            <path
              class="circle-bg"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="fillRate + ', 100'"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" class="percentage">{{ fillRate }}%</text>
          </svg>
          <div class="text-caption mt-1 text-center">Filled Rate</div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({})
const kpiList = ref([])
const fillRate = ref(0)

const formatMoney = (value) => {
  return value !== null && value !== undefined ? `$${value}` : '-'
}

const loadKPI = async () => {
  try {
    const res = await axios.post('/api/dashboard/stats', {
      type: 'White Collar'
    })

    stats.value = res.data

    kpiList.value = [
      { label: 'Total Requisitions', value: stats.value.totalRequisitions || 0 },
      { label: 'Filled Positions', value: stats.value.filledPositions || 0 },
      { label: 'Active Vacancies', value: stats.value.activeVacancies || 0 },
      { label: 'Hiring Cost ($)', value: formatMoney(stats.value.hiringCost) },
      { label: 'Cost per Hire ($)', value: formatMoney(stats.value.costPerHire) },
      { label: 'Avg Days to Hire', value: stats.value.avgDaysToHire || '-' }
    ]

    fillRate.value = parseFloat(stats.value.fillRate || 0).toFixed(1)
  } catch (err) {
    console.error('❌ Error fetching KPI:', err)
  }
}

onMounted(() => {
  loadKPI()
})
</script>


<style scoped>
.kpi-box {
  border-left: 3px solid #1976d2;
  background-color: #f4f7fd;
  border-radius: 8px;
  transition: 0.2s;
}
.kpi-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
}

.fillrate-circle-container {
  max-width: 220px;
  width: 100%;
  position: relative;
}
.circular-chart {
  width: 100%;
  height: auto;
}
.circle-bg {
  fill: none;
  stroke: #ececec;
  stroke-width: 3;
}
.circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke: #1976d2;
  transition: stroke-dasharray 0.3s ease;
}
.percentage {
  fill: #1976d2;
  font-size: 0.6rem;
  text-anchor: middle;
}
</style>
