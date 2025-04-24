<template>
  <v-container>
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <v-btn :class="currentRoute === 'dashboard' ? 'active-tab' : ''" @click="goTo('/bluecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="currentRoute === 'departments' ? 'active-tab' : ''" @click="goTo('/bluecollar/departments')">Department</v-btn>
      <v-btn :class="currentRoute === 'requisitions' ? 'active-tab' : ''" @click="goTo('/bluecollar/requisitions')">Job Openings</v-btn>
      <v-btn :class="currentRoute === 'candidates' ? 'active-tab' : ''" @click="goTo('/bluecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <!-- Toggle Form -->
      <v-card-title>
        <v-row class="w-100" align-content="center" justify="start" no-gutters dense>
          <!-- Create Button -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-btn color="primary" class="w-100" @click="showForm = !showForm">
              {{ showForm ? 'Close Form' : '➕ Create Job Requisition' }}
            </v-btn>
          </v-col>

          <!-- Search Bar -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-text-field
              v-model="globalSearch"
              label="Search..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              density="compact"
              class="search-input"
            />
          </v-col>

          <!-- Export Button -->
          <v-col cols="12" sm="4" md="3">
            <v-btn color="success" variant="outlined" class="w-100" @click="exportToExcel">
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
              <!-- Sub-Type -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="subType"
                  :items="['Sewer', 'Non-Sewer']"
                  label="Select Sub-Type"
                  outlined dense
                  @update:modelValue="fetchDepartments"
                  :disabled="isEditing"
                  required
                />
              </v-col>
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
                  :disabled="!subType || isEditing"
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
      <!-- Job Requisition Table -->
      <v-divider class="my-4" />
<div class="job-table-wrapper">
  <table class="job-sticky-table">
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
      <tr v-for="job in filteredRequisitions" :key="job._id">
        <td>{{ job.jobRequisitionId }}</td>
        <td>{{ job.departmentId?.name }}</td>
        <td>{{ job.jobTitle }}</td>
        <td>{{ formatDisplayDate(job.openingDate) }}</td>
        <td>{{ job.recruiter }}</td>
        <td>
          <v-chip
            size="small"
            class="cursor-pointer"
            :class="{
              'status-vacant': job.status === 'Vacant',
              'status-filled': job.status === 'Filled',
              'status-cancel': job.status === 'Cancel',
              'status-suspended-green': job.status === 'Suspended' && job.offerCount > 0,
              'status-suspended-gray': job.status === 'Suspended' && job.offerCount === 0
            }"
            @click="goToFilteredCandidates(job, job.status)"
          >
            {{ job.status }}
          </v-chip>
        </td>
        <td>{{ formatDisplayDate(job.startDate) }}</td>
        <td>{{ job.hiringCost?.toFixed(2) }}$</td>
        <td>
          <v-btn icon size="x-small" color="blue" @click="editRequisition(job)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="x-small" color="red" @click="deleteRequisition(job._id)">
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
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

const subType = ref(null)
const departments = ref([])
const jobTitles = ref([])
const recruiters = ref([])
const globalRecruiters = ref([])
const combinedRecruiters = computed(() => [...new Set([...recruiters.value, ...globalRecruiters.value])])

const route = useRoute()
const router = useRouter()
const currentRoute = computed(() => route.path.split('/')[2])
const goTo = (path) => router.push(path)
const jobRequisitions = ref([])
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const highlightedCandidateId = ref(route.query.candidateId || null)

const globalSearch = ref('')
const filteredRequisitions = computed(() => {
  if (!globalSearch.value) return jobRequisitions.value
  const keyword = globalSearch.value.toLowerCase()
  return jobRequisitions.value.filter(job =>
    Object.values(job).some(val =>
      String(val).toLowerCase().includes(keyword)
    )
  )
})

