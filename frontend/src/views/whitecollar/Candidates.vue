  <template>
    <v-container>
      <!-- Navbar -->
      <div class="whitecollar-nav">
        <!-- <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">
          Dashboard
        </v-btn> -->
        <!-- <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">
          Department
        </v-btn> -->
        <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">
          Job Openings
        </v-btn>
        <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">
          Candidates
        </v-btn>

        <v-btn
          class="fullview-toggle-btn"
          :color="isCompactView ? 'blue-darken-2' : 'grey-darken-2'"
          variant="flat"
          @click="toggleCompactView"
        >
          {{ isCompactView ? 'Full View' : 'Normal View' }}
        </v-btn>

      </div>


      <v-card class="pa-5 mb-4" elevation="5"
        >
        <v-card-title class="pa-5 mb-4" elevation="5">
          <v-row class="w-100" align-content="center" justify="start" no-gutters dense>
            <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
              <v-btn class="w-100" color="primary" @click="showForm = !showForm">
                {{ showForm ? 'Hide Form' : '➕ Add Candidate' }}
              </v-btn>
            </v-col>

            <v-col cols="12" sm="4" md="3" class="mb-2 mb-sm-0 pr-sm-2">
              <v-text-field
                v-model="globalSearch"
                label="Search Candidate"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
                variant="outlined"
                density="compact"
                class="search-input"
              />
            </v-col>

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
            <v-form @submit.prevent="handleSubmit" class="mt-3">
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
                    placeholder="Type or select job requisition"
                    @update:modelValue="updateRequisitionDetails"
                    required
                    :menu-props="{ maxHeight: '300px' }"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.name" variant="outlined" label="Candidate Name" />
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="form.applicationSource"
                    :items="sources"
                    label="Application Source"
                    clearable
                    variant="outlined"
                    placeholder="Type or select source"
                    :menu-props="{ maxHeight: '300px' }"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="form.hireDecision"
                    :items="computedDecisions"
                    label="Hire Decision"
                    variant="outlined"
                    clearable
                    placeholder="Type or select decision"
                    :disabled="!!form.progressDates?.Onboard"
                    :menu-props="{ maxHeight: '300px' }"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-file-input multiple label="Upload Documents" variant="outlined" @change="handleFileUpload" />
                </v-col>
                <v-col cols="12">
                  <v-btn color="success" type="submit" :loading="isSubmitting">Submit</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-expand-transition>

        <!-- Candidate Table -->
        <!-- Candidate Table -->
      <div :class="['table-wrapper', { 'compact-mode': isCompactView }]">
        <table class="native-table">
          <thead>
            <tr>
              <th>Candidate ID</th>
              <th>Job ID</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Recruiter</th>
              <th>Candidate Name</th>
              <th>Source</th>
              <th v-for="stage in stageLabels" :key="stage">{{ stage }}</th>
              <th>Final Decision</th>
              <th>Current Start Date</th>
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
                <v-tooltip location="top" open-delay="1000">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      class="stage-btn"
                      :class="getStageColorClass(stageMap[label], c.progressDates?.[stageMap[label]], c.hireDecision, jobIsLocked(c))"
                      @click.left="selectDate(c, label)"
                      @click.right.prevent="clearStage(c, label)"
                    >
                      {{ formatDate(c.progressDates?.[stageMap[label]]) || '-' }}
                    </v-btn>
                  </template>
                  <span v-if="jobIsLocked(c)">Locked: Because Another candidate reached Job Offer.</span>
                  <span v-else>Left click: update </span>
                </v-tooltip>
              </td>
              <td>{{ c.hireDecision }}</td>
              <td>
                <span v-if="c.progressDates?.Application && c.progressDates?.Onboard">
                  {{ dayjs(c.progressDates.Onboard).diff(dayjs(c.progressDates.Application), 'day') }} days
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="x-small" flat>Actions</v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="editCandidate(c)">
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
import api from '@/utils/api' // ✅ your centralized API wrapper
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import * as XLSX from 'xlsx'

dayjs.extend(utc)
dayjs.extend(timezone)
const tz = 'Asia/Phnom_Penh'

const route = useRoute()
const router = useRouter()

const alertBox = (icon, title, text = '', html = '') => {
  return Swal.fire({
    icon,
    title,
    text,
    html,
    allowEnterKey: true,
    confirmButtonColor: '#1976d2'
  })
}

