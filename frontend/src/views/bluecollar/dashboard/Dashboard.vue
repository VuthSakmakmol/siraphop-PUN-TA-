<template>
  <v-container>
    <v-card class="pa-5 mb-4">
      <h2 class="text-h6 mb-4">Recruitment Manager Dashboard</h2>
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
          <v-menu v-model="startMenu" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="filters.start"
                label="Start Month"
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
                label="End Month"
                readonly outlined dense
              />
            </template>
            <v-date-picker @update:modelValue="val => { filters.end = formatDate(val); endMenu = false }" />
          </v-menu>
        </v-col>
        <v-col cols="12" md="3">
          <v-btn color="primary" @click="fetchDashboardData">Apply Filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-row dense>
      <v-col cols="12" md="6">
        <PipelineChart :data="stats.pipeline" />
      </v-col>
      <v-col cols="12" md="6">
        <SourcePie :data="stats.sources" />
      </v-col>
      <v-col cols="12" md="6">
        <FinalDecisionPie :data="stats.decisions" />
      </v-col>
      <v-col cols="12" md="6">
        <MonthlyBarChart :data="stats.monthlyData" />
      </v-col>
      <v-col cols="12" md="12">
        <VacancyKPI :data="stats.kpi" />
      </v-col>
      <v-col cols="12" md="4">
        <FillRateCircle :percentage="stats.kpi?.fillRate || 0" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import api from '@/utils/api'

import PipelineChart from '@/components/dashboard/PipelineChart.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import MonthlyBarChart from '@/components/dashboard/MonthlyBarChart.vue'
import SourcePie from '@/components/dashboard/SourcePie.vue'
import VacancyKPI from '@/components/dashboard/VacancyKPI.vue'
import FillRateCircle from '@/components/dashboard/FillRateCircle.vue'

const filters = ref({
  type: 'All',
  recruiter: '',
  department: '',
  jobRequisitionId: '',
  start: '',
  end: ''
})

const startMenu = ref(false)
const endMenu = ref(false)

const recruiters = ref([])
const departments = ref([])
const jobRequisitions = ref([])
const stats = ref({
  pipeline: {},
  decisions: {},
  sources: {},
  monthlyData: {},
  kpi: {}
})

const formatDate = (val) => dayjs(val).format('YYYY-MM-DD')

const fetchFilters = async () => {
  try {
    const [recRes, deptRes, jobRes] = await Promise.all([
    api.get('/departments/all-recruiters'),
    api.get('/departments?type=White Collar'),
    api.get('/job-requisitions')
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
    const res = await api.post('/dashboard/summary', filters.value)
    stats.value = res.data
  } catch (err) {
    console.error('❌ Dashboard load error', err)
  }
}

onMounted(() => {
  fetchFilters()
  fetchDashboardData()
})
</script>