const exportToExcel = () => {
  const rows = jobRequisitions.value.map(j => ({
    'Job ID': j.jobRequisitionId,
    'Department': j.departmentId?.name || '',
    'Job Title': j.jobTitle,
    'Recruiter': j.recruiter,
    'Target Candidates': j.targetCandidates,
    'Hiring Cost': j.hiringCost,
    'Status': j.status,
    'Opening Date': formatDisplayDate(j.openingDate),
    'Start Date': formatDisplayDate(j.startDate)
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Requisitions')
  XLSX.writeFile(workbook, 'bluecollar_job_requisitions.xlsx')
}


const form = ref({
  departmentId: '',
  jobTitle: '',
  recruiter: '',
  targetCandidates: 1,
  hiringCost: 0,
  status: 'Vacant',
  openingDate: '',
  startDate: ''
})

const openingDateMenu = ref(false)
const startDateMenu = ref(false)

const statusColorMap = {
  Vacant: 'green-lighten-3',
  Suspended: 'grey-lighten-2',
  Filled: 'yellow-lighten-2',
  Cancel: 'red-lighten-2'
}

const statusOptions = [
  { title: 'Vacant', value: 'Vacant' },
  { title: 'Suspended', value: 'Suspended' },
  { title: 'Filled', value: 'Filled' },
  { title: 'Cancel', value: 'Cancel' }
]

const statusOptionsWithColor = computed(() =>
  statusOptions.filter(s => statusColorMap[s.value])
)

const fetchGlobalRecruiters = async () => {
  const res = await axios.get('/api/departments/global-recruiters')
  globalRecruiters.value = res.data.map(r => r.name)
}

const fetchDepartments = async () => {
  if (!subType.value) return
  const res = await axios.get(`/api/departments?type=Blue Collar&subType=${subType.value}`)
  departments.value = res.data
}

const onDepartmentChange = () => {
  const dept = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = dept?.jobTitles || []
  recruiters.value = dept?.recruiters || []
}

const fetchRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitions.value = res.data
    .filter(j => j.type === 'Blue Collar')
    .map(j => ({
      ...j,
      departmentName: j.departmentId?.name || '—',
      offerCount: Number(j.offerCount) || 0,
      onboardCount: Number(j.onboardCount) || 0
    }))
}



const goToFilteredCandidates = (job, status) => {
  const base = {
    path: '/bluecollar/candidates',
    query: { jobRequisitionId: job._id }
  }

  if (status === 'Vacant') {
    base.query.stages = ['Application', 'ManagerReview', 'Interview'].join(',')
  } else if (status === 'Suspended') {
    base.query.stages = job.offerCount > 0
      ? ['JobOffer', 'Hired'].join(',')
      : ['Application', 'ManagerReview', 'Interview'].join(',')
  } else if (status === 'Filled') {
    base.query.stages = ['Onboard']
  } else if (status === 'Cancel') {
    base.query.stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'].join(',')
  }

  router.push(base)
}

const handleSubmit = async () => {
  const payload = { ...form.value, type: 'Blue Collar' }
  try {
    if (isEditing.value) {
      await axios.put(`/api/job-requisitions/${editingId.value}`, payload)
      await Swal.fire({
        icon: 'success',
        title: '✅ Updated',
        text: 'Job requisition updated',
        allowEnterKey: true
      })
    } else {
      await axios.post('/api/job-requisitions', payload)
      await Swal.fire({
        icon: 'success',
        title: '✅ Created',
        text: 'Job requisition created',
        allowEnterKey: true
      })
    }
    fetchRequisitions()
    resetForm()
    showForm.value = false
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: '❌ Error',
      text: err?.response?.data?.message || 'Failed to submit',
      allowEnterKey: true
    })
  }
}

const editRequisition = (job) => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  isEditing.value = true
  editingId.value = job._id
  subType.value = job.departmentId?.subType || null

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

  fetchDepartments().then(onDepartmentChange)
  showForm.value = true
}

const deleteRequisition = async (id) => {
  const confirm = await Swal.fire({
    title: 'Delete Job Requisition?',
    text: 'Are you sure you want to delete this requisition?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    allowEnterKey: true,
    confirmButtonColor: '#e53935'
  })
  if (confirm.isConfirmed) {
    await axios.delete(`/api/job-requisitions/${id}`)
    await Swal.fire({
      icon: 'success',
      title: '✅ Deleted',
      text: 'Requisition removed',
      allowEnterKey: true
    })
    fetchRequisitions()
  }
}

const resetForm = () => {
  form.value = {
    departmentId: '',
    jobTitle: '',
    recruiter: '',
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

const toggleForm = () => showForm.value = !showForm.value
const formatDate = val => dayjs(val).format('YYYY-MM-DD')
const formatDisplayDate = val => val ? new Date(val).toLocaleDateString() : ''

onMounted(() => {
  fetchGlobalRecruiters()
  fetchRequisitions()
})
</script>


<style scoped>
.v-table {
  white-space: nowrap;
  overflow-x: auto;
}
.v-btn {
  text-transform: none;
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
.status-vacant {
  background-color: #e3f2fd;
  color: #1976d2;
}
.status-filled {
  background-color: #c2e1b4;
  color: #2fc837;
}
.status-cancel {
  background-color: #ffcdd2;
  color: #b71c1c;
}
.status-suspended-green {
  background-color: #939671;
  color: #e6fa06;
}
.status-suspended-gray {
  background-color: #eceae0;
  color: #534b4b;
}

.v-chip {
  border-radius: 9px !important; /* Fully rounded pill */
}

/* table */

.v-table thead th {
  font-weight: bold;
  background-color: #f5f5f5;
}

.v-table tbody td {
  font-weight: normal;
}


.job-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #eee;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
}

.job-sticky-table {
  width: max-content;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
  table-layout: auto;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
}

.job-sticky-table th {
  position: sticky;
  top: 0;
  background-color: #fff;
  font-weight: 600;
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.job-sticky-table td {
  padding: 10px 16px;
  font-weight: 400;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.action-icon {
  padding: 4px;
  margin: 0 2px;
  min-width: 28px;
  height: 28px;
}

.red-icon {
  color: red;
}


.search-input {
  font-size: 13px;
  min-height: 32px !important;
  --v-field-padding-top: 4px;
  --v-field-padding-bottom: 4px;
}
</style>
