<template>
  <v-container>
    <div class="whitecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">
        Dashboard
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">
        Department
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">
        Job Requisition
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">
        Candidates
      </v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <!-- Toggle Button -->
      <v-card-title>
        <v-btn color="primary" @click="showForm = !showForm" class="mr-4">
          {{ showForm ? 'Close Form' : '➕ Create Job Requisition' }}
        </v-btn>
        <v-spacer />
      </v-card-title>

      <!-- Show/Hide Form -->
      <v-expand-transition>
        <div v-if="showForm">
          <v-form @submit.prevent="handleSubmit" class="mt-3 pa-4 rounded-lg elevation-1">
            <v-row dense>
              <!-- Department, Job Title, Recruiter -->
              <v-col cols="12" md="4">
                <v-select v-model="form.departmentId" label="Department" :items="departments" item-title="name" item-value="_id" outlined dense required @update:model-value="onDepartmentChange" :disabled="isEditing" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.jobTitle" label="Job Title" :items="jobTitles" :disabled="!jobTitles.length || isEditing" outlined dense required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.recruiter" label="Recruiter" :items="recruiters" outlined dense required :disabled="!recruiters.length" />
              </v-col>

              <!-- Target, Status, Cost, Dates -->
              <v-col cols="12" md="3">
                <v-text-field v-model.number="form.targetCandidates" type="number" label="Target Candidates" outlined dense required />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.status" label="Status" :items="statusOptions" outlined dense required :class="statusColorClass" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="form.hiringCost" label="Hiring Cost ($)" type="number" prefix="$" outlined dense />
              </v-col>
              <v-col cols="12" md="3">
                <v-menu v-model="openingDateMenu" :close-on-content-click="false" offset-y>
                  <template #activator="{ props }">
                    <v-text-field v-model="form.openingDate" label="Opening Date" readonly v-bind="props" prepend-inner-icon="mdi-calendar" outlined dense :disabled="isEditing" />
                  </template>
                  <v-date-picker @update:modelValue="val => { form.openingDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD'); openingDateMenu = false }" />
                </v-menu>
              </v-col>
              <v-col cols="12" md="3">
                <v-menu v-model="startDateMenu" :close-on-content-click="false" offset-y>
                  <template #activator="{ props }">
                    <v-text-field v-model="form.startDate" label="Start Date" readonly v-bind="props" prepend-inner-icon="mdi-calendar" outlined dense />
                  </template>
                  <v-date-picker @update:modelValue="val => { form.startDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD'); startDateMenu = false }" />
                </v-menu>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn color="success" type="submit" class="mt-2" rounded>
                  {{ isEditing ? 'Update' : 'Create' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Table -->
      <div style="overflow-x: auto;">
        <v-table class="mt-5">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Opening Date</th>
              <th>Recruiter</th>
              <th>Status</th>
              <th>Hiring Cost</th>
              <th>New Hire Start Date</th>
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
                  <router-link
                  :to="{ path: '/whitecollar/candidates', query: { jobRequisitionId: item._id } }"
                  class="status-badge-link"
                  >
                  <span :class="[
                    'status-badge',
                    {
                      'status-vacant': item.status === 'Vacant',
                      'status-suspended': item.status === 'Suspended',
                      'status-filled': item.status === 'Filled',
                      'status-cancel': item.status === 'Cancel'
                    }
                  ]">
                    {{ item.status }}
                  </span>
                </router-link>
              </td>
              <td>{{ item.hiringCost?.toFixed(2) }}$</td>
              <td>{{ formatDate(item.startDate) }}</td>
              <td>
                <div class="action-buttons">
                  <v-btn icon size="small" color="blue" @click="editRequisition(item)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon size="small" color="red" @click="deleteRequisition(item._id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
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
const jobRequisitions = ref([])
const globalSearch = ref('')
const openingDateMenu = ref(false)
const startDateMenu = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const showForm = ref(false)
const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path.split('/')[2])

const goTo = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
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


const fetchDepartments = async () => {
  const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
  departments.value = res.data
}

const onDepartmentChange = () => {
  const selected = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = selected?.jobTitles || []
  recruiters.value = selected?.recruiters || []
}

const fetchRequisitions = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/job-requisitions')
    jobRequisitions.value = res.data.map(j => ({
      ...j,
      remainingCandidates: j.targetCandidates - j.onboardCount,
      departmentName: j.departmentId?.name || '—'
    }))
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates')
  const jobId = route.query.jobRequisitionId
  const allCandidates = res.data

  candidates.value = jobId
    ? allCandidates.filter(c => c.jobRequisitionId?._id === jobId)
    : allCandidates

  filterCandidates()
}

