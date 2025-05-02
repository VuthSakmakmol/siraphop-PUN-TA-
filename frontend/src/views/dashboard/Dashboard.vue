<template>
  <v-container fluid>
    <!-- 🔹 Sticky Filter Bar -->
    <v-sheet
      elevation="2"
      class="pa-2 mb-4 sticky-filter"
      color="white"
    >
      <v-row dense class="align-center">
        <v-col cols="12" sm="6" md="2.4">
          <v-select
            v-model="filterType"
            :items="filterOptions"
            label="Candidate Type"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="2.4">
          <v-select
            v-model="filterRecruiter"
            :items="recruiterOptions"
            label="Recruiter"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="2.4">
          <v-autocomplete
            v-model="filterDepartment"
            :items="departmentOptions"
            item-title="name"
            item-value="_id"
            label="Department"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            return-object
          />
        </v-col>


        <v-col cols="6" sm="3" md="2.4">
          <v-menu v-model="fromMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-model="fromDisplay"
                label="From"
                readonly
                v-bind="props"
                prepend-icon="mdi-calendar"
                variant="outlined"
                density="compact"
                hide-details
              />
            </template>
            <v-date-picker v-model="from" @update:model-value="updateFromDisplay" />
          </v-menu>
        </v-col>

        <v-col cols="6" sm="3" md="2.4">
          <v-menu v-model="toMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-model="toDisplay"
                label="To"
                readonly
                v-bind="props"
                prepend-icon="mdi-calendar"
                variant="outlined"
                density="compact"
                hide-details
              />
            </template>
            <v-date-picker v-model="to" @update:model-value="updateToDisplay" />
          </v-menu>
        </v-col>
      </v-row>
    </v-sheet>


    <!-- 🔸 Charts -->
    <v-row>
      <v-col cols="12" md="4">
        <RecruitmentPipelineChart :pipeline="pipelineData" />
      </v-col>
      <v-col cols="12" md="4">
        <SourcePie :series="sourceData.counts" :labels="sourceData.labels" />
      </v-col>
      <v-col cols="12" md="4">
        <FinalDecisionPie :series="decisionData.counts" :labels="decisionData.labels" />
      </v-col>
      

      <!-- 🔸 Monthly Line + KPI -->
      <v-col cols="12" md="4">
        <v-card class="pa-2">
          <v-btn @click="showFull = true" icon="mdi-fullscreen" class="float-right mb-2" title="Expand" />
          <MonthlyApplicationLine :type="queryFilters.type" :subType="queryFilters.subType" :start="queryFilters.from" :end="queryFilters.to" />
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <VacancyKPI :typeLabel="filterType" :data="currentKpiData" :loading="loadingKpi" />
      </v-col>

      <!-- ✅ Recruitment Report Table -->
      <v-col cols="12">
        <RecruitmentReportTable
          :type="queryFilters.type"
          :sub-type="queryFilters.subType"
          :start="from"
          :end="to"
        />
      </v-col>
    </v-row>

    <!-- 🔲 Fullscreen Dialog -->
    <v-dialog v-model="showFull" fullscreen transition="dialog-bottom-transition" persistent>
      <v-card>
        <v-toolbar flat color="primary" dark>
          <v-toolbar-title>Monthly Applications (Fullscreen)</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showFull = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <MonthlyApplicationLine :type="queryFilters.type" :subType="queryFilters.subType" :start="queryFilters.from" :end="queryFilters.to" />
          <RecruitmentReportTable
            :type="queryFilters.type"
            :sub-type="queryFilters.subType"
            :start="queryFilters.from"
            :end="queryFilters.to"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'

import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import RecruitmentPipelineChart from '@/components/dashboard/RecruitmentPipelineChart.vue'
import MonthlyApplicationLine from '@/components/dashboard/MonthlyApplicationLine.vue'
import VacancyKPI from '@/components/dashboard/VacancyKPI.vue'
import RecruitmentReportTable from '@/components/dashboard/RecruitmentReportTable.vue'

// Filters
const filterType = ref('White Collar')
const filterRecruiter = ref('')
const filterDepartment = ref('')
const filterOptions = ['White Collar', 'Blue Collar - Sewer', 'Blue Collar - Non-Sewer']
const recruiterOptions = ref([])
const departmentOptions = ref([])

