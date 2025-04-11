<template>
  <v-container>
   <!-- White Collar Dashboard -->
   <div class="whitecollar-nav">
      <v-btn :class="currentRoute === 'dashboard' ? 'active-tab' : ''" @click="goTo('/whitecollar/dashboard')">
        Dashboard
      </v-btn>
      <v-btn :class="currentRoute === 'departments' ? 'active-tab' : ''" @click="goTo('/whitecollar/departments')">
        Department
      </v-btn>
      <v-btn :class="currentRoute === 'requisitions' ? 'active-tab' : ''" @click="goTo('/whitecollar/requisitions')">
        Job Requisition
      </v-btn>
      <v-btn :class="currentRoute === 'candidates' ? 'active-tab' : ''" @click="goTo('/whitecollar/candidates')">
        Candidates
      </v-btn>
    </div>
    <v-card class="pa-5" elevation="5">
      <v-card-title>
        White Collar Candidates
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
                  v-model="form.departmentId"
                  :items="departments"
                  item-title="name"
                  item-value="_id"
                  label="Department"
                  @update:modelValue="filterJobRequisitions"
                  required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="form.jobRequisitionId"
                  :items="filteredJobRequisitions"
                  item-title="jobRequisitionId"
                  item-value="_id"
                  label="Job Requisition"
                  required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="form.recruiter"
                  :items="recruiters"
                  label="Recruiter"
                  required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-text-field v-model="form.name" label="Full Name" required />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="form.applicationSource"
                  :items="['LinkedIn', 'Facebook', 'Referral', 'Agency']"
                  label="Application Source"
                  required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="form.hireDecision"
                  :items="['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']"
                  label="Hire Decision"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-file-input
                  multiple
                  label="Upload Documents"
                  @change="handleFileUpload"
                />
              </v-col>

              <v-col cols="12">
                <v-btn type="submit" color="success">Submit</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Search + Table -->
      <v-divider class="my-4" />
      <v-text-field v-model="globalSearch" label="Search" prepend-inner-icon="mdi-magnify" clearable />

      <v-table>
        <thead>
          <tr>
            <th>CANDIDATE ID</th>
            <th>JOB ID</th>
            <th>DEPARTMENT</th>
            <th>JOB APPLIED FOR </th>
            <th>RECRUITER</th>
            <th>CANDIDATE NAME</th>
            <th>SOURCE</th>
            <th v-for="stage in progressStages" :key="stage">{{ stage }}</th>
            <th>HiRED DECISION</th>
            <th>ACTIONS</th>
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

      <!-- Dayjs Date Picker Dialog -->
      <v-dialog v-model="stageDialog.show" max-width="400">
        <v-card class="pa-4">
          <v-card-title class="text-h6">Select {{ stageDialog.stage }} Date</v-card-title>
          <v-card-text>
            <v-date-picker
              color="primary"
              @update:modelValue="val => stageDialog.date = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD')"
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

dayjs.extend(utc)
dayjs.extend(timezone)

const form = ref({
  name: '',
  recruiter: '',
  departmentId: '',
  jobRequisitionId: '',
  applicationSource: '',
  hireDecision: 'Candidate in Process',
  progress: 'Application',
  progressDates: { Application: dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD') },
  documents: []
})

const showForm = ref(false)
const candidates = ref([])
const jobRequisitions = ref([])
const filteredJobRequisitions = ref([])
const departments = ref([])
const recruiters = ref([])
const globalSearch = ref('')
const editingCandidateId = ref(null)
const isEditMode = ref(false)
const filteredCandidates = ref([])
const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => route.path.split('/')[2])

const goTo = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const goToCandidateDetail = (id) => {
  router.push(`/whitecollar/candidates/${id}`)
}


const progressStages = ['APPLIED DATE', 'SENT TO MANAGER', 'INTERVIEWS', 'JOB OFFER', 'HIRED', 'ON BOARD']

const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })

const formatDate = val => val ? dayjs(val).tz('Asia/Phnom_Penh').format('DD/MM/YYYY') : '-'

