<template>
  <v-card class="pa-4" elevation="3" style="height: 700px;">
    <v-card-title class="text-h6 font-weight-bold mb-2">
      Vacancies Statistics
    </v-card-title>
    <v-divider class="mb-4" />

    <div v-if="loading" class="d-flex align-center justify-center" style="height: 600px;">
      <v-progress-circular indeterminate color="primary" size="50" />
    </div>

    <template v-else>
      <v-row dense class="fill-height">
        <v-col cols="12">
          <v-row dense>
            <v-col v-for="(item, index) in kpiList" :key="index" cols="12">
              <v-sheet class="pa-2 kpi-box" elevation="1">
                <div class="text-caption text-grey-darken-1">{{ item.label }}</div>
                <div class="text-body-2 font-weight-bold text-primary">
                  {{ formatDisplay(item.value, item.isMoney) }}
                </div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" class="d-flex align-center justify-center mt-4">
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

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// ✅ This component only DISPLAY props data, don't fetch

const kpiList = computed(() => [
  { label: 'Total Requisitions', value: props.data.totalRequisitions ?? 0 },
  { label: 'Filled Positions', value: props.data.filled ?? 0 },
  { label: 'Total Hiring Cost ($)', value: props.data.hiringCost ?? 0, isMoney: true },
  { label: 'Cost per Hire ($)', value: props.data.costPerHire ?? 0, isMoney: true },
  { label: 'Average Days to Hire', value: props.data.averageDaysToHire ?? 0 },
  { label: 'Active Vacancies', value: props.data.activeVacancies ?? 0 }
])

const fillRate = computed(() => parseFloat(props.data.fillRate || 0).toFixed(1))

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
  max-width: 180px;
  width: 100%;
  margin-top: -50px;
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
  transition: stroke-dasharray 1s ease;
}

.percentage {
  fill: #1976d2;
  font-size: 0.5rem;
  text-anchor: middle;
}
</style>
