<template>
  <v-container>
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">Department</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">Job Openings</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">Candidates</v-btn>
    </div>

    <!-- Main Card -->
    <v-card class="pa-5" elevation="5">
      <!-- Toggle Form -->
      
      <!-- Title and Actions -->
      <v-card-title>
        <v-row class="w-100" align-content="center" justify="start" no-gutters dense>
          <!-- Toggle Form -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-btn class="w-100" color="primary" @click="showForm = !showForm">
              {{ showForm ? 'Close Form' : '➕ Create Job Requisition' }}
            </v-btn>
          </v-col>

          <!-- Global Search -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-text-field
              v-model="globalSearch"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
              density="compact"
              class="search-input"
            />
          </v-col>

          <!-- Export -->
          <v-col cols="12" sm="4" md="3">
            <v-btn class="w-100" variant="outlined" color="success" @click="exportToExcel">
              <v-icon left>mdi-microsoft-excel</v-icon>
              Export Excel
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>


      <!-- Create/Edit Form -->
      <v-expand-transition>
        <div v-if="showForm">
          <v-form @submit.prevent="handleSubmit" class="mt-3 pa-4 rounded-lg elevation-1">
            <v-row dense>
              <!-- Department, Job Title, Recruiter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.departmentId"
                  label="Department"
                  :items="departments"
                  item-title="name"
                  item-value="_id"
                  outlined dense
                  required
                  @update:model-value="onDepartmentChange"
                  :disabled="isEditing"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.jobTitle"
                  label="Job Title"
                  :items="jobTitles"
                  :disabled="!jobTitles.length || isEditing"
                  outlined dense required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.recruiter"
                  label="Recruiter"
                  :items="combinedRecruiters"
                  outlined dense required
                  placeholder="Select recruiter"
                />
              </v-col>

              <!-- Target, Status, Hiring Cost -->
              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="form.targetCandidates"
                  type="number"
                  label="Target Candidates"
                  outlined dense required
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="form.status"
                  label="Status"
                  :items="statusOptions"
                  outlined dense required
                  :class="statusColorClass"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="form.hiringCost"
                  label="Hiring Cost ($)"
                  type="number"
                  prefix="$"
                  outlined dense
                />
              </v-col>

              <!-- Opening and Start Dates -->
              <v-col cols="12" md="3">
                <v-menu v-model="openingDateMenu" :close-on-content-click="false" offset-y>
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="form.openingDate"
                      label="Opening Date"
                      readonly
                      v-bind="props"
                      prepend-inner-icon="mdi-calendar"
                      outlined dense
                    />
                  </template>
                  <v-date-picker @update:modelValue="val => {
                    form.openingDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD');
                    openingDateMenu = false
                  }" />
                </v-menu>
              </v-col>
              <v-col cols="12" md="3">
                <v-menu v-model="startDateMenu" :close-on-content-click="false" offset-y>
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="form.startDate"
                      label="Start Date"
                      readonly
                      v-bind="props"
                      prepend-inner-icon="mdi-calendar"
                      outlined dense
                    />
                  </template>
                  <v-date-picker @update:modelValue="val => {
                    form.startDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD');
                    startDateMenu = false
                  }" />
                </v-menu>
              </v-col>

              <!-- Submit Button -->
              <v-col cols="12" md="3">
                <v-btn color="success" type="submit" class="mt-2" rounded>
                  {{ isEditing ? 'Update' : 'Create' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>


      <!-- Requisition Table -->
      <div class="table-wrapper">
        <table class="native-table sticky-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Opening Date</th>
              <th>Recruiter</th>
              <th>Status</th>
              <th>New Hire Start Date</th>
              <th>Hiring Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredRequisitions" :key="item._id">
              <td>{{ item.jobRequisitionId }}</td>
              <td>{{ item.departmentName || '—' }}</td>
              <td>{{ item.jobTitle }}</td>
              <td>{{ formatDate(item.openingDate) }}</td>
              <td>{{ item.recruiter }}</td>
              <td>
                <v-btn variant="text" class="px-0" style="text-transform:none" @click="viewStageCandidates(item)">
                  <span :class="[
                    'status-badge',
                    {
                      'status-vacant': item.status === 'Vacant',
                      'status-filled': item.status === 'Filled',
                      'status-cancel': item.status === 'Cancel',
                      'status-suspended-green': item.status === 'Suspended' && Number(item.offerCount) > 0,
                      'status-suspended-gray': item.status === 'Suspended' && Number(item.offerCount) === 0
                    }
                  ]">
                    {{ item.status }}
                  </span>
                </v-btn>
              </td>
              <td>{{ formatDate(item.startDate) }}</td>
              <td>{{ item.hiringCost?.toFixed(2) }}$</td>
              <td>
                <v-btn icon size="x-small" color="blue" @click="editRequisition(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" color="red" @click="deleteRequisition(item._id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </v-card>
  </v-container>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api' // ✅ centralized API import
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useRouter, useRoute } from 'vue-router'

