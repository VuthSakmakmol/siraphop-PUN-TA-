<template>
  <v-container>
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">Department</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">Job Opening</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <v-card-title>
        White Collar Candidates
        <v-spacer />
        <v-btn color="primary" @click="showForm = !showForm">{{ showForm ? 'Hide Form' : 'Add Candidate' }}</v-btn>
      </v-card-title>

      <!-- Form -->
      <v-expand-transition>
        <div v-show="showForm">
          <v-form @submit.prevent="handleSubmit" class="mt-3">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.jobRequisitionId"
                  :items="jobRequisitionOptions"
                  item-title="displayName"
                  item-value="_id"
                  label="Job Requisition"
                  @update:modelValue="updateRequisitionDetails"
                  required
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.name" label="Candidate Name" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.applicationSource" :items="sources" label="Application Source" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.hireDecision" :items="decisions" label="Hire Decision" />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input multiple label="Upload Documents" @change="handleFileUpload" />
              </v-col>
              <v-col cols="12">
                <v-btn color="success" type="submit">Submit</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Filters -->
      <v-divider class="my-4" />
      <div class="d-flex justify-space-between align-center">
        <v-btn color="success" @click="exportToExcel">Export</v-btn>
        <v-text-field v-model="globalSearch" label="Search" prepend-inner-icon="mdi-magnify" clearable />
      </div>

      <!-- Table -->
      <v-table class="mt-3">
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Job ID</th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Recruiter</th>
            <th>Name</th>
            <th>Source</th>
            <th v-for="stage in stageLabels" :key="stage">{{ stage }}</th>
            <th>Decision</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredCandidates" :key="c._id">
            <td>{{ c.candidateId }}</td>
            <td>{{ c.jobRequisitionId?.jobRequisitionId || '-' }}</td>
            <td>{{ c.jobRequisitionId?.departmentId?.name || '-' }}</td>
            <td>{{ c.jobRequisitionId?.jobTitle || '-' }}</td>
            <td>{{ c.recruiter }}</td>
            <td>{{ c.fullName }}</td>
            <td>{{ c.applicationSource }}</td>
            <td v-for="label in stageLabels" :key="label">
              <v-btn class="stage-btn" :class="stageColor(stageMap[label])" @click="selectDate(c, label)">
                {{ formatDate(c.progressDates?.[stageMap[label]]) || '-' }}
              </v-btn>
            </td>
            <td>{{ c.hireDecision }}</td>
            <td>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" flat>Actions</v-btn>
                </template>
                <v-list>
                  <v-list-item @click="editCandidate(c)"><v-list-item-title>Edit</v-list-item-title></v-list-item>
                  <v-list-item @click="goToCandidateDetail(c._id)"><v-list-item-title>Detail</v-list-item-title></v-list-item>
                  <v-list-item @click="deleteCandidate(c._id)"><v-list-item-title>Delete</v-list-item-title></v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Stage Dialog -->
      <v-dialog v-model="stageDialog.show" max-width="400">
        <v-card class="pa-4">
          <v-card-title>Select {{ stageDialog.stage }} Date</v-card-title>
          <v-card-text>
            <v-date-picker @update:modelValue="val => stageDialog.date = dayjs(val).tz(tz).format('YYYY-MM-DD')" />
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn text @click="stageDialog.show = false">Cancel</v-btn>
            <v-btn color="primary" @click="confirmStageDate">Update</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import * as XLSX from 'xlsx'

dayjs.extend(utc); dayjs.extend(timezone)
const tz = 'Asia/Phnom_Penh'

const route = useRoute()
const router = useRouter()

// State
const showForm = ref(false)
const isEditMode = ref(false)
const editingCandidateId = ref(null)
const candidates = ref([])
const filteredCandidates = ref([])

const departments = ref([])
const recruiters = ref([])
const globalSearch = ref('')


const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })

