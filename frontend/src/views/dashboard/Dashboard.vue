<template>
  <v-container fluid>
    <!-- 🔹 Global Candidate Type Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="filterType"
          :items="filterOptions"
          label="Candidate Type"
          variant="outlined"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- 🔸 Dashboard Charts -->
    <v-row>
      <!-- Donut 1: Application Source -->
      <v-col cols="12" md="6">
        <SourcePie :series="sourceData.counts" :labels="sourceData.labels" />
      </v-col>

      <!-- Donut 2: Final Decision -->
      <v-col cols="12" md="6">
        <FinalDecisionPie
          :series="decisionData.counts"
          :labels="decisionData.labels"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

// 🧩 Dashboard Chart Components
import SourcePie from '@/components/dashboard/SourcePie.vue'
import FinalDecisionPie from '@/components/dashboard/FinalDecisionPie.vue'

// 🎛 Filter state
const filterType = ref('White Collar')
const filterOptions = [
  'White Collar',
  'Blue Collar - Sewer',
  'Blue Collar - Non-Sewer'
]

// 📊 Chart data containers
const sourceData = ref({ labels: [], counts: [] })
const decisionData = ref({ labels: [], counts: [] })

// 🌐 Fetch chart data from backend
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
    console.log('📦 Backend Response:', res.data)

    // ✅ Source pie chart
    sourceData.value = res.data.sources || { labels: [], counts: [] }

    // ✅ Final decision pie chart
    decisionData.value = res.data.decisions || { labels: [], counts: [] }

  } catch (err) {
    console.error('❌ Dashboard fetch error:', err)
  }
}

// ⏱ Load data immediately and on filter change
watch(filterType, fetchDashboardStats, { immediate: true })
onMounted(fetchDashboardStats)
</script>