dayjs.extend(utc)
dayjs.extend(timezone)

const form = ref({
  departmentId: '',
  jobTitle: '',
  recruiter: '',
  type: 'White Collar',
  targetCandidates: 1,
  hiringCost: 0,
  status: 'Vacant',
  openingDate: '',
  startDate: ''
})

const departments = ref([])
const jobTitles = ref([])
const recruiters = ref([])
const globalRecruiters = ref([])

const combinedRecruiters = computed(() => {
  return [...new Set([...recruiters.value, ...globalRecruiters.value])]
})

const jobRequisitions = ref([])
const globalSearch = ref('')
const openingDateMenu = ref(false)
const startDateMenu = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const showForm = ref(false)
const exportInProgress = ref(false)
const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path.split('/')[2])
const goTo = (path) => {
  if (route.path !== path) router.push(path)
}

const statusColorClass = computed(() => {
  switch (form.value.status) {
    case 'Vacant': return 'bg-green-lighten-3'
    case 'Suspended': return 'bg-grey-lighten-2'
    case 'Filled': return 'bg-yellow-lighten-2'
    case 'Cancel': return 'bg-red-lighten-2'
    default: return ''
  }
})

const statusOptions = [
  { title: 'Vacant', value: 'Vacant' },
  { title: 'Suspended', value: 'Suspended' },
  { title: 'Filled', value: 'Filled' },
  { title: 'Cancel', value: 'Cancel' }
]

const alertBox = (icon, title, text, html = '') => {
  return Swal.fire({
    icon,
    title,
    text,
    html,
    allowEnterKey: true,
    confirmButtonColor: '#1976d2'
  })
}

const fetchDepartments = async () => {
  const res = await api.get('/departments?type=White Collar')
  departments.value = res.data
}

const fetchGlobalRecruiters = async () => {
  const res = await api.get('/departments/global-recruiters')
  globalRecruiters.value = res.data.map(r => r.name)
}

const fetchRequisitions = async () => {
  const res = await api.get('/job-requisitions')
  jobRequisitions.value = res.data
    .filter(j => j.type === 'White Collar')
    .map(j => ({
      ...j,
      remainingCandidates: j.targetCandidates - j.onboardCount,
      departmentName: j.departmentId?.name || '—',
      offerCount: Number(j.offerCount) || 0
    }))
}

const onDepartmentChange = () => {
  const selected = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = selected?.jobTitles || []
  recruiters.value = selected?.recruiters || []
  if (!form.value.recruiter && combinedRecruiters.value.length > 0) {
    form.value.recruiter = combinedRecruiters.value[0]
  }
}

