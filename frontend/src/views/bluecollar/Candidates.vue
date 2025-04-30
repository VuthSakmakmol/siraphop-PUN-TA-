<template>
  <v-container>
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/bluecollar/dashboard')">
        Dashboard
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/bluecollar/departments')">
        Department
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/bluecollar/requisitions')">
        Job Openings
      </v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/bluecollar/candidates')">
        Candidates
      </v-btn>
    </div>

    <v-card class="pa-5 mb-4" elevation="5">
      <v-card-title>
        <v-row class="w-100"  align-content="center" justify="start" no-gutters dense>
          <!-- Toggle Form -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-btn class="w-100" color="primary" @click="showForm = !showForm">
              {{ showForm ? 'Hide Form' : '➕ Add Candidate' }}
            </v-btn>
          </v-col>

          <!-- Search Field -->
          <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
            <v-text-field
              v-model="globalSearch"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
              variant="outlined"
              density="compact"
              class="search-input"
            />
          </v-col>

          <!-- Export Excel -->
          <v-col cols="12" sm="4" md="3">
            <v-btn class="w-100" variant="outlined" color="success" @click="exportToExcel">
              <v-icon left>mdi-microsoft-excel</v-icon>
              Export Excel
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>


      <!-- Form -->
      <v-expand-transition>
        <div v-show="showForm">
          <v-form @submit.prevent="handleSubmit" class="mt-4">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="form.jobRequisitionId"
                  :items="jobRequisitionOptions"
                  item-title="displayName"
                  item-value="_id"
                  label="Job Requisition"
                  clearable
                  variant="outlined"
                  placeholder="Search or select..."
                  :menu-props="{ maxHeight: '300px' }"
                  @update:modelValue="updateRequisitionDetails"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.name" variant="outlined" label="Candidate Name" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                    v-model="form.applicationSource"
                    :items="sources"
                    label="Application Source"
                    clearable
                    variant="outlined"
                    placeholder="Search or select..."
                    :menu-props="{ maxHeight: '300px' }"
                    required
                  />              
                </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="form.hireDecision"
                  :items="computedDecisions"
                  label="Hire Decision"
                  clearable
                  variant="outlined"
                  placeholder="Search or select..."
                  :disabled="!!form.progressDates?.Onboard"
                  :menu-props="{ maxHeight: '300px' }"
                />     
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input multiple variant="outlined" label="Upload Documents" @change="handleFileUpload" />
              </v-col>
              <v-col cols="12" class="mb-3">
                <v-btn type="submit" color="success">Submit</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Filters -->
      <!-- <v-divider class="my-4" />
      <div class="d-flex justify-space-between align-center">
        <v-btn color="success" @click="exportToExcel">Export</v-btn>
        <v-text-field v-model="globalSearch" label="Search" prepend-inner-icon="mdi-magnify" clearable />
      </div> -->

      <!-- Candidate Table -->
      <div class="table-wrapper">
        <table class="sticky-table native-table">
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
              <th>Final Decision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCandidates"
              :key="c._id"
              :class="{ 'highlighted-row': c._id === highlightedCandidateId }"
            >
              <td>{{ c.candidateId }}</td>
              <td>{{ c.jobRequisitionId?.jobRequisitionId || '-' }}</td>
              <td>{{ c.jobRequisitionId?.departmentId?.name || '-' }}</td>
              <td>{{ c.jobRequisitionId?.jobTitle || '-' }}</td>
              <td>{{ c.recruiter }}</td>
              <td>{{ c.fullName }}</td>
              <td>{{ c.applicationSource }}</td>
              <td v-for="label in stageLabels" :key="label">
                <v-tooltip v-if="jobIsLocked(c)" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      class="stage-btn"
                      :disabled="true"
                      :class="getStageColorClass(stageMap[label], c.progressDates?.[stageMap[label]], c.hireDecision, true)"
                    >
                      {{ formatDisplayDate(c.progressDates?.[stageMap[label]]) || '-' }}
                    </v-btn>
                  </template>
                  <span>This stage is disabled because another candidate has reached Job Offer or beyond for this Job ID.</span>
                </v-tooltip>

                <v-btn
                  v-else
                  class="stage-btn"
                  :class="getStageColorClass(stageMap[label], c.progressDates?.[stageMap[label]], c.hireDecision, jobIsLocked(c))"
                  @click="selectDate(c, label)"
                >
                  {{ formatDisplayDate(c.progressDates?.[stageMap[label]]) || '-' }}
                </v-btn>
              </td>
              <td>{{ c.hireDecision }}</td>
              <td>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="x-small" flat>Actions</v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="editCandidate(c._id)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="goToCandidateDetail(c._id)">
                      <v-list-item-title>Detail</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="deleteCandidate(c._id)">
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stage Dialog -->
      <v-dialog v-model="stageDialog.show" max-width="400">
        <v-card class="pa-4">
          <v-card-title>Select {{ stageDialog.stage }} Date</v-card-title>
          <v-card-text>
            <v-date-picker
              :max="currentDate"
              :model-value="stageDialog.date"
              @update:modelValue="val => stageDialog.date = dayjs(val).tz(tz).format('YYYY-MM-DD')"
            />
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import * as XLSX from 'xlsx'

