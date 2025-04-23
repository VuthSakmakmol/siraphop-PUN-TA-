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
            <td v-for="label in stageLabels" :key="label">
              <v-btn
                class="stage-btn"
                :class="stageColor(stageMap[label])"
                @click="selectDate(c, stageMap[label])"
              >
                {{ formatDate(c.progressDates?.[stageMap[label]]) || '-' }}
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
  jobRequisitionId: '',
  recruiter: '',
  department: '',
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
const jobRequisitionOptions = ref([])


const progressStages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard']
const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })

const currentRoute = computed(() => route.path.split('/')[2])
const goTo = path => router.push(path)

const goToCandidateDetail = (id) => {
  router.push(`/bluecollar/candidates/${id}`)
}

const stageLabels = ['Received Application', 'Sent to Manager', 'Interviews', 'Job Offer', 'Hired', 'Onboard']
const stageMap = {
  'Received Application': 'Application',
  'Sent to Manager': 'ManagerReview',
  'Interviews': 'Interview',
  'Job Offer': 'JobOffer',
  'Hired': 'Hired',
  'Onboard': 'Onboard'
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
  const keyword = globalSearch.value?.toLowerCase() || ''
  filteredCandidates.value = (candidates.value || []).filter(c => {
    const progressDates = c.progressDates || {}
    const allValues = [
      c.candidateId, c.fullName, c.recruiter,
      c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name,
      c.jobRequisitionId?.jobTitle,
      c.applicationSource,
      c.hireDecision,
      ...Object.values(progressDates)
    ].join(' ').toLowerCase()

    return allValues.includes(keyword)
  })
}


watch(globalSearch, filterCandidates)



const selectDate = (c, label) => {
  const backend = label // Already matches your backend stages
  stageDialog.value = {
    show: true,
    candidate: c,
    stage: backend,
    date: c.progressDates?.[backend] || dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD')
  }
}

const confirmStageDate = async () => {
  const { candidate, stage, date } = stageDialog.value
  stageDialog.value.show = false
  try {
    await axios.put(`/api/candidates/${candidate._id}/progress`, {
      newStage: stage,
      progressDate: date
    })
    const index = candidates.value.findIndex(c => c._id === candidate._id)
    if (index !== -1) {
      candidates.value[index].progressDates[stage] = date
      if (progressStages.indexOf(stage) > progressStages.indexOf(candidates.value[index].progress)) {
        candidates.value[index].progress = stage
      }
    }
    Swal.fire('✅ Updated', `${stage} updated`, 'success')
  } catch (err) {
    if (err.response?.status === 409) {
      Swal.fire('⚠️ Limit Reached', err.response.data.message, 'warning')
    } else {
      Swal.fire('❌ Error', 'Progress update failed', 'error')
    }
  }
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

const fetchRecruiters = async () => {
  const res = await axios.get('/api/departments/global-recruiters')
  recruiters.value = res.data.map(r => r.name)
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitionOptions.value = res.data
    .filter(j => j.type === 'Blue Collar' && j.status === 'Vacant')
    .map(j => ({
      ...j,
      displayName: `${j.jobRequisitionId} - ${j.jobTitle}`
    }))
}


const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates?type=Blue%20Collar');
  candidates.value = res.data;
  filterCandidates();
};




const updateRequisitionDetails = async (jobId) => {
  const res = await axios.get(`/api/job-requisitions/${jobId}`)
  const job = res.data
  form.value.department = job.departmentId?.name || ''
  form.value.jobTitle = job.jobTitle || ''
  form.value.recruiter = job.recruiter || ''
}




onMounted(() => {
  fetchCandidates();
  fetchJobRequisitions();
  fetchRecruiters();
});

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
