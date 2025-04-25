<template>
  <v-container>
    <!-- Filters -->
    <v-row class="mb-4" dense>
      <v-col cols="12" md="3">
        <v-select v-model="filterView" :items="['Year', 'Quarter', 'Month', 'Week']" label="View By" dense clearable />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="filterYear" :items="yearOptions" label="Year" dense clearable />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="filterType" :items="['White Collar', 'Blue Collar']" label="Type" dense clearable />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn color="primary" class="w-100" @click="fetchReport">Apply Filter</v-btn>
      </v-col>
    </v-row>

    <!-- Report Table -->
    <div class="report-wrapper">
      <table class="report-table">
        <thead>
          <tr>
            <th class="sticky-col sticky-head">Performance</th>
            <th v-for="col in dynamicColumns" :key="col" class="sticky-head">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in reportData" :key="index" :class="{ 'section-header': row.isHeader }">
            <td class="sticky-col">{{ row.label }}</td>
            <td v-for="(val, i) in row.values" :key="i">{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const reportData = ref([])
const dynamicColumns = ref([])

const filterView = ref('Month')
const filterYear = ref(new Date().getFullYear())
const filterType = ref('White Collar')

const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

const fetchReport = async () => {
  try {
    const res = await axios.get('/api/report', {
      params: {
        view: filterView.value.toLowerCase(),
        year: filterYear.value,
        type: filterType.value
      }
    })
    reportData.value = res.data.rows
    dynamicColumns.value = res.data.columns
  } catch (err) {
    console.error('❌ Failed to load report:', err)
  }
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.report-wrapper {
  overflow-x: auto;
  width: 100%;
}

.report-wrapper table {
  min-width: 1200px;
  white-space: nowrap;
}

.v-table th,
.v-table td {
  padding: 10px 14px;
  vertical-align: middle;
  font-size: 13px;
}

.v-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  text-transform: uppercase;
}

.v-table td {
  font-weight: 400;
}

.report-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 80vh;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.custom-table {
  width: max-content;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
  min-width: 100%;
}

/* Table cells */
.custom-table th,
.custom-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  white-space: nowrap;
  text-align: center;
}
.report-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 80vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.report-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

.report-table th,
.report-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  text-align: center;
}

/* Sticky Top */
.sticky-head {
  position: sticky;
  top: 0;
  background-color: #e3f2fd;
  z-index: 5;
  color: #1565c0;
  font-weight: bold;
}

/* Sticky Left */
.sticky-col {
  position: sticky;
  left: 0;
  background-color: #f1f8e9;
  z-index: 4;
  text-align: left;
  font-weight: bold;
  color: #558b2f;
}

/* Section headers */
.section-header td {
  background-color: #eee;
  font-weight: bold;
  color: #444;
  text-align: left;
}

/* Disable sticky left on mobile */
@media (max-width: 768px) {
  .sticky-col {
    position: static;
    background-color: inherit;
    color: inherit;
    z-index: auto;
  }
}



</style>
