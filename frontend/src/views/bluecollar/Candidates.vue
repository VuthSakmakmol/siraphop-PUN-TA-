<template>
  <v-container>
    <div class="whitecollar-nav">
      <v-btn :class="currentRoute === 'dashboard' ? 'active-tab' : ''" @click="goTo('/bluecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="currentRoute === 'departments' ? 'active-tab' : ''" @click="goTo('/bluecollar/departments')">Department</v-btn>
      <v-btn :class="currentRoute === 'requisitions' ? 'active-tab' : ''" @click="goTo('/bluecollar/requisitions')">Job Requisition</v-btn>
      <v-btn :class="currentRoute === 'candidates' ? 'active-tab' : ''" @click="goTo('/bluecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <v-card-title>
        Blue Collar Candidates
        <v-spacer />
        <v-btn color="primary" @click="showForm = !showForm">
          {{ showForm ? 'Hide Form' : 'Add Candidate' }}
        </v-btn>
      </v-card-title>

      <v-expand-transition>
        <div v-show="showForm">
          <v-form @submit.prevent="handleSubmit">
            <v-row>
              <v-col cols="12" md="3">
                <v-select v-model="subType" :items="['Sewer', 'Non-Sewer']" label="Sub-Type" required @update:modelValue="fetchDepartments" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.departmentId" :items="departments" item-title="name" item-value="_id" label="Department" @update:modelValue="onDepartmentChange" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.jobTitle" :items="jobTitles" label="Job Title" @update:modelValue="assignBestRequisition" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.recruiter" :items="recruiters" label="Recruiter" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.name" label="Full Name" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.applicationSource" :items="['LinkedIn', 'Facebook', 'Referral', 'Agency']" label="Application Source" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.hireDecision" :items="['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']" label="Hire Decision" />
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

      <v-divider class="my-4" />
      <v-btn color="success" @click="exportToExcel">Export</v-btn>
      <v-text-field v-model="globalSearch" label="Search" prepend-inner-icon="mdi-magnify" clearable />

      <v-table>
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Job ID</th>
            <th>Department</th>
            <th>Job Applied For</th>
            <th>Recruiter</th>
            <th>Candidate Name</th>
            <th>Source</th>
            <th v-for="stage in progressStages" :key="stage">{{ stage }}</th>
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
            <td v-for="stage in progressStages" :key="stage">
              <v-btn class="stage-btn" :class="stageColor(stage)" @click="selectDate(c, stage)">
                {{ formatDate(c.progressDates?.[stage]) || '-' }}
              </v-btn>
            </td>
            <td>{{ c.hireDecision }}</td>
            <td>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" flat color="primary">Actions</v-btn>
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
      </v-table>

      <v-dialog v-model="stageDialog.show" max-width="400">
        <v-card class="pa-4">
          <v-card-title class="text-h6">Select {{ stageDialog.stage }} Date</v-card-title>
          <v-card-text>
            <v-date-picker @update:modelValue="val => stageDialog.date = formatDate(val)" />
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

const router = useRouter()
const route = useRoute()

const subType = ref(null)
const form = ref({
  name: '',
  recruiter: '',
  departmentId: '',
  jobRequisitionId: '',
  jobTitle: '',
  applicationSource: '',
  hireDecision: 'Candidate in Process',
  progress: 'Application',
  progressDates: { Application: dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD') },
  documents: []
})

const departments = ref([])
const jobTitles = ref([])
const recruiters = ref([])
const jobRequisitions = ref([])
const candidates = ref([])
const globalSearch = ref('')
const filteredCandidates = ref([])
const showForm = ref(false)
const isEditMode = ref(false)
const editingCandidateId = ref(null)

const progressStages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard']
const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })

const currentRoute = computed(() => route.path.split('/')[2])
const goTo = path => router.push(path)

const goToCandidateDetail = (id) => {
  router.push(`/bluecollar/candidates/${id}`)
}


const stageColor = stage => ({
  Application: 'stage-manager',
  ManagerReview: 'stage-manager',
  Interview: 'stage-interview',
  JobOffer: 'stage-offer',
  Hired: 'stage-hired',
  Onboard: 'stage-onboard'
}[stage] || '')

