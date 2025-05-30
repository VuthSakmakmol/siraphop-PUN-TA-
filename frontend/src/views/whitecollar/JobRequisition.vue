<template>
  <v-container fluid class="pa-0">
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <!-- <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">Dashboard</v-btn> -->
      <!-- <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">Department</v-btn> -->
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">Job Openings</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">Candidates</v-btn>
    </div>

    <!-- Main Card -->
    <v-card class="pa-5 w-100" elevation="5">
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
              variant="outlined"
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

        <!-- Department -->
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.departmentId"
            :items="departments"
            item-title="name"
            item-value="_id"
            label="Select Department"
            placeholder="Search or select..."
            variant="outlined"
            clearable
            :menu-props="{ maxHeight: '300px' }"
            @update:model-value="onDepartmentChange"
          />
      </v-col>

        <!-- Job Title -->
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.jobTitle"
            label="Job Title"
            :items="jobTitles"
            item-title=""
            item-value=""
            variant="outlined"
            dense
            required
            clearable
            :disabled="!form.departmentId || isEditing || jobTitles.length === 0"
            :menu-props="{ maxHeight: '300px' }"
          />
        </v-col>

        <!-- Recruiter -->
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.recruiter"
            label="Recruiter"
            :items="combinedRecruiters"
            variant="outlined"
            dense
            required
            clearable
            placeholder="Select recruiter"
            :menu-props="{ maxHeight: '300px' }"
          />
        </v-col>

        <!-- Target, Status, Hiring Cost -->
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="form.targetCandidates"
            type="number"
            label="Target Candidates"
            variant="outlined"
            dense
            required
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="form.status"
            label="Status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            dense
            required
            filter
            :menu-props="{ maxHeight: '300px' }"
          />
        </v-col>
        <!-- :class="statusColorClass" -->

        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="form.hiringCost"
            label="Hiring Cost ($)"
            type="number"
            prefix="$"
            variant="outlined"
            dense
          />
        </v-col>

        <!-- Dates -->
        <v-col cols="12" md="3">
          <v-menu v-model="openingDateMenu" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-text-field
                v-model="form.openingDate"
                label="Opening Date"
                readonly
                v-bind="props"
                prepend-inner-icon="mdi-calendar"
                variant="outlined"
                dense
              />
            </template>
            <v-date-picker @update:modelValue="val => {
              form.openingDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD');
              openingDateMenu = false
            }" />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3" v-if="isEditing">
  <v-menu v-model="startDateMenu" :close-on-content-click="false" offset-y>
    <template #activator="{ props }">
      <v-text-field
        v-model="form.startDate"
        label="New Hire Start Date"
        readonly
        v-bind="props"
        prepend-inner-icon="mdi-calendar"
        variant="outlined"
        dense
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
            <tr v-for="item in paginatedRequisitions" :key="item._id">
              <td>{{ item.jobRequisitionId }}</td>
              <td>{{ item.departmentName || '—' }}</td>
              <td>{{ item.jobTitle }}</td>
              <td>{{ formatDate(item.openingDate) }}</td>
              <td>{{ item.recruiter }}</td>
              <td>
                <v-chip
                  size="small"
                  class="cursor-pointer"
                  :class="{
                    'status-vacant': item.status === 'Vacant',
                    'status-filled': item.status === 'Filled',
                    'status-cancel': item.status === 'Cancel',
                    'status-suspended-green': item.status === 'Suspended' && Number(item.offerCount) > 0,
                    'status-suspended-gray': item.status === 'Suspended' && Number(item.offerCount) === 0
                  }"
                  @click="viewStageCandidates(item)"
                >
                  {{ item.status }}
                </v-chip>
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

      <!-- Pagination Controls -->
      <!-- Pagination Controls -->