dayjs.extend(utc)
dayjs.extend(timezone)
const tz = 'Asia/Phnom_Penh'

const router = useRouter()
const route = useRoute()

const showForm = ref(false)
const isEditMode = ref(false)
const editingCandidateId = ref(null)

const candidates = ref([])
const filteredCandidates = ref([])
const jobRequisitionOptions = ref([])
const recruiters = ref([])
const globalSearch = ref('')
const currentDate = dayjs().tz(tz).format('YYYY-MM-DD')


const jobIdFilter = ref(route.query.jobRequisitionId || null)
const getStageFilter = val => Array.isArray(val) ? val : (val || '').split(',').filter(Boolean)
const stageFilter = ref(getStageFilter(route.query.stages))
const highlightedCandidateId = ref(route.query.candidateId || null)

const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })
const stageLabels = ['Received Application', 'Sent to Manager', 'Interviews', 'Job Offer', 'Hired', 'Onboard']
const stageMap = {
  'Received Application': 'Application',
  'Sent to Manager': 'ManagerReview',
  'Interviews': 'Interview',
  'Job Offer': 'JobOffer',
  'Hired': 'Hired',
  'Onboard': 'Onboard'
}

const sources = ['Agency','Banner / Job Announment Board','Brochure','FIF','Facebook','HR Call','Job Portal','LinkedIn','Telegram','Other']
const decisions = ['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']

const form = ref({
  name: '', jobRequisitionId: '', recruiter: '', department: '', jobTitle: '',
  applicationSource: '', hireDecision: 'Candidate in Process',
  progress: 'Application',
  progressDates: { Application: dayjs().tz(tz).format('YYYY-MM-DD') },
  documents: []
})

const currentRoute = computed(() => route.path.split('/')[2])
const goTo = path => router.push(path)
const goToCandidateDetail = id => router.push(`/bluecollar/candidates/${id}`)

const jobIsLocked = (c, label) => {
  const offerReached = c.jobRequisitionId?.status !== 'Vacant'
  const notReachedYet = !['JobOffer', 'Hired', 'Onboard'].includes(c.progress)
  return offerReached && notReachedYet && stageMap[label] !== c.progress
}

const formatDisplayDate = (val) => {
  if (!val) return '-'
  const date = dayjs(val).tz(tz)
  const day = date.format('DD')
  const month = date.format('MMM')
  const year = date.format('YY')
  return `${day}-${month}-${year}`
}


const computedDecisions = computed(() => {
  return form.value.hireDecision === 'Hired'
    ? decisions
    : decisions.filter(d => d !== 'Hired')
})




const isFutureDate = (dateStr) => {
  if (!dateStr) return false
  return dayjs(dateStr).tz(tz).format('YYYY-MM-DD') > currentDate.value
}

const getStageColorClass = (stage, dateStr, hireDecision = '', isLocked = false) => {
  if (['Candidate Refusal', 'Not Hired'].includes(hireDecision)) return 'stage-disabled'; // gray
  if (isLocked) return 'stage-locked'; // gray for locked due to job being full
  if (!dateStr) return 'stage-empty';  // red
  if (isFutureDate(dateStr)) return 'stage-future';
  return 'stage-filled'; // green
}




