<template>
  <v-container fluid>
    <!-- 🔹 Global Filters -->
    <v-row class="mb-4">
      <!-- Candidate Type -->
      <v-col cols="12" md="3">
        <v-select
          v-model="filterType"
          :items="filterOptions"
          label="Candidate Type"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>

      <!-- Recruiter -->
      <v-col cols="12" md="3">
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

      <!-- Department -->
      <v-col cols="12" md="3">
        <v-select
          v-model="filterDepartment"
          :items="departmentOptions"
          item-title="name"
          item-value="_id"
          label="Department"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>

      <!-- From Date -->
      <v-col cols="6" md="1.5">
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
          <v-date-picker
            v-model="from"
            @update:model-value="updateFromDisplay"
            locale="en-GB"
            color="primary"
          />
        </v-menu>
      </v-col>

      <!-- To Date -->
      <v-col cols="6" md="1.5">
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
          <v-date-picker
            v-model="to"
            @update:model-value="updateToDisplay"
            locale="en-GB"
            color="primary"
          />
        </v-menu>
      </v-col>
    </v-row>

    <!-- 🔸 Dashboard Charts -->
    <v-row>
      <v-col cols="12" md="4">
        <SourcePie :series="sourceData.counts" :labels="sourceData.labels" />
      </v-col>
      <v-col cols="12" md="4">
        <FinalDecisionPie :series="decisionData.counts" :labels="decisionData.labels" />
      </v-col>
      <v-col cols="12" md="4">
        <RecruitmentPipelineChart :pipeline="pipelineData" />
      </v-col>

      <!-- Monthly Applications (independent) -->
      <v-col cols="12" md="4">
        <v-card class="pa-2">
          <v-btn
            @click="showFull = true"
            icon="mdi-fullscreen"
            class="float-right mb-2"
            title="Expand"
          />
          <MonthlyApplicationLine />
        </v-card>
      </v-col>
    </v-row>

    <!-- 🔲 Fullscreen -->
    <v-dialog v-model="showFull" fullscreen transition="dialog-bottom-transition" persistent>
      <v-card>
        <v-toolbar flat color="primary" dark>
          <v-toolbar-title>Monthly Applications (Fullscreen)</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showFull = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <MonthlyApplicationLine />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'

import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import RecruitmentPipelineChart from '@/components/dashboard/RecruitmentPipelineChart.vue'
import MonthlyApplicationLine from '@/components/dashboard/MonthlyApplicationLine.vue'

// Filters
const filterType = ref('White Collar')
const filterRecruiter = ref('')
const filterDepartment = ref('')
const recruiterOptions = ref([])
const departmentOptions = ref([])

const filterOptions = ['White Collar', 'Blue Collar - Sewer', 'Blue Collar - Non-Sewer']

// Dates
const from = ref(dayjs().startOf('year').format('YYYY-MM-DD'))
const to = ref(dayjs().endOf('year').format('YYYY-MM-DD'))
const fromDisplay = ref(dayjs(from.value).format('DD/MM/YYYY'))
const toDisplay = ref(dayjs(to.value).format('DD/MM/YYYY'))
const fromMenu = ref(false)
const toMenu = ref(false)

const updateFromDisplay = () => {
  fromDisplay.value = dayjs(from.value).format('DD/MM/YYYY')
  fromMenu.value = false
}
const updateToDisplay = () => {
  toDisplay.value = dayjs(to.value).format('DD/MM/YYYY')
  toMenu.value = false
}

// Chart Data
const sourceData = ref({ labels: [], counts: [] })
const decisionData = ref({ labels: [], counts: [] })
const pipelineData = ref({})
const showFull = ref(false)

// Computed Query
const queryFilters = computed(() => {
  let type = 'White Collar'
  let subType = null
  if (filterType.value.includes('Blue')) {
    type = 'Blue Collar'
    if (filterType.value.includes('Sewer')) subType = 'Sewer'
    else if (filterType.value.includes('Non-Sewer')) subType = 'Non-Sewer'
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

// Fetch Dashboard
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

// Recruiters
const fetchRecruiters = async () => {
  try {
    const res = await axios.get('/api/departments/all-recruiters')
    recruiterOptions.value = res.data.recruiters || []
  } catch (err) {
    console.error('❌ Recruiter fetch error:', err)
  }
}

// Departments
const fetchDepartments = async () => {
  try {
    const res = await axios.get('/api/departments')
    departmentOptions.value = res.data || []
  } catch (err) {
    console.error('❌ Department fetch error:', err)
  }
}

// Init
onMounted(() => {
  fetchRecruiters()
  fetchDepartments()
  fetchDashboardStats()
})
watch(queryFilters, fetchDashboardStats)
</script>

<style scoped>
.chart-title {
  font-weight: 600;
  font-size: 16px;
  color: #444;
}
</style>