const stageLabels = ['Recieved Application', 'Sent to Manager', 'Interviews', 'JobOffer', 'Hired', 'Onboard']
const stageMap = {
  'Recieved Application': 'Application',
  'Sent to Manager': 'ManagerReview',
  'Interviews': 'Interview',
  'JobOffer': 'JobOffer',
  'Hired': 'Hired',
  'Onboard': 'Onboard'
}

const stageDisplayNames = {
  Application: 'Recieved Application',
  ManagerReview: 'Sent to Manager',
  Interview: 'Interviews',
  JobOffer: 'Job Offer',
  Hired: 'Hired',
  Onboard: 'Onboard'
}


const stageColor = stage => ({
  Application: 'stage-manager', ManagerReview: 'stage-manager', Interview: 'stage-interview',
  JobOffer: 'stage-offer', Hired: 'stage-hired', Onboard: 'stage-onboard'
}[stage] || '')

const sources = ['FIF','LinkedIn','Facebook','Telegram','Job portal','Agency','Other']
const decisions = ['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']
const currentRoute = computed(() => route.path.split('/')[2])
const goTo = path => router.push(path)
const goToCandidateDetail = id => router.push(`/whitecollar/candidates/${id}`)

const formatDate = val => val ? dayjs(val).tz(tz).format('DD/MM/YYYY') : '-'


// Date Select + Confirm
const selectDate = (c, label) => {
  const backend = stageMap[label]
  stageDialog.value = {
    show: true,
    candidate: c,
    stage: backend,
    date: c.progressDates?.[backend] || dayjs().tz(tz).format('YYYY-MM-DD')
  }
}
const confirmStageDate = async () => {
  const { candidate, stage, date } = stageDialog.value
  stageDialog.value.show = false
  try {
    await axios.put(`/api/candidates/${candidate._id}/progress`, { newStage: stage, progressDate: date })
    const index = candidates.value.findIndex(c => c._id === candidate._id)
    if (index !== -1) {
      candidates.value[index].progressDates[stage] = date
      if (stage !== candidates.value[index].progress) {
        candidates.value[index].progress = stage
      }
    }
    Swal.fire('✅ Updated', `${stageDisplayNames[stage]} updated`, 'success')
  } catch (err) {
    Swal.fire('❌ Error', 'Failed to update stage', 'error')
  }
}

// Form
const handleFileUpload = files => form.value.documents = Array.isArray(files) ? files : [files]


const handleSubmit = async () => {
  const fd = new FormData()
  Object.keys(form.value).forEach(k => {
    if (k !== 'documents') fd.append(k, form.value[k])
  })
  form.value.documents.forEach(d => fd.append('documents', d))

  const method = isEditMode.value ? 'put' : 'post'
  const url = isEditMode.value ? `/api/candidates/${editingCandidateId.value}` : `/api/candidates`
  await axios[method](url, fd)
  Swal.fire('✅ Success', `Candidate ${isEditMode.value ? 'updated' : 'created'}`, 'success')
  resetForm()
  await fetchCandidates()
}



const deleteCandidate = async id => {
  const confirm = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true })
  if (!confirm.isConfirmed) return
  await axios.delete(`/api/candidates/${id}`)
  await fetchCandidates()
  Swal.fire('Deleted', '', 'success')
}

// Filter
const filterCandidates = () => {
  const kw = globalSearch.value.toLowerCase()
  const jobId = route.query.jobRequisitionId
  const stage = route.query.stage

  filteredCandidates.value = candidates.value.filter(c => {
    const matchesSearch = [
      c.candidateId, c.fullName, c.recruiter,
      c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name,
      c.jobRequisitionId?.jobTitle,
      c.applicationSource, c.hireDecision,
      ...Object.values(c.progressDates || {})
    ].join(' ').toLowerCase().includes(kw)

    const matchesJobId = jobId ? c.jobRequisitionId?._id === jobId : true
    const matchesStage = stage ? c.progress === stage : true

    return matchesSearch && matchesJobId && matchesStage
  })
}