const formatDate = val => val ? dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD') : ''
const formatDisplayDate = val => val ? dayjs(val).tz('Asia/Phnom_Penh').format('DD/MM/YYYY') : '-'

const filterCandidates = () => {
  const keyword = globalSearch.value.toLowerCase()
  filteredCandidates.value = candidates.value.filter(c => {
    const allValues = [
      c.candidateId, c.fullName, c.recruiter, c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name, c.jobRequisitionId?.jobTitle,
      c.applicationSource, c.hireDecision, ...(Object.values(c.progressDates || {}))
    ].join(' ').toLowerCase()
    return allValues.includes(keyword)
  })
}
watch(globalSearch, filterCandidates)

const onDepartmentChange = () => {
  const selected = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = selected?.jobTitles || []
}

const assignBestRequisition = () => {
  const matches = jobRequisitions.value
    .filter(j => j.jobTitle === form.value.jobTitle && j.status === 'Vacant')
    .sort((a, b) => (a.offerCount || 0) - (b.offerCount || 0))

  if (matches.length > 0) {
    form.value.jobRequisitionId = matches[0]._id
  } else {
    form.value.jobRequisitionId = ''
    Swal.fire('❌ Full', 'All requisitions for this job title are full.', 'warning')
  }
}

const selectDate = (candidate, stage) => {
  stageDialog.value = {
    show: true,
    candidate,
    stage,
    date: candidate.progressDates?.[stage] || dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD')
  }
}

const confirmStageDate = async () => {
  const { candidate, stage, date } = stageDialog.value
  await axios.put(`/api/candidates/${candidate._id}/progress`, {
    newStage: stage,
    progressDate: date
  })
  stageDialog.value.show = false
  await fetchCandidates()
  Swal.fire('✅ Updated', `${stage} date updated`, 'success')
}

const handleFileUpload = files => {
  form.value.documents = Array.isArray(files) ? files : [files]
}

const handleSubmit = async () => {
  const formData = new FormData()
  for (const key in form.value) {
    if (key !== 'documents') formData.append(key, form.value[key])
  }
  form.value.documents.forEach(doc => formData.append('documents', doc))

  try {
    const res = isEditMode.value
      ? await axios.put(`/api/candidates/${editingCandidateId.value}`, formData)
      : await axios.post('/api/candidates', formData)

    Swal.fire('✅ Success', `Candidate ${isEditMode.value ? 'updated' : 'created'}`, 'success')
    resetForm()
    await fetchCandidates()
  } catch (err) {
    Swal.fire('❌ Error', err?.response?.data?.message || 'Submission failed', 'error')
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    recruiter: '',
    departmentId: '',
    jobRequisitionId: '',
    jobTitle: '',
    applicationSource: '',
    hireDecision: 'Candidate in Process',
    progress: 'Application',
    progressDates: { Application: dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD') },
    documents: []
  }
  showForm.value = false
  isEditMode.value = false
}

const editCandidate = id => {
  const c = candidates.value.find(x => x._id === id)
  if (!c) return
  form.value = {
    name: c.fullName,
    recruiter: c.recruiter,
    departmentId: c.jobRequisitionId?.departmentId?._id || '',
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
  const exportData = candidates.value.map(c => ({
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
    'Hire Decision': c.hireDecision
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
  XLSX.writeFile(wb, 'bluecollar_candidates.xlsx')
}

const fetchDepartments = async () => {
  if (!subType.value) return
  const res = await axios.get(`/api/departments?type=Blue Collar&subType=${subType.value}`)
  departments.value = res.data
}

const fetchRecruiters = async () => {
  const res = await axios.get('/api/departments/global-recruiters')
  recruiters.value = res.data.map(r => r.name)
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitions.value = res.data.filter(j => j.type === 'Blue Collar')
}

const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates')
  const all = res.data.filter(c => c.jobRequisitionId?.type === 'Blue Collar')

  const jobId = route.query.jobRequisitionId
  const stage = route.query.stage

  if (jobId && stage) {
    // Show only one candidate who matches the stage and requisition
    candidates.value = all.filter(
      c => c.jobRequisitionId?._id === jobId && c.progress === stage
    ).slice(0, 1) // ← ⬅️ Only keep 1 candidate
  } else {
    candidates.value = all
  }

  filterCandidates()
}


onMounted(() => {
  fetchCandidates()
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
