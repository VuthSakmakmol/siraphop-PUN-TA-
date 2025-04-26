<template>
  <v-card class="pa-5" elevation="4" min-height="300px">
    <v-card-title class="text-subtitle-1 font-weight-bold mb-2">Vacancy Statistics</v-card-title>
    <v-divider class="mb-3" />

    <div v-if="loading" class="d-flex align-center justify-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="50" />
    </div>

    <template v-else>
      <!-- Your normal KPI display here -->
      <v-row dense>
        <v-col cols="12" md="8">
          <v-row dense>
            <v-col v-for="(item, index) in kpiList" :key="index" cols="12" sm="6">
              <v-sheet class="pa-3 kpi-box" elevation="1">
                <div class="text-caption text-grey-darken-1">{{ item.label }}</div>
                <div class="text-subtitle-2 font-weight-bold text-primary">
                  {{ formatDisplay(item.value, item.isMoney) }}
                </div>
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
    </template>
  </v-card>
</template>


<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {           // ✅ add this
    type: Boolean,
    default: false
  }
})

// Correct fields according to your backend response
const kpiList = computed(() => [
  { label: 'Total Requisitions', value: props.data.totalRequisitions ?? 0 },
  { label: 'Filled Positions', value: props.data.filled ?? 0 },
  { label: 'Active Vacancies', value: props.data.activeVacancies ?? 0 },
  { label: 'Hiring Cost ($)', value: props.data.hiringCost ?? 0, isMoney: true },
  { label: 'Cost per Hire ($)', value: props.data.costPerHire ?? 0, isMoney: true }
])

const fillRate = computed(() => parseFloat(props.data.fillRate || 0).toFixed(1))

// Format number display
const formatDisplay = (value, isMoney = false) => {
  if (isMoney) return `$${parseFloat(value).toFixed(2)}`;
  return value;
}
</script>

<style scoped>
.kpi-box {
  border-left: 3px solid #1976d2;
  background-color: #f4f7fd;
  border-radius: 8px;
}

.fillrate-circle-container {
  max-width: 220px;
  width: 100%;
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
}
.percentage {
  fill: #1976d2;
  font-size: 0.6rem;
  text-anchor: middle;
}
</style>
