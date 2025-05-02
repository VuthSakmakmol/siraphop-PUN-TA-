<template>
    <div class="report-wrapper">
      <table class="report-table">
        <thead>
          <tr>
            <th class="sticky-col sticky-head">Performance</th>
            <th v-for="col in dynamicColumns" :key="col" class="sticky-head">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in reportData"
            :key="index"
            :class="{ 'section-header': row.isHeader }"
          >
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
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import api from '@/utils/api'
  
  const props = defineProps({
    type: { type: String, default: 'All' },
    start: { type: String, default: '' },
    end: { type: String, default: '' }
  })
  
  const reportData = ref([])
  const dynamicColumns = ref([])
  
  const fetchReport = async () => {
    try {
      const res = await api.get('/report', {
        params: {
          view: 'month',
          type: props.type,
          start: props.start,
          end: props.end
        }
      })
      reportData.value = res.data.rows
      dynamicColumns.value = res.data.columns
    } catch (err) {
      console.error('❌ Report fetch failed:', err)
    }
  }
  
  // Fetch on first mount
  fetchReport()
  
  // Refetch when any filter changes
  watch(() => [props.type, props.start, props.end], fetchReport)
  </script>
  
  <style scoped>
  .report-wrapper {
    width: 100%;
    max-height: 70vh;
    overflow-x: auto;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 8px;
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
    text-align: center;
  }
  
  .sticky-head {
    position: sticky;
    top: 0;
    background-color: #e3f2fd;
    z-index: 5;
    font-weight: bold;
    color: #1565c0;
  }
  
  .sticky-col {
    position: sticky;
    left: 0;
    background-color: #f1f8e9;
    z-index: 4;
    font-weight: bold;
    color: #558b2f;
    text-align: left;
  }
  
  .section-header td {
    background-color: #eee;
    font-weight: bold;
    color: #444;
    text-align: left;
  }
  </style>
  