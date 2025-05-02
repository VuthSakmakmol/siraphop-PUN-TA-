<template>
  <v-container fluid>
    <!-- 🔹 Global Filters -->
    <v-row class="mb-4">
      <!-- Candidate Type -->
      <v-col cols="12" md="4">
        <v-select
          v-model="filterType"
          :items="filterOptions"
          label="Candidate Type"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>

      <!-- From Date -->
      <v-col cols="6" md="4">
        <v-menu v-model="fromMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-text-field
              v-model="fromDisplay"
              label="From Date"
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
            color="primary"
            locale="en-GB"
          />
        </v-menu>
      </v-col>

      <!-- To Date -->
      <v-col cols="6" md="4">
        <v-menu v-model="toMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-text-field
              v-model="toDisplay"
              label="To Date"
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
            color="primary"
            locale="en-GB"
          />
        </v-menu>
      </v-col>
    </v-row>

    <!-- 🔸 Dashboard Charts -->
    <v-row>
      <!-- Source Pie -->
      <v-col cols="12" md="4">
        <SourcePie :series="sourceData.counts" :labels="sourceData.labels" />
      </v-col>

      <!-- Final Decision -->
      <v-col cols="12" md="4">
        <FinalDecisionPie :series="decisionData.counts" :labels="decisionData.labels" />
      </v-col>

      <!-- Pipeline -->
      <v-col cols="12" md="4">
        <RecruitmentPipelineChart :pipeline="pipelineData" />
      </v-col>

      <!-- Monthly Application Chart -->
      <v-col cols="12" md="4">
        <v-card class="pa-2">
          <v-btn
            @click="showFull = true"
            icon="mdi-fullscreen"
            class="float-right mb-2"
            title="Expand"
          />
          <MonthlyApplicationLine :from="from" :to="to" />
        </v-card>
      </v-col>
    </v-row>

    <!-- 🔲 Fullscreen Monthly Chart -->
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
          <MonthlyApplicationLine :from="from" :to="to" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 🧩 Components
import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'
import RecruitmentPipelineChart from '@/components/dashboard/RecruitmentPipelineChart.vue'
import MonthlyApplicationLine from '@/components/dashboard/MonthlyApplicationLine.vue'

// 🎛 Filters
const filterType = ref('White Collar')
const filterOptions = [
  'White Collar',
  'Blue Collar - Sewer',
  'Blue Collar - Non-Sewer'
]

// 📅 Date values
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

// 📊 Data containers
const sourceData = ref({ labels: [], counts: [] })
const decisionData = ref({ labels: [], counts: [] })
const pipelineData = ref({})

// 📺 Fullscreen dialog toggle
const showFull = ref(false)

// 📡 Fetch dashboard stats (not affected by date)
const fetchDashboardStats = async () => {
  let type = 'White Collar'
  let subType = null

  if (filterType.value.includes('Blue')) {
    type = 'Blue Collar'
    if (filterType.value.includes('Sewer')) subType = 'Sewer'
    if (filterType.value.includes('Non-Sewer')) subType = 'Non-Sewer'
  }

  try {
    const res = await axios.post('/api/dashboard/stats', { type, subType })
    sourceData.value = res.data.sources || { labels: [], counts: [] }
    decisionData.value = res.data.decisions || { labels: [], counts: [] }
    pipelineData.value = res.data.pipeline || {}
  } catch (err) {
    console.error('❌ Dashboard fetch error:', err)
  }
}

// 🔁 Update on candidate type
watch(filterType, fetchDashboardStats, { immediate: true })
onMounted(fetchDashboardStats)
</script>
