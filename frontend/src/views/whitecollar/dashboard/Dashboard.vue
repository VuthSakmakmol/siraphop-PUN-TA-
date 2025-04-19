<template>
  <v-container>
    <v-card class="pa-6" elevation="4">
      <v-card-title class="text-h6 font-weight-bold">Recruitment Dashboard</v-card-title>
      <v-divider class="my-4" />

      <!-- Filters -->
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.type"
            :items="['All', 'White Collar', 'Blue Collar - Sewer', 'Blue Collar - Non-Sewer']"
            label="Type"
            outlined dense
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.recruiter"
            :items="recruiters"
            label="Recruiter"
            clearable outlined dense
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.department"
            :items="departments"
            item-title="name"
            item-value="_id"
            label="Department"
            clearable outlined dense
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="filters.jobRequisitionId"
            :items="jobRequisitions"
            item-title="jobRequisitionId"
            item-value="_id"
            label="Job ID"
            clearable outlined dense
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-menu v-model="startDateMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="filters.start"
                label="Start Date"
                readonly outlined dense
              />
            </template>
            <v-date-picker
              @update:modelValue="val => { filters.start = formatDate(val); startDateMenu = false }"
            />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-menu v-model="endDateMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="filters.end"
                label="End Date"
                readonly outlined dense
              />
            </template>
            <v-date-picker
              @update:modelValue="val => { filters.end = formatDate(val); endDateMenu = false }"
            />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn color="primary" class="mt-1" @click="fetchDashboardStats">Apply Filters</v-btn>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-divider class="my-6" />
      <v-row dense>
        <v-col cols="12" md="4">
          <RecruitmentPipelineChart :data="stats.pipeline || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <SourcePie :data="stats.source || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <FinalDecisionPie :data="stats.decision || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <MonthlyApplicationLine :data="stats.monthly || {}" />
        </v-col>

        <v-col cols="12" md="4">
          <VacancyKPI :data="stats" />
        </v-col>

        <v-col cols="12" md="4">
          <FillRateCircle :fillRate="stats.fillRate || 0" />
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

// Chart components
import RecruitmentPipelineChart from '@/components/dashboard/RecruitmentPipelineChart.vue'
import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import MonthlyApplicationLine from '@/components/dashboard/MonthlyApplicationLine.vue'
import VacancyKPI from '@/components/dashboard/VacancyKPI.vue'
import FillRateCircle from '@/components/dashboard/FillRateCircle.vue'

// Filters & dashboard state
const filters = ref({
  type: 'White Collar',
  recruiter: null,
  department: null,
  jobRequisitionId: null,
  start: '',
  end: ''
})

const recruiters = ref([])
const departments = ref([])
const jobRequisitions = ref([])
const stats = ref({})

// Menu control
const startDateMenu = ref(false)
const endDateMenu = ref(false)

// Format helper
const formatDate = val => val ? dayjs(val).format('YYYY-MM-DD') : ''

// Fetch dropdown values
const fetchFilters = async () => {
  try {
    const [r, d, j] = await Promise.all([
      axios.get('/api/departments/global-recruiters'),
      axios.get('/api/departments'),
      axios.get('/api/job-requisitions')
    ])
    recruiters.value = r.data.map(x => x.name)
    departments.value = d.data
    jobRequisitions.value = j.data
  } catch (err) {
    console.error('❌ Failed to load filter data', err)
  }
}

// Fetch all dashboard stats from a single endpoint
const fetchDashboardStats = async () => {
  try {
    const res = await axios.post('/api/dashboard/stats', filters.value)
    stats.value = res.data
  } catch (err) {
    console.error('❌ Failed to load dashboard stats', err)
  }
}

// Initial load
onMounted(async () => {
  await fetchFilters()
  await fetchDashboardStats()
})
</script>

<style scoped>
.v-select,
.v-text-field {
  min-width: 100%;
}
</style>