const handleSubmit = async () => {
  const formData = {
    departmentId: form.value.departmentId,
    jobTitle: form.value.jobTitle,
    recruiter: form.value.recruiter,
    targetCandidates: form.value.targetCandidates,
    hiringCost: form.value.hiringCost,
    status: form.value.status,
    openingDate: form.value.openingDate,
    startDate: form.value.startDate
  }

  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:5000/api/job-requisitions/${editingId.value}`, formData)
      Swal.fire('✅ Updated', 'Job requisition updated successfully', 'success')
    } else {
      await axios.post('http://localhost:5000/api/job-requisitions', formData)
      Swal.fire('✅ Created', 'Job requisition created successfully', 'success')
    }

    fetchRequisitions()
    resetForm()
    showForm.value = false
  } catch (error) {
    const msg = error?.response?.data?.message || 'Failed to submit'
    Swal.fire('❌ Error', msg, 'error')
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
    startDate: job.startDate ? dayjs(job.startDate).format('YYYY-MM-DD') : ''
  }
  showForm.value = true
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
}

const deleteRequisition = async (id) => {
  const confirm = await Swal.fire({
    title: 'Delete?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it'
  })
  if (confirm.isConfirmed) {
    await axios.delete(`http://localhost:5000/api/job-requisitions/${id}`)
    Swal.fire('Deleted', 'Requisition removed', 'success')
    fetchRequisitions()
  }
}

const formatDate = (val) => {
  if (!val) return ''
  return new Date(val).toLocaleDateString()
}

const filteredRequisitions = computed(() => {
  if (!globalSearch.value) return jobRequisitions.value
  const keyword = globalSearch.value.toLowerCase()
  return jobRequisitions.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(keyword)
    )
  )
})

const exportToExcel = () => {
  const data = jobRequisitions.value.map(item => ({
    'Job ID': item.jobRequisitionId,
    'Department': item.departmentName,
    'Job Title': item.jobTitle,
    'Target': item.targetCandidates,
    'Onboard': item.onboardCount || 0,
    'Offer': item.offerCount || 0,
    'Remaining': item.remainingCandidates,
    'Hiring Cost ($)': item.hiringCost?.toFixed(2),
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
  saveAs(blob, 'Job_Requisitions.xlsx')
}

onMounted(() => {
  fetchDepartments()
  fetchRequisitions()
})
</script>


<style scoped>
.v-card {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.v-form {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 10px;
}

.v-btn {
  text-transform: none !important;
  margin: 0 auto !important;
  font-weight: 500;
}

.v-table {
  white-space: nowrap;
}

.v-table th,
.v-table td {
  padding: 12px !important;
  vertical-align: middle !important;
  text-align: center !important;
  font-size: 14px;
  justify-content: center;
  align-items: center;
}

.v-table td > * {
  margin: auto; /* Make child elements like buttons center */
  display: flex;
  justify-content: center;
  align-items: center;
}


.v-text-field,
.v-select {
  border-radius: 8px;
}

.v-text-field input,
.v-select input {
  font-size: 14px;
}

.v-card-title {
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 10px;
}

.v-icon {
  font-size: 18px;
}

/* Status */
.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  min-width: 80px;
  text-align: center;
  color: #222;
}
.status-vacant {
  background-color: #a5d6a7;
}
.status-suspended {
  background-color: #eeeeee;
}
.status-filled {
  background-color: #fff59d;
}
.status-cancel {
  background-color: #ef9a9a;
}

/* CSS navbar */
.whitecollar-nav {
  display: flex;
  flex-wrap: wrap; /* Ensures buttons wrap to next line */
  margin-bottom: 24px;
  justify-content: flex-start;
  width: 60%;
}

.whitecollar-nav .v-btn {
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  padding: 6px 20px;
  border-radius: 10px;
  background-color: #f4f7fb;
  color: #1976d2;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  white-space: nowrap; /* Prevent text from wrapping inside button */
  flex-shrink: 0;       /* Prevent buttons from shrinking */
}

.whitecollar-nav .v-btn:hover:not(.active-tab) {
  background-color: #e3f2fd;
  color: #1565c0;
}

.active-tab {
  background-color: #1976d2 !important;
  color: #fff !important;
  font-weight: 600;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}


</style>
