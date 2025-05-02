<template>
  <v-container fluid>
    <!-- Global Filter -->
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

    <!-- Source Chart -->
    <v-row>
      <v-col cols="12" md="6">
        <SourcePie :series="sourceData.counts" :labels="sourceData.labels" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import SourcePie from '@/components/dashboard/SourcePie.vue'

const filterType = ref('White Collar')
const filterOptions = [
  'White Collar',
  'Blue Collar - Sewer',
  'Blue Collar - Non-Sewer'
]

const sourceData = ref({ labels: [], counts: [] })

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
    sourceData.value = res.data.sources || { labels: [], counts: [] }
  } catch (err) {
    console.error('❌ Dashboard fetch error:', err)
  }
}

watch(filterType, fetchDashboardStats, { immediate: true })
onMounted(fetchDashboardStats)
</script>
