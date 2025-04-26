<template>
  <v-container>
    <!-- Filters -->
    <v-row class="mb-4" dense>
      <v-col cols="12" md="3">
        <v-select v-model="filterView" :items="['Year', 'Quarter', 'Month']" label="View By" dense />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="filterYear" :items="yearOptions" label="Year" dense />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="filterType" :items="['White Collar', 'Blue Collar']" label="Type" dense />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn color="primary" class="w-100" @click="applyFilters">Apply Filter</v-btn>
      </v-col>
    </v-row>

    <!-- Table -->
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
            <td v-for="(val, i) in row.values" :key="i">
              <template v-if="row.isSource">
                {{ row.percents[i] }}
              </template>
              <template v-else>
                {{ val }}
              </template>
            </td>
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

const applyFilters = async () => {
  await fetchReport()
}

const fetchReport = async () => {
  try {
    const payload = {
      view: filterView.value.toLowerCase(),
      year: filterYear.value,
      type: filterType.value
    }

    const res = await axios.get('/api/report', { params: payload })
    reportData.value = res.data.rows
    dynamicColumns.value = res.data.columns
  } catch (err) {
    console.error('❌ Failed to load report:', err)
  }
}

onMounted(applyFilters)
</script>

<style scoped>
/* Table Scroll Wrapper */
.report-wrapper {
  width: 100%;
  max-height: 80vh;
  overflow-x: auto;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Table Styling */
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

/* Sticky Top Header */
.sticky-head {
  position: sticky;
  top: 0;
  background-color: #e3f2fd;
  z-index: 5;
  font-weight: bold;
  color: #1565c0;
}

/* Sticky Left Column */
.sticky-col {
  position: sticky;
  left: 0;
  background-color: #f1f8e9;
  z-index: 4;
  font-weight: bold;
  color: #558b2f;
  text-align: left;
}

/* Section Headers */
.section-header td {
  background-color: #eee;
  font-weight: bold;
  color: #444;
  text-align: left;
}

/* Mobile: disable sticky on small screen */
@media (max-width: 768px) {
  .sticky-col {
    position: static;
    background-color: inherit;
    color: inherit;
    z-index: auto;
  }
}
</style>