// Dates
const from = ref(dayjs().startOf('year').format('YYYY-MM-DD'))
const to = ref(dayjs().endOf('year').format('YYYY-MM-DD'))
const fromDisplay = ref(dayjs(from.value).format('DD/MM/YYYY'))
const toDisplay = ref(dayjs(to.value).format('DD/MM/YYYY'))
const fromMenu = ref(false)
const toMenu = ref(false)
const updateFromDisplay = () => { fromDisplay.value = dayjs(from.value).format('DD/MM/YYYY'); fromMenu.value = false }
const updateToDisplay = () => { toDisplay.value = dayjs(to.value).format('DD/MM/YYYY'); toMenu.value = false }

// Filters as query
const queryFilters = computed(() => {
  let type = 'White Collar'
  let subType = null
  if (filterType.value === 'Blue Collar - Sewer') {
    type = 'Blue Collar'
    subType = 'Sewer'
  } else if (filterType.value === 'Blue Collar - Non-Sewer') {
    type = 'Blue Collar'
    subType = 'Non-Sewer'
  }

  return {
    type,
    subType,
    recruiter: filterRecruiter.value || null,
    departmentId: filterDepartment.value || null,
    from: from.value,
    to: to.value
  }
})

// Chart data
const sourceData = ref({ labels: [], counts: [] })
const decisionData = ref({ labels: [], counts: [] })
const pipelineData = ref({})
const whiteKpi = ref({})
const sewerKpi = ref({})
const nonSewerKpi = ref({})
const loadingKpi = ref(false)
const showFull = ref(false)

// Dynamic KPI
const currentKpiData = computed(() => {
  if (filterType.value === 'White Collar') return whiteKpi.value
  if (filterType.value === 'Blue Collar - Sewer') return sewerKpi.value
  if (filterType.value === 'Blue Collar - Non-Sewer') return nonSewerKpi.value
  return {}
})

// Fetching
const fetchDashboardStats = async () => {
  try {
    const res = await axios.post('/api/dashboard/stats', queryFilters.value)
    sourceData.value = res.data.sources || { labels: [], counts: [] }
    decisionData.value = res.data.decisions || { labels: [], counts: [] }
    pipelineData.value = res.data.pipeline || {}
  } catch (err) {
    console.error('❌ Dashboard fetch error:', err)
  }
}

const fetchAllKPI = async () => {
  loadingKpi.value = true
  try {
    const base = {
      recruiter: filterRecruiter.value || null,
      departmentId: filterDepartment.value || null,
      from: from.value,
      to: to.value
    }
    const white = await axios.post('/api/dashboard/stats', { ...base, type: 'White Collar' })
    const sewer = await axios.post('/api/dashboard/stats', { ...base, type: 'Blue Collar', subType: 'Sewer' })
    const nonSewer = await axios.post('/api/dashboard/stats', { ...base, type: 'Blue Collar', subType: 'Non-Sewer' })

    whiteKpi.value = white.data.kpi || {}
    sewerKpi.value = sewer.data.kpi || {}
    nonSewerKpi.value = nonSewer.data.kpi || {}
  } catch (err) {
    console.error('❌ KPI fetch error:', err)
  }
  loadingKpi.value = false
}

const fetchRecruiters = async () => {
  try {
    const res = await axios.get('/api/departments/all-recruiters')
    recruiterOptions.value = res.data.recruiters || []
  } catch (err) {
    console.error('❌ Recruiter fetch error:', err)
  }
}

const fetchDepartments = async () => {
  try {
    const res = await axios.get('/api/departments')
    departmentOptions.value = res.data || []
  } catch (err) {
    console.error('❌ Department fetch error:', err)
  }
}


onMounted(async () => {
  fetchDepartments()
  fetchDashboardStats()
  fetchAllKPI()

  try {
    const res = await axios.get('/api/departments/global-recruiters')
    recruiterOptions.value = res.data.map(r => r.name)
  } catch (err) {
    console.error('❌ Failed to fetch recruiters:', err)
  }
})



watch(queryFilters, () => {
  fetchDashboardStats()
  fetchAllKPI()
})
</script>

<style scoped>
.chart-title {
  font-weight: 600;
  font-size: 16px;
  color: #444;
}

.sticky-filter {
  position: sticky;
  top: 64px; /* adjust based on your header height */
  z-index: 10;
  background-color: white;
}
</style>