<div class="pagination-bar d-flex align-center justify-space-between mt-4 px-4 py-2">
  <!-- Rows per page -->
  <v-select
    v-model="itemsPerPage"
    :items="[10, 20, 30, 50, 100]"
    label="Rows per page"
    hide-details
    density="compact"
    variant="outlined"
    style="max-width: 150px;"
    @update:modelValue="() => { page.value = 1; fetchRequisitions() }"
  />

  <!-- Page Info and Arrows -->
    <div class="d-flex align-center gap-2">
        <span class="page-counter">
          Page {{ page }} / {{ totalPages }}
        </span>


        <v-btn
          icon
          variant="text"
          class="no-bg-icon"
          :disabled="page <= 1"
          @click="page--"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <v-btn
          icon
          variant="text"
          class="no-bg-icon"
          :disabled="page >= totalPages"
          @click="page++"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>

      </div>
    </div>
    </v-card>
  </v-container>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/utils/api' // ✅ centralized API import
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useRouter, useRoute } from 'vue-router'


const page = ref(1)
const itemsPerPage = ref(10)
const totalRequisitions = ref(0)


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
const selectedDepartment = ref('')
const departments = ref([])
const searchText = ref('')
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
const formatDisplayDate = val => val ? dayjs(val).format('D-MMM-YY') : ''


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
  const res = await api.get('/job-requisitions', {
    params: {
      type: 'White Collar',
      page: page.value,
      limit: itemsPerPage.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: globalSearch.value,
    }
  })

  jobRequisitions.value = res.data.requisitions || res.data
  totalRequisitions.value = res.data.total || res.data.length || 0

  jobRequisitions.value = jobRequisitions.value.map(j => ({
    ...j,
    remainingCandidates: j.targetCandidates - j.onboardCount,
    departmentName: j.departmentId?.name || '—',
    offerCount: Number(j.offerCount) || 0
  }))
}

watch([page, itemsPerPage], () => {
  fetchRequisitions()
})


const onDepartmentChange = () => {
  const selected = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = selected?.jobTitles || []
  recruiters.value = selected?.recruiters || []

  // Optional: auto-select first recruiter
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
      // if (form.value.status === 'Vacant') {
      //   const check = await api.get(`/candidates/requisition/${editingId.value}/active-offers`)
      //   const offerCount = check.data.count || 0

      //   if (offerCount > 0) {
      //     return alertBox(
      //       'warning',
      //       '⚠ Cannot Change to Vacant',
      //       '',
      //       `There are still <b>${offerCount}</b> candidate(s) in <b>Job Offer</b> stage.<br>Please resolve them before changing status.`
      //     )
      //   }
      // }

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


const formatDate = val => val ? dayjs(val).format('D-MMM-YY') : ''

const filteredRequisitions = computed(() => {
  if (!globalSearch.value) return jobRequisitions.value;

  const keyword = globalSearch.value.toLowerCase();
  return jobRequisitions.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(keyword)
    )
  );
});

// ✅ Pagination slice
const paginatedRequisitions = computed(() => {
  if (globalSearch.value) {
    return filteredRequisitions.value; // Show all filtered results in one page
  }
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredRequisitions.value.slice(start, end);
});
watch(globalSearch, () => {
  page.value = 1; // Always jump to page 1 when searching
});

const totalPages = computed(() => {
  if (globalSearch.value) return 1; // One page for search results
  return Math.max(1, Math.ceil(filteredRequisitions.value.length / itemsPerPage.value));
});

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

onMounted(async () => {
  await fetchDepartments()
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


.status-vacant {
  background-color: #e3f2fd !important;
  color: #1976d2 !important;
  border-radius: 6px;
}

.status-filled {
  background-color: #c8e6c9 !important;
  color: #388e3c !important;
  border-radius: 6px;
}

.status-cancel {
  background-color: #ffcdd2 !important;
  color: #b71c1c !important;
  border-radius: 6px;
}

.status-suspended-green {
  background-color: #eff0af !important;
  color: #535322 !important;
  border-radius: 6px;
}

.status-suspended-gray {
  background-color: #eceae0 !important;
  color: #534b4b !important;
  border-radius: 6px;
}




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



.v-chip {
  box-shadow: none !important;
  text-transform: none;
  background-image: none !important;
}



.v-btn[icon] {
  width: 28px;
  height: 28px;
  min-width: 28px;
}

.pagination-bar {
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.06);
}

.page-counter {
  font-size: 14px;
  font-weight: 500;
}


</style>