const showForm = ref(false)
const isEditMode = ref(false)
const editingCandidateId = ref(null)
const candidates = ref([])
const filteredCandidates = ref([])

const departments = ref([])
const recruiters = ref([])
const globalSearch = ref('')

const currentDate = ref(dayjs().tz(tz).format('YYYY-MM-DD'))

const isCompactView = ref(false)
const toggleCompactView = () => {
  isCompactView.value = !isCompactView.value
}



const stageCounts = ref({
  Application: 0,
  ManagerReview: 0,
  Interview: 0,
  JobOffer: 0,
  Hired: 0,
  Onboard: 0
})

const clearStage = async (c, label) => {
  const backend = stageMap[label]
  const confirm = await Swal.fire({
    title: 'Clear Progress?',
    text: `Do you want to remove "${label}" stage?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, clear it',
    cancelButtonText: 'Cancel',
    allowEnterKey: true
  })

  if (!confirm.isConfirmed) return

  try {
    await api.put(`/candidates/${c._id}/progress`, {
      newStage: backend,
      progressDate: null
    })
    await fetchCandidates()
    await Swal.fire({
      icon: 'success',
      title: '⛔ Cleared',
      text: `${label} stage removed.`,
      allowEnterKey: true
    })
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: '❌ Failed',
      text: err?.response?.data?.message || 'Could not clear stage.',
      allowEnterKey: true
    })
  }
}


setInterval(() => {
  const now = dayjs().tz(tz).format('YYYY-MM-DD')
  if (now !== currentDate.value) {
    currentDate.value = now
    filterCandidates()
  }
}, 60 * 1000)

const isFutureDate = (dateStr) => {
  if (!dateStr) return false
  return dayjs(dateStr).format('YYYY-MM-DD') > currentDate.value
}

const getStageColorClass = (stage, dateStr, hireDecision = '', isLocked = false) => {
  if (['Candidate Refusal', 'Not Hired'].includes(hireDecision)) return 'stage-disabled'; // gray
  if (isLocked) return 'stage-locked'; // gray for locked due to job being full
  if (!dateStr) return 'stage-empty';  // red
  if (isFutureDate(dateStr)) return 'stage-future';
  return 'stage-filled'; // green
}




const jobIsLocked = (c) => {
  const isRestricted = !['JobOffer', 'Hired', 'Onboard'].includes(c.progress)
  const offerReached = c.jobRequisitionId?.status !== 'Vacant'
  return offerReached && isRestricted
}

const stageDialog = ref({ show: false, candidate: null, stage: '', date: '' })
const stageLabels = ['Received Application', 'Sent to Manager', 'Interviews', 'JobOffer', 'Hired', 'Onboard']
const stageMap = {
  'Received Application': 'Application',
  'Sent to Manager': 'ManagerReview',
  'Interviews': 'Interview',
  'JobOffer': 'JobOffer',
  'Hired': 'Hired',
  'Onboard': 'Onboard'
}
const stageDisplayNames = {
  Application: 'Received Application',
  ManagerReview: 'Sent to Manager',
  Interview: 'Interviews',
  JobOffer: 'Job Offer',
  Hired: 'Hired',
  Onboard: 'Onboard'
}

const sources = ['Agency','Banner / Job Announcement Board','Brochure','FIF','Facebook','HR Call','Job Portal','LinkedIn','Telegram','Other']
const decisions = ['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']
const currentRoute = computed(() => route.path.split('/')[2])
const goTo = path => router.push(path)
const goToCandidateDetail = id => router.push(`/whitecollar/candidates/${id}`)


const formatDate = (val) => {
  if (!val) return '-'
  const date = dayjs(val).tz(tz)
  const day = date.format('DD')
  const rawMonth = date.format('MMM').toLowerCase()       // 👉 apr
  const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)  // 👉 Apr
  const year = date.format('YY')
  return `${day}-${month}-${year}`
}

const computedDecisions = computed(() => {
  // Always include current value even if it's 'Hired', but block user from selecting 'Hired'
  return form.value.hireDecision === 'Hired'
    ? decisions
    : decisions.filter(d => d !== 'Hired')
})



const selectDate = async (c, label) => {
  if (jobIsLocked(c)) {
    return alertBox('error', '🔒 Progress Locked', 'Another candidate has already reached Job Offer for this Job ID. Please change Job ID to continue.')
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
  const { candidate, stage, date } = stageDialog.value;
  stageDialog.value.show = false;

  const formatted = dayjs(date).tz(tz).format('YYYY-MM-DD');

  try {
    await api.put(`/candidates/${candidate._id}/progress`, {
      newStage: stage,
      progressDate: formatted
    });

    await fetchCandidates();
    const index = candidates.value.findIndex(c => c._id === candidate._id);
    if (index !== -1) {
      candidates.value[index].progressDates[stage] = formatted;
      candidates.value[index].progress = stage;
    }

    alertBox('success', 'Stage Updated ✅', `Stage "${stageDisplayNames[stage]}" updated.`);
  } catch (err) {
    alertBox('error', '❌ Error', err?.response?.data?.message || 'Progress update failed');
  }
};


const handleFileUpload = files => form.value.documents = Array.isArray(files) ? files : [files]

const isSubmitting = ref(false)

const handleSubmit = async () => {
  // ✅ Validation
  if (!form.value.name.trim()) {
    return alertBox('error', '🚫 Missing Name', 'Candidate name is required.')
  }
  if (!form.value.jobRequisitionId) {
    return alertBox('error', '🚫 Missing Job Requisition', 'Please select a job requisition.')
  }
  if (!form.value.recruiter || form.value.recruiter.trim() === '') {
    return alertBox('error', '🚫 Missing Recruiter', 'Please select a recruiter.')
  }
  if (!form.value.applicationSource) {
    return alertBox('error', '🚫 Missing Source', 'Please select an application source.')
  }

  isSubmitting.value = true

  try {
    const fd = new FormData()

    // Append all form fields except documents
    Object.keys(form.value).forEach(key => {
      if (key !== 'documents') {
        const val = form.value[key]
        fd.append(key, typeof val === 'object' ? JSON.stringify(val) : val)
      }
    })

    // Append document files
    form.value.documents.forEach(file => {
      fd.append('documents', file)
    })

    const method = isEditMode.value ? 'put' : 'post'
    const url = isEditMode.value
      ? `/candidates/${editingCandidateId.value}`
      : `/candidates`

    const res = await api[method](url, fd)
    const updated = res.data.candidate

    // ✅ Update frontend candidate list if in edit mode
    if (isEditMode.value) {
      const jobRes = await api.get(`/job-requisitions/${updated.jobRequisitionId}`)
      updated.jobRequisitionId = jobRes.data

      const index = candidates.value.findIndex(c => c._id === updated._id)
      if (index !== -1) {
        candidates.value[index] = updated
      }
    }

    alertBox('success', '✅ Success', `Candidate ${isEditMode.value ? 'updated' : 'created'} successfully.`)
    resetForm()
    await fetchCandidates()

    // ✅ Scroll to table
    setTimeout(() => {
      document.querySelector('.native-table')?.scrollIntoView({ behavior: 'smooth' })
    }, 300)

  } catch (err) {
    alertBox(
      'error',
      '❌ Submission Failed',
      err?.response?.data?.message || 'Could not save candidate.'
    )
  } finally {
    isSubmitting.value = false
  }
}


const deleteCandidate = async id => {
  const confirm = await Swal.fire({
    title: '🗑️ Delete Candidate?',
    icon: 'warning',
    text: 'Are you sure you want to delete this candidate?',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    allowEnterKey: true,
    confirmButtonColor: '#e53935'
  })
  if (!confirm.isConfirmed) return

  await api.delete(`/candidates/${id}`)
  await fetchCandidates()
  alertBox('success', '✅ Deleted', 'Candidate successfully removed.')
}

const filterCandidates = () => {
  const kw = globalSearch.value?.toLowerCase() || ''
  const jobId = route.query.jobRequisitionId
  const stage = route.query.stage
  filteredCandidates.value = candidates.value.filter(c => {
    const searchable = [
      c.candidateId, c.fullName, c.recruiter, c.jobRequisitionId?.jobRequisitionId,
      c.jobRequisitionId?.departmentId?.name, c.jobRequisitionId?.jobTitle,
      c.applicationSource, c.hireDecision, ...Object.values(c.progressDates || {})
    ].join(' ').toLowerCase()
    return searchable.includes(kw) && (!jobId || c.jobRequisitionId?._id === jobId) && (!stage || c.progress === stage)
  })
}
watch(globalSearch, filterCandidates)

const fetchCandidates = async () => {
  const res = await api.get('/candidates?type=White%20Collar')
  candidates.value = res.data.reverse()
  filterCandidates()

  const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard']
  const counts = Object.fromEntries(stages.map(s => [s, 0]))
  for (const candidate of res.data) {
    if (stages.includes(candidate.progress)) {
      counts[candidate.progress] += 1
    }
  }
  stageCounts.value = counts
}

const fetchDepartments = async () => {
  const res = await api.get('/departments?type=White Collar')
  departments.value = res.data
}

const fetchRecruiters = async () => {
  const res = await api.get('/departments/global-recruiters')
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
  const res = await api.get(`/job-requisitions/${jobId}`)
  const job = res.data
  form.value.department = job.departmentId?.name || ''
  form.value.jobTitle = job.jobTitle || ''
  form.value.recruiter = job.recruiter || ''
}

const fetchJobRequisitions = async () => {
  const res = await api.get('/job-requisitions')
  jobRequisitionOptions.value = res.data
    .filter(j => j.status === 'Vacant' && j.type === 'White Collar')
    .map(j => ({ ...j, displayName: `${j.jobRequisitionId} - ${j.jobTitle}` }))
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
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // ✅ Inject non-vacant job requisition into the list if missing
  const exists = jobRequisitionOptions.value.some(j => j._id === candidate.jobRequisitionId?._id)
  if (!exists && candidate.jobRequisitionId) {
    jobRequisitionOptions.value.push({
      ...candidate.jobRequisitionId,
      displayName: `${candidate.jobRequisitionId.jobRequisitionId} - ${candidate.jobRequisitionId.jobTitle}`
    })
  }
}


watch([jobRequisitionOptions, editingCandidateId], ([jobs, id]) => {
  if (!isEditMode.value || !id || !jobs.length) return
  const candidate = candidates.value.find(c => c._id === id)
  const matchingJob = jobs.find(j => j._id === candidate?.jobRequisitionId?._id)
  if (candidate) {
    form.value = {
      name: candidate.fullName,
      jobRequisitionId: matchingJob?._id || '',
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
})
const exportToExcel = () => {
  const rows = filteredCandidates.value.map(c => ({
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
    'Current Start Date':
      c.progressDates?.Application && c.progressDates?.Onboard
        ? `${dayjs(c.progressDates.Onboard).diff(dayjs(c.progressDates.Application), 'day')} days`
        : '-',
    'Decision': c.hireDecision
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'WhiteCollarCandidates')
  XLSX.writeFile(wb, 'whitecollar_candidates.xlsx')
}

onMounted(() => {
  watch([() => route.query.jobRequisitionId, () => route.query.stage], () => filterCandidates())
  fetchCandidates()
  fetchDepartments()
  fetchJobRequisitions()
  fetchRecruiters()

  // ✅ Auto-select job requisition if passed from query
  const preselectedJobId = route.query.jobRequisitionId
  if (preselectedJobId) {
    showForm.value = true
    form.value.jobRequisitionId = preselectedJobId
    updateRequisitionDetails(preselectedJobId)
  }
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

  .stage-default {
    background-color: #e3f2fd; /* Light blue */
    transition: background-color 0.3s ease;
  }

  .stage-bold {
    background-color: #90caf9; /* Bolder blue */
    font-weight: 600;
    transition: background-color 0.3s ease;
  }

  .stage-future {
    background-color: #ffcdd2; /* Red for future dates */
    font-weight: 600;
    transition: background-color 0.3s ease;
  }

  .table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-top: 16px;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
}

.native-table {
  width: max-content;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;

  /* ✅ Smooth scroll */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS support */
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
  background-color: #989851 !important; /* gray */
  color: #ffffff !important;
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


.fullview-toggle-btn {
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  padding: 6px 16px;
}

.compact-mode {
  font-size: 11px;
  zoom: 0.85;
}

.compact-mode .native-table th,
.compact-mode .native-table td {
  padding: 4px 8px;
  font-size: 11px;
}



  </style>
