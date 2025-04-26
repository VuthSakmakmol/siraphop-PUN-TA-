<template>
  <v-container>
    <v-card class="pa-6 elevation-4">
      <v-card-title class="text-h6 font-weight-bold">Recruitment Dashboard</v-card-title>
      <v-divider class="my-4" />

      <!-- Filters Section -->
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.type"
            :items="['All', 'White Collar', 'Blue Collar - Sewer', 'Blue Collar - Non-Sewer']"
            label="Type"
            outlined dense clearable
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.recruiter"
            :items="recruiters"
            label="Recruiter"
            outlined dense clearable
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.department"
            :items="departments"
            item-title="name"
            item-value="_id"
            label="Department"
            outlined dense clearable
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.jobRequisitionId"
            :items="jobRequisitions"
            item-title="jobRequisitionId"
            item-value="_id"
            label="Job ID"
            outlined dense clearable
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-menu v-model="startMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="filters.start"
                label="Start Date"
                readonly outlined dense
              />
            </template>
            <v-date-picker @update:modelValue="val => { filters.start = formatDate(val); startMenu = false }" />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-menu v-model="endMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="filters.end"
                label="End Date"
                readonly outlined dense
              />
            </template>
            <v-date-picker @update:modelValue="val => { filters.end = formatDate(val); endMenu = false }" />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn color="primary" class="mt-1" block @click="applyFilters">
            Apply Filters
          </v-btn>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn color="grey" class="mt-1" block @click="resetFilters">
            Reset
          </v-btn>
        </v-col>
      </v-row>

      <!-- Charts Section -->
      <v-divider class="my-6" />

      <v-row dense class="flex-wrap">
        <v-col cols="12" md="4">
          <PipelineChart :data="stats.pipeline || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <SourcePie :data="stats.sources || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <FinalDecisionPie :data="stats.decisions || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <MonthlyBarChart :data="stats.monthlyData || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <VacancyKPI :data="stats.kpi || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <FillRateCircle :percentage="stats.kpi?.fillRate || 0" />
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

// ✅ Import Chart Components
import PipelineChart from '@/components/dashboard/PipelineChart.vue'
import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import MonthlyBarChart from '@/components/dashboard/MonthlyBarChart.vue'
import VacancyKPI from '@/components/dashboard/VacancyKPI.vue'
import FillRateCircle from '@/components/dashboard/FillRateCircle.vue'

// ✅ Filters
const filters = ref({
  type: 'All',
  recruiter: '',
  department: '',
  jobRequisitionId: '',
  start: '',
  end: ''
})

const recruiters = ref([])
const departments = ref([])
const jobRequisitions = ref([])

const stats = ref({
  pipeline: {},
  sources: {},
  decisions: {},
  monthlyData: {},
  kpi: {}
})

const startMenu = ref(false)
const endMenu = ref(false)

const formatDate = (val) => val ? dayjs(val).format('YYYY-MM-DD') : ''

const fetchFilters = async () => {
  try {
    const [recRes, deptRes, jobRes] = await Promise.all([
      axios.get('/api/departments/all-recruiters'),
      axios.get('/api/departments'),
      axios.get('/api/job-requisitions')
    ])
    recruiters.value = recRes.data.map(r => r.name || r)
    departments.value = deptRes.data
    jobRequisitions.value = jobRes.data
  } catch (err) {
    console.error('❌ Failed to load filters', err)
  }
}

const fetchDashboardData = async () => {
  try {
    const res = await axios.post('/api/dashboard/summary', filters.value)
    stats.value = res.data
  } catch (err) {
    console.error('❌ Failed to fetch dashboard data', err)
  }
}

const applyFilters = async () => {
  await fetchDashboardData()
}

const resetFilters = async () => {
  filters.value = {
    type: 'All',
    recruiter: '',
    department: '',
    jobRequisitionId: '',
    start: '',
    end: ''
  }
  await fetchDashboardData()
}

onMounted(async () => {
  await fetchFilters()
  await fetchDashboardData()
})
</script>

<style scoped>
.v-select,
.v-text-field {
  min-width: 100%;
}
</style>