const selectDate = async (c, label) => {
  if (jobIsLocked(c, label)) {
    await Swal.fire({
      icon: 'error',
      title: '🔒 Progress Locked',
      text: 'This job offer is already full. Please assign a different Job Requisition to continue.',
      confirmButtonText: 'OK',
      allowEnterKey: true
    })
    return
  }

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
    await api.put(`/candidates/${candidate._id}/progress`, { newStage: stage, progressDate: date })
    await fetchCandidates()
    const index = candidates.value.findIndex(c => c._id === candidate._id)
    if (index !== -1) {
      candidates.value[index].progressDates[stage] = date
      candidates.value[index].progress = stage
    }
    await Swal.fire({
      icon: 'success',
      title: '✅ Updated',
      text: `${stage} updated successfully.`,
      allowEnterKey: true
    })
  } catch (err) {
    const msg = err?.response?.data?.message || 'Progress update failed'
    await Swal.fire({
      icon: 'error',
      title: '❌ Error',
      text: msg,
      allowEnterKey: true
    })
  }
}

const handleFileUpload = files => {
  form.value.documents = Array.isArray(files) ? files : [files]
}

const handleSubmit = async () => {
  const fd = new FormData()
  Object.entries(form.value).forEach(([key, val]) => {
    if (key === 'documents') val.forEach(f => fd.append('documents', f))
    else fd.append(key, val)
  })

  const method = isEditMode.value ? 'put' : 'post'
  const url = isEditMode.value ? `/candidates/${editingCandidateId.value}` : `/candidates`

  try {
    await api[method](url, fd)
    await Swal.fire({
      icon: 'success',
      title: '✅ Success',
      text: `Candidate ${isEditMode.value ? 'updated' : 'created'} successfully.`,
      allowEnterKey: true
    })
    await fetchCandidates()
    if (isEditMode.value) {
      const updated = candidates.value.find(c => c._id === editingCandidateId.value)
      if (updated) form.value.jobRequisitionId = updated.jobRequisitionId?._id || ''
    }
    resetForm()
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: '❌ Submission Failed',
      text: err?.response?.data?.message || 'Could not save candidate.',
      allowEnterKey: true
    })
  }
}

const editCandidate = id => {
  const c = candidates.value.find(x => x._id === id)
  if (!c) return
  form.value = {
    name: c.fullName,
    recruiter: c.recruiter,
    department: c.jobRequisitionId?.departmentId?.name || '',
    jobRequisitionId: jobRequisitionOptions.value.find(j => j._id === c.jobRequisitionId?._id || c.jobRequisitionId)?._id || '',
    jobTitle: c.jobRequisitionId?.jobTitle || '',
    applicationSource: c.applicationSource,
    hireDecision: c.hireDecision,
    progress: c.progress,
    progressDates: { ...c.progressDates },
    documents: []
  }
  isEditMode.value = true
  editingCandidateId.value = id
  showForm.value = true
}

const deleteCandidate = async id => {
  const confirm = await Swal.fire({
    title: '🗑️ Delete Candidate?',
    text: 'Are you sure you want to remove this candidate?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    allowEnterKey: true,
    confirmButtonColor: '#e53935'
  })
  if (!confirm.isConfirmed) return

  await api.delete(`/candidates/${id}`)
  await fetchCandidates()
  await Swal.fire({
    icon: 'success',
    title: '✅ Deleted',
    text: 'Candidate removed successfully.',
    allowEnterKey: true
  })
}

