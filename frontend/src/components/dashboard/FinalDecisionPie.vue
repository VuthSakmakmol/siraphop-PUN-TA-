<template>
  <v-card class="pa-4" elevation="3">
    <v-row justify="center">
      <!-- 🔹 Title + Donut Chart -->
      <v-col cols="12" class="text-center">
        <div class="chart-title mb-2">Final Hiring Decisions</div>

        <!-- ✅ ApexCharts donut chart -->
        <apexchart
          type="donut"
          height="300"
          :options="chartOptions"
          :series="series"
        />

        <!-- 🧾 Show message if no data -->
        <div v-if="!series.length" class="text-caption text-grey mt-2">
          No decision data.
        </div>
      </v-col>

      <!-- 🔸 Custom Legend under the chart -->
      <v-col cols="12">
        <div class="legend-wrap">
          <!-- 🔁 One legend item per label -->
          <div
            v-for="(label, index) in labels"
            :key="index"
            class="legend-item"
          >
            <!-- 🎨 Color box for this slice -->
            <span
              class="legend-color"
              :style="{ backgroundColor: colors[index % colors.length] }"
            ></span>

            <!-- 🏷 Label + % -->
            <span class="legend-label">
              {{ label }} — {{ getPercent(index) }}%
            </span>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
// 📦 Props from parent (series = values, labels = text, colors = pie slice colors)
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  colors: {
    type: Array,
    default: () => [
      '#00C853', // ✅ Hired - green
      '#D32F2F', // ❌ Not Hired - red
      '#FBC02D', // 🤝 Candidate Refused - yellow
      '#9E9E9E'  // 🔄 In Process - gray
    ]
  }
})

// 🎯 Chart config for ApexCharts
const chartOptions = computed(() => ({
  labels: props.labels,
  chart: {
    type: 'donut',
    toolbar: { show: false }
  },
  legend: { show: false },
  dataLabels: {
    enabled: true,
    formatter: (val) => `${val.toFixed(0)}%`,
    style: { fontSize: '12px' }
  },
  colors: props.colors
}))

// 🧮 Calculate percentage for legend item
const getPercent = (index) => {
  const total = props.series.reduce((a, b) => a + b, 0)
  return total ? ((props.series[index] / total) * 100).toFixed(0) : 0
}
</script>

<style scoped>
/* 🎯 Title styling */
.chart-title {
  font-weight: 600;
  font-size: 16px;
  color: #444;
}

/* 📦 Legend wrapper: rows of items */
.legend-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin-top: 12px;
}

/* 🏷 Each legend row */
.legend-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #555;
}

/* 🎨 Colored square for pie color */
.legend-color {
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border-radius: 2px;
}
</style>