// Fetch
const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates')
  candidates.value = res.data
  filterCandidates() // make sure filter runs immediately on updated data
}

const fetchDepartments = async () => {
  const res = await axios.get('/api/departments?type=White Collar')
  departments.value = res.data
}
const fetchRecruiters = async () => {
  const res = await axios.get('/api/departments/global-recruiters')
  recruiters.value = res.data.map(r => r.name)
}


const jobRequisitionOptions = ref([])
const form = ref({
  name: '', jobRequisitionId: '', department: '', jobTitle: '', recruiter: '',
  applicationSource: '', hireDecision: 'Candidate in Process',
  progress: 'Application',
  progressDates: { Application: new Date().toISOString().split('T')[0] },
  documents: []
})

const updateRequisitionDetails = async (jobId) => {
  const res = await axios.get(`/api/job-requisitions/${jobId}`)
  const job = res.data
  form.value.department = job.departmentId?.name || ''
  form.value.jobTitle = job.jobTitle || ''
  form.value.recruiter = job.recruiter || ''
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitionOptions.value = res.data
    .filter(j => j.status === 'Vacant')
    .map(j => ({
      ...j,
      displayName: `${j.jobRequisitionId} - ${j.jobTitle}`
    }))
}

const resetForm = () => {
  form.value = {
    name: '', jobRequisitionId: '', department: '', jobTitle: '', recruiter: '',
    applicationSource: '', hireDecision: 'Candidate in Process',
    progress: 'Application',
    progressDates: { Application: new Date().toISOString().split('T')[0] },
    documents: []
  }
  showForm.value = false
  isEditMode.value = false
  editingCandidateId.value = null
}


const editCandidate = (candidate) => {
  showForm.value = true
  isEditMode.value = true
  editingCandidateId.value = candidate._id

  form.value = {
    name: candidate.fullName,
    jobRequisitionId: candidate.jobRequisitionId?._id || '',
    department: candidate.jobRequisitionId?.departmentId?.name || '',
    jobTitle: candidate.jobRequisitionId?.jobTitle || '',
    recruiter: candidate.recruiter || '',
    applicationSource: candidate.applicationSource,
    hireDecision: candidate.hireDecision,
    progress: candidate.progress,
    progressDates: { ...candidate.progressDates },
    documents: []
  }
}


// Excel Export
const exportToExcel = () => {
  const rows = candidates.value.map(c => ({
    'Candidate ID': c.candidateId,
    'Job ID': c.jobRequisitionId?.jobRequisitionId || '',
    'Department': c.jobRequisitionId?.departmentId?.name || '',
    'Job Title': c.jobRequisitionId?.jobTitle || '',
    'Recruiter': c.recruiter,
    'Name': c.fullName,
    'Source': c.applicationSource,
    'Application': formatDate(c.progressDates?.Application),
    'Manager Review': formatDate(c.progressDates?.ManagerReview),
    'Interview': formatDate(c.progressDates?.Interview),
    'Job Offer': formatDate(c.progressDates?.JobOffer),
    'Hired': formatDate(c.progressDates?.Hired),
    'Onboard': formatDate(c.progressDates?.Onboard),
    'Decision': c.hireDecision
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
  XLSX.writeFile(wb, 'whitecollar_candidates.xlsx')
}

onMounted(() => {
  fetchCandidates()
  fetchDepartments()
  fetchJobRequisitions()
  fetchRecruiters()
})
</script>

<style scoped>
.v-table { overflow-x: auto; white-space: nowrap; }
.v-table th, .v-table td { padding: 8px; }
.stage-btn { min-width: 100px; font-size: 12px; }
.stage-manager { background: #e3f2fd; }
.stage-interview { background: #fce4ec; }
.stage-offer { background: #fff3e0; }
.stage-hired { background: #e8f5e9; }
.stage-onboard { background: #e1f5fe; }

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
</style>
