<template>
  <v-container>
    <!-- Navbar -->
    <div class="whitecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/bluecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/bluecollar/departments')">Department</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/bluecollar/requisitions')">Job Requisition</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/bluecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <v-card-title>
        Blue Collar Candidates
        <v-spacer />
        <v-btn color="primary" @click="showForm = !showForm">
          {{ showForm ? 'Hide Form' : 'Add Candidate' }}
        </v-btn>
      </v-card-title>

      <!-- Form -->
      <v-expand-transition>
        <div v-show="showForm">
          <v-form @submit.prevent="handleSubmit" class="mt-4">
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
              <v-col cols="12" md="4">
                <v-text-field v-model="form.name" label="Candidate Name" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.applicationSource" :items="sources" label="Application Source" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.hireDecision" :items="decisions" label="Hire Decision" />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input multiple label="Upload Documents" @change="handleFileUpload" />
              </v-col>
              <v-col cols="12">
                <v-btn type="submit" color="success">Submit</v-btn>
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

      <!-- Candidate Table -->
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
            <th>Final Decision</th>
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
              <v-tooltip v-if="jobIsLocked(c, label)" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="stage-btn"
                    :disabled="true"
                    :class="getStageColorClass(stageMap[label], c.progressDates?.[stageMap[label]])"
                  >
                    {{ formatDisplayDate(c.progressDates?.[stageMap[label]]) || '-' }}
                  </v-btn>
                </template>
                <span>This job offer is full. Please change Job ID to continue.</span>
              </v-tooltip>
              <v-btn
                v-else
                class="stage-btn"
                :class="getStageColorClass(stageMap[label], c.progressDates?.[stageMap[label]])"
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
                  <v-list-item @click="editCandidate(c._id)"><v-list-item-title>Edit</v-list-item-title></v-list-item>
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
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

const sources = ['LinkedIn', 'Facebook', 'Referral', 'Agency', 'Telegram', 'Job portal']
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

const getStageColorClass = (stage, dateStr) => {
  if (!dateStr) return 'stage-default'
  const current = dayjs().tz(tz).format('YYYY-MM-DD')
  const isFuture = dayjs(dateStr).format('YYYY-MM-DD') > current
  return isFuture ? 'stage-future' : 'stage-bold'
}

const formatDisplayDate = val => val ? dayjs(val).tz(tz).format('DD/MM/YYYY') : '-'

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
    await axios.put(`/api/candidates/${candidate._id}/progress`, { newStage: stage, progressDate: date })
    const index = candidates.value.findIndex(c => c._id === candidate._id)
    if (index !== -1) {
      candidates.value[index].progressDates[stage] = date
      candidates.value[index].progress = stage
    }
    Swal.fire('✅ Updated', `${stage} updated`, 'success')
  } catch (err) {
    const msg = err?.response?.data?.message || 'Progress update failed'
    Swal.fire('❌ Error', msg, 'error')
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
  const url = isEditMode.value ? `/api/candidates/${editingCandidateId.value}` : `/api/candidates`

  let updateSuccess = false

  try {
    await axios[method](url, fd)
    updateSuccess = true
    Swal.fire('✅ Success', `Candidate ${isEditMode.value ? 'updated' : 'created'}`, 'success')
  } catch (err) {
    Swal.fire('❌ Error', err?.response?.data?.message || 'Submission failed', 'error')
  }

  if (updateSuccess) {
    await fetchCandidates()

    // 🧠 Optional fix to refresh job ID in form after editing
    if (isEditMode.value) {
      const updated = candidates.value.find(c => c._id === editingCandidateId.value)
      if (updated) form.value.jobRequisitionId = updated.jobRequisitionId?._id || ''
    }

    resetForm()
  }
}


const editCandidate = id => {
  const c = candidates.value.find(x => x._id === id)
  if (!c) return
  form.value = {
    name: c.fullName,
    recruiter: c.recruiter,
    department: c.jobRequisitionId?.departmentId?.name || '',
    jobRequisitionId: c.jobRequisitionId?._id || '',
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
  const confirm = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true })
  if (!confirm.isConfirmed) return
  await axios.delete(`/api/candidates/${id}`)
  await fetchCandidates()
  Swal.fire('Deleted', '', 'success')
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
  const kw = globalSearch.value?.toLowerCase() || ''
  filteredCandidates.value = candidates.value.filter(c => {
    const search = [
      c.candidateId, c.fullName, c.recruiter, c.applicationSource,
      c.jobRequisitionId?.jobTitle, c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name,
      ...Object.values(c.progressDates || {})
    ].join(' ').toLowerCase()
    return search.includes(kw)
  })
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitionOptions.value = res.data
    .filter(j => j.type === 'Blue Collar')
    .map(j => ({ ...j, displayName: `${j.jobRequisitionId} - ${j.jobTitle}` }))
}

const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates?type=Blue%20Collar')
  candidates.value = res.data
  filterCandidates()
}

const updateRequisitionDetails = async (jobId) => {
  const res = await axios.get(`/api/job-requisitions/${jobId}`)
  const job = res.data
  form.value.department = job.departmentId?.name || ''
  form.value.jobTitle = job.jobTitle || ''
  form.value.recruiter = job.recruiter || ''
}

watch(globalSearch, filterCandidates)

onMounted(() => {
  fetchJobRequisitions()
  fetchCandidates()
})
</script>

<style scoped>
.v-table {
  overflow-x: auto;
  white-space: nowrap;
}
.v-table th,
.v-table td {
  padding: 8px;
}
.stage-btn {
  min-width: 100px;
  font-size: 12px;
}
.stage-default {
  background-color: #e3f2fd;
  transition: background-color 0.3s ease;
}
.stage-bold {
  background-color: #90caf9;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
.stage-future {
  background-color: #ffcdd2;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
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