const exportToExcel = () => {
  if (exportInProgress.value) return
  exportInProgress.value = true

  Swal.fire({
    title: '⏳ Preparing Export',
    text: 'Generating Excel file...',
    timer: 1000,
    icon: 'info',
    showConfirmButton: false
  })

  try {
    const data = jobRequisitions.value.map(item => ({
      'Job ID': item.jobRequisitionId,
      'Department': item.departmentName,
      'Job Title': item.jobTitle,
      'Recruiter': item.recruiter,
      'Target': item.targetCandidates,
      'Hiring Cost': item.hiringCost,
      'Status': item.status,
      'Opening Date': formatDate(item.openingDate),
      'Start Date': formatDate(item.startDate)
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Requisitions')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, 'White_Collar_Job_Requisitions.xlsx')
  } finally {
    exportInProgress.value = false
  }
}

const handleSubmit = async () => {
  const payload = { ...form.value }

  if (!payload.departmentId || !payload.jobTitle) {
    return alertBox('warning', '⚠ Required Fields Missing', 'Please select a department and job title.')
  }

  if (!payload.recruiter) {
    return alertBox('warning', '⚠ Missing Recruiter', 'Please select a recruiter before submitting.')
  }

  try {
    if (isEditing.value) {
      if (form.value.status === 'Vacant') {
        const check = await api.get(`/candidates/requisition/${editingId.value}/active-offers`)
        const offerCount = check.data.count || 0

        if (offerCount > 0) {
          return alertBox(
            'warning',
            '⚠ Cannot Change to Vacant',
            '',
            `There are still <b>${offerCount}</b> candidate(s) in <b>Job Offer</b> stage.<br>Please resolve them before changing status.`
          )
        }
      }

      await api.put(`/job-requisitions/${editingId.value}`, payload)
      await alertBox('success', '✅ Updated', 'Job requisition updated successfully.')
    } else {
      await api.post('/job-requisitions', payload)
      await alertBox('success', '✅ Created', 'Job requisition created successfully.')
    }

    fetchRequisitions()
    resetForm()
    showForm.value = false
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to submit'
    await alertBox('error', '❌ Submission Error', msg)
  }
}

const editRequisition = (job) => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  isEditing.value = true
  editingId.value = job._id
  form.value = {
    departmentId: job.departmentId._id || job.departmentId,
    jobTitle: job.jobTitle,
    recruiter: job.recruiter,
    targetCandidates: job.targetCandidates,
    hiringCost: job.hiringCost,
    status: job.status,
    openingDate: dayjs(job.openingDate).format('YYYY-MM-DD'),
    startDate: dayjs(job.startDate).format('YYYY-MM-DD')
  }
  showForm.value = true
  onDepartmentChange()
}

const deleteRequisition = async (id) => {
  const confirm = await Swal.fire({
    title: '🗑️ Confirm Deletion',
    text: 'Are you sure you want to delete this job requisition?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    allowEnterKey: true,
    confirmButtonColor: '#e53935'
  })

  if (!confirm.isConfirmed) return

  try {
    await api.delete(`/job-requisitions/${id}`)
    await alertBox('success', '✅ Deleted', 'Job requisition has been removed.')
    fetchRequisitions()
  } catch (err) {
    const msg = err?.response?.data?.message || '❌ Failed to delete job requisition'
    await alertBox('error', '❌ Cannot Delete', msg)
  }
}

const resetForm = () => {
  form.value = {
    departmentId: '',
    jobTitle: '',
    recruiter: '',
    type: 'White Collar',
    targetCandidates: 1,
    hiringCost: 0,
    status: 'Vacant',
    openingDate: '',
    startDate: ''
  }
  isEditing.value = false
  editingId.value = null
  jobTitles.value = []
  recruiters.value = []
}

const formatDate = val => val ? new Date(val).toLocaleDateString() : ''

const filteredRequisitions = computed(() => {
  if (!globalSearch.value) return jobRequisitions.value
  const keyword = globalSearch.value.toLowerCase()
  return jobRequisitions.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(keyword)
    )
  )
})

const viewStageCandidates = (item) => {
  const base = {
    path: '/whitecollar/candidates',
    query: { jobRequisitionId: item._id }
  }

  switch (item.status) {
    case 'Vacant':
      base.query.stages = ['Application', 'ManagerReview', 'Interview'].join(',')
      break
    case 'Suspended':
      base.query.stages = item.offerCount > 0
        ? ['JobOffer', 'Hired'].join(',')
        : ['Application', 'ManagerReview', 'Interview'].join(',')
      break
    case 'Filled':
      base.query.stages = ['Onboard']
      break
    case 'Cancel':
      base.query.stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'].join(',')
      break
    default:
      base.query.stages = ''
  }

  router.push(base)
}

onMounted(() => {
  fetchDepartments()
  fetchRequisitions()
  fetchGlobalRecruiters()
})
</script>


<style scoped>
.v-btn {
  text-transform: none !important;
}

.v-table {
  white-space: nowrap;
  overflow-x: auto;
}
.whitecollar-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.whitecollar-nav .v-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  padding: 6px 18px;
  background-color: #f1f5fb;
  color: #1976d2;
}
.whitecollar-nav .v-btn:hover:not(.active-tab) {
  background-color: #e3f2fd;
  color: #1565c0;
}
.active-tab {
  background-color: #1976d2 !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.status-badge {
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}
.status-vacant {
  background-color: #e3f2fd;
  color: #1976d2;
}
.status-filled {
  background-color: #c8e6c9;
  color: #388e3c;
}
.status-cancel {
  background-color: #ffcdd2;
  color: #b71c1c;
}
.status-suspended-green {
  background-color: #eff0af;
  color: #535322;
}

.status-suspended-gray {
  background-color: #f2f2f2;
  color: #777;
}
/* .status-suspended-yellow {
  background-color: #fff8e1;
  color: #5c4117;
} */

.table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.native-table {
  width: max-content;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;
}

.native-table th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  font-weight: 600;
  padding: 8px 16px;
  white-space: nowrap;
  border-bottom: 1px solid #ccc;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.native-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 8px 16px;
  font-weight: 400;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.v-btn[icon] {
  width: 28px;
  height: 28px;
  min-width: 28px;
}

</style>