const stageColor = stage => ({
  Application: 'stage-manager',
  ManagerReview: 'stage-manager',
  Interview: 'stage-interview',
  JobOffer: 'stage-offer',
  Hired: 'stage-hired',
  Onboard: 'stage-onboard'
}[stage] || '')

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
  if (!candidate.progressDates) candidate.progressDates = {}
  candidate.progressDates[stage] = date
  candidate.progress = stage
  try {
    await axios.put(`/api/candidates/${candidate._id}/progress`, {
      newStage: stage,
      progressDate: date
    })
    await fetchCandidates()
    stageDialog.value.show = false
    Swal.fire({
      title: '✅ Updated',
      text: `${stage} stage updated`,
      icon: 'success',
      allowEnterKey: true
    })
  } catch (err) {
    Swal.fire('❌ Error', 'Could not update stage', 'error')
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
    if (isEditMode.value) {
      await axios.put(`/api/candidates/${editingCandidateId.value}`, formData)
      Swal.fire({ title: '✅ Updated', text: 'Candidate updated', icon: 'success', allowEnterKey: true })
    } else {
      await axios.post('/api/candidates', formData)
      Swal.fire({ title: '✅ Created', text: 'Candidate created', icon: 'success', allowEnterKey: true })
    }
    resetForm()
    fetchCandidates()
  } catch (err) {
    console.error(err)
    Swal.fire('❌ Error', 'Submission failed', 'error')
  }
}

const resetForm = () => {
  form.value = {
    name: '', recruiter: '', departmentId: '', jobRequisitionId: '',
    applicationSource: '', hireDecision: 'Candidate in Process',
    progress: 'Application',
    progressDates: { Application: dayjs().tz('Asia/Phnom_Penh').format('YYYY-MM-DD') },
    documents: []
  }
  isEditMode.value = false
  editingCandidateId.value = null
  showForm.value = false
}

const editCandidate = id => {
  const c = candidates.value.find(x => x._id === id)
  if (!c) return
  form.value = {
    name: c.fullName,
    recruiter: c.recruiter,
    departmentId: c.jobRequisitionId?.departmentId?._id || '',
    jobRequisitionId: c.jobRequisitionId?._id || '',
    applicationSource: c.applicationSource,
    hireDecision: c.hireDecision,
    progress: c.progress,
    progressDates: { ...c.progressDates },
    documents: []
  }
  filterJobRequisitions()
  isEditMode.value = true
  editingCandidateId.value = id
  showForm.value = true
}

const deleteCandidate = async id => {
  const confirm = await Swal.fire({
    title: 'Delete?',
    icon: 'warning',
    showCancelButton: true,
    allowEnterKey: true
  })
  if (!confirm.isConfirmed) return
  await axios.delete(`/api/candidates/${id}`)
  await fetchCandidates()
  Swal.fire('Deleted!', '', 'success')
}

const filterCandidates = () => {
  const keyword = globalSearch.value.toLowerCase()
  filteredCandidates.value = candidates.value.filter(c =>
    c.fullName?.toLowerCase().includes(keyword)
  )
}

const filterJobRequisitions = () => {
  filteredJobRequisitions.value = jobRequisitions.value.filter(j =>
    j.departmentId?._id === form.value.departmentId
  )
}
const fetchCandidates = async () => {
  const res = await axios.get('/api/candidates')
  const all = res.data

  const jobId = route.query.jobRequisitionId
  candidates.value = jobId
    ? all.filter(c => c.jobRequisitionId?._id === jobId)
    : all

  filterCandidates()
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('/api/job-requisitions')
  jobRequisitions.value = res.data.filter(j => j.status === 'Vacant')
}

const fetchDepartments = async () => {
  const res = await axios.get('/api/departments?type=White Collar')
  departments.value = res.data
}

const fetchRecruiters = async () => {
  const res = await axios.get('/api/departments/global-recruiters')
  recruiters.value = res.data.map(r => r.name)
}

onMounted(() => {
  fetchCandidates()
  fetchJobRequisitions()
  fetchDepartments()
  fetchRecruiters()
})
</script>

<style scoped>
.v-table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}
.v-table th, .v-table td {
  padding: 8px;
  white-space: nowrap;
}
.stage-btn {
  min-width: 100px;
  font-size: 12px;
}
.stage-manager { background: #e3f2fd; }
.stage-interview { background: #fce4ec; }
.stage-offer { background: #fff3e0; }
.stage-hired { background: #e8f5e9; }
.stage-onboard { background: #e1f5fe; }


/* CSS Navbar */
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
  transition: all 0.25s ease;
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