const exportToExcel = () => {
  const rows = candidates.value.map(c => ({
    'Candidate ID': c.candidateId,
    'Job ID': c.jobRequisitionId?.jobRequisitionId || '',
    'Department': c.jobRequisitionId?.departmentId?.name || '',
    'Job Title': c.jobRequisitionId?.jobTitle || '',
    'Recruiter': c.recruiter,
    'Name': c.fullName,
    'Source': c.applicationSource,
    'Application': formatDisplayDate(c.progressDates?.Application),
    'Manager Review': formatDisplayDate(c.progressDates?.ManagerReview),
    'Interview': formatDisplayDate(c.progressDates?.Interview),
    'Job Offer': formatDisplayDate(c.progressDates?.JobOffer),
    'Hired': formatDisplayDate(c.progressDates?.Hired),
    'Onboard': formatDisplayDate(c.progressDates?.Onboard),
    'Decision': c.hireDecision
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BlueCollarCandidates')
  XLSX.writeFile(wb, 'bluecollar_candidates.xlsx')
}

const filterCandidates = () => {
  const search = globalSearch.value?.toLowerCase().trim() || ''
  filteredCandidates.value = candidates.value.filter(c => {
    const matchJob = !jobIdFilter.value || c.jobRequisitionId?._id === jobIdFilter.value
    const matchStage = stageFilter.value.length === 0 || stageFilter.value.includes(c.progress)

    const text = [
      c.candidateId,
      c.fullName,
      c.recruiter,
      c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name,
      c.jobRequisitionId?.jobTitle,
      c.applicationSource,
      c.hireDecision,
      ...Object.values(c.progressDates || {})
    ].join(' ').toLowerCase()

    const matchSearch = !search || text.includes(search)

    return matchJob && matchStage && matchSearch
  })
}

const fetchJobRequisitions = async () => {
  const res = await api.get('/job-requisitions')
  jobRequisitionOptions.value = res.data
    .filter(j => j.type === 'Blue Collar' && j.status === 'Vacant')
    .map(j => ({ ...j, displayName: `${j.jobRequisitionId} - ${j.jobTitle}` }))
}

const fetchCandidates = async () => {
  const res = await api.get('/candidates?type=Blue%20Collar')
  candidates.value = res.data
  filterCandidates()
}

const updateRequisitionDetails = async (jobId) => {
  const res = await api.get(`/job-requisitions/${jobId}`)
  const job = res.data
  form.value.department = job.departmentId?.name || ''
  form.value.jobTitle = job.jobTitle || ''
  form.value.recruiter = job.recruiter || ''
}

const resetForm = () => {
  form.value = {
    name: '',
    jobRequisitionId: '',
    recruiter: '',
    department: '',
    jobTitle: '',
    applicationSource: '',
    hireDecision: 'Candidate in Process',
    progress: 'Application',
    progressDates: { Application: dayjs().tz(tz).format('YYYY-MM-DD') },
    documents: []
  }
  isEditMode.value = false
  editingCandidateId.value = null
  showForm.value = false
}

watch(globalSearch, filterCandidates)

watch(() => route.query, () => {
  jobIdFilter.value = route.query.jobRequisitionId || null
  stageFilter.value = getStageFilter(route.query.stages)
  highlightedCandidateId.value = route.query.candidateId || null
  filterCandidates()
})

onMounted(() => {
  fetchJobRequisitions()
  fetchCandidates()
  // ✅ Auto-select job requisition if passed from URL
  const preselectedJobId = route.query.jobRequisitionId
  if (preselectedJobId) {
    showForm.value = true
    form.value.jobRequisitionId = preselectedJobId
    updateRequisitionDetails(preselectedJobId)
  }
})
</script>




<style scoped>

.v-table {
  overflow-x: auto;
  white-space: nowrap;
}

.v-table th {
  font-weight: bold;
}


.v-table td {
  font-weight: normal; /* Make sure body cells are NOT bold */
  background-color: #fff; /* default bg */
  transition: background-color 0.3s ease;
}

.stage-btn {
  min-width: 100px;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.stage-default {
  background-color: #e3f2fd;
}

.stage-bold {
  background-color: #90caf9;
  font-weight: 600;
}

.stage-future {
  background-color: #ffcdd2;
  font-weight: 600;
}

/* Stage-specific background (optional, if needed later) */
.stage-manager {
  background: #e3f2fd;
}
.stage-interview {
  background: #fce4ec;
}
.stage-offer {
  background: #fff3e0;
}
.stage-hired {
  background: #e8f5e9;
}
.stage-onboard {
  background: #e1f5fe;
}

/* Top Navigation */
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

/* Highlighted Candidate Row */
.highlighted-row {
  background-color: #fdefef !important; /* Soft yellow */
  font-weight: bold;
}


.table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
}

/* Main table setup */
.native-table {
  width: max-content; /* ❗Expands beyond viewport if needed */
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
}

/* Table header */
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

/* Table body */
.native-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 8px 16px;
  font-weight: 400;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

/* Button size inside table */
.stage-btn {
  font-size: 11px;
  padding: 0 8px;
  min-width: 85px;
  height: 30px;
}


.search-input {
  font-size: 13px;
  min-height: 32px !important;
  --v-field-padding-top: 4px;
  --v-field-padding-bottom: 4px;
}


.stage-empty {
  background-color: #fe3a57 !important; /* light red */
  color: #1a0606 !important;
}

.stage-filled {
  background-color: #66bf3f !important; /* light green */
  color: #1b5e20 !important;
  font-weight: 600;
}

.stage-disabled {
  background-color: #f4f46e !important; /* gray */
  color: #2f2a2a !important;
}

.stage-locked {
  background-color: #575555 !important; /* soft gray */
  color: #ffffff !important;
  font-weight: 500;
}


.stage-invalid {
  background-color: #eb3d4f !important; /* soft pink-red */
  color: #e60707 !important;
}






</style>

