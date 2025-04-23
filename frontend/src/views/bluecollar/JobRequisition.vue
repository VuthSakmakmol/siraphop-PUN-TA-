<template>
  <v-container>
    <!-- Navigation Tabs -->
    <div class="whitecollar-nav">
      <v-btn :class="currentRoute === 'dashboard' ? 'active-tab' : ''" @click="goTo('/bluecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="currentRoute === 'departments' ? 'active-tab' : ''" @click="goTo('/bluecollar/departments')">Department</v-btn>
      <v-btn :class="currentRoute === 'requisitions' ? 'active-tab' : ''" @click="goTo('/bluecollar/requisitions')">Job Openings</v-btn>
      <v-btn :class="currentRoute === 'candidates' ? 'active-tab' : ''" @click="goTo('/bluecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <v-card-title>
        <v-btn color="primary" @click="toggleForm">
          {{ showForm ? 'Close Form' : '➕ Create Job Requisition' }}
        </v-btn>
      </v-card-title>

      <v-expand-transition>
        <div v-if="showForm">
          <v-form @submit.prevent="handleSubmit" class="pa-4">
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

              <!-- Department -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.departmentId"
                  :items="departments"
                  item-title="name"
                  item-value="_id"
                  label="Department"
                  outlined dense
                  :disabled="!subType || isEditing"
                  @update:modelValue="onDepartmentChange"
                  required
                />
              </v-col>

              <!-- Job Title -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.jobTitle"
                  :items="jobTitles"
                  label="Job Title"
                  outlined dense
                  :disabled="!jobTitles.length || isEditing"
                  required
                />
              </v-col>

              <!-- Recruiter -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.recruiter"
                  :items="combinedRecruiters"
                  label="Recruiter"
                  outlined dense
                  :disabled="!combinedRecruiters.length"
                  required
                />
              </v-col>

              <!-- Target, Status, Cost -->
              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="form.targetCandidates"
                  label="Target"
                  type="number"
                  outlined dense required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="form.status"
                  :items="statusOptionsWithColor"
                  item-title="title"
                  item-value="value"
                  label="Status"
                  outlined
                  dense
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-chip :color="statusColorMap[item.value]" size="small" variant="flat">
                        {{ item.title }}
                      </v-chip>
                    </v-list-item>
                  </template>

                  <template #selection="{ item }">
                    <v-chip :color="statusColorMap[item.value]" size="small" variant="flat">
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>


              <v-col cols="12" md="3">
                <v-text-field
                  v-model.number="form.hiringCost"
                  label="Cost ($)"
                  prefix="$"
                  type="number"
                  outlined dense
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
                      outlined dense
                    />
                  </template>
                  <v-date-picker @update:modelValue="val => { form.openingDate = formatDate(val); openingDateMenu = false }" />
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
                      outlined dense
                    />
                  </template>
                  <v-date-picker @update:modelValue="val => { form.startDate = formatDate(val); startDateMenu = false }" />
                </v-menu>
              </v-col>

              <!-- Submit -->
              <v-col cols="12" md="3">
                <v-btn color="success" type="submit" class="mt-2">
                  {{ isEditing ? 'Update' : 'Create' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Table -->
      <v-divider class="my-4" />
      <v-table>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Status</th>
            <th>Opening</th>
            <th>Start</th>
            <th>Recruiter</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobRequisitions" :key="job._id">
            <td>{{ job.jobRequisitionId }}</td>
            <td>{{ job.departmentId?.name }}</td>
            <td>{{ job.jobTitle }}</td>
            <td>
              <v-chip
                :color="statusColorMap[job.status]"
                class="cursor-pointer"
                size="small"
                variant="flat"
                @click="goToFilteredCandidates(job, job.status)"
              >
                {{ job.status }}
              </v-chip>
            </td>
            <td>{{ formatDisplayDate(job.openingDate) }}</td>
            <td>{{ formatDisplayDate(job.startDate) }}</td>
            <td>{{ job.recruiter }}</td>
            <td>
              <v-btn icon size="small" color="blue" @click="editRequisition(job)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" color="red" @click="deleteRequisition(job._id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
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

// ✅ Filter only statuses without colors
const statusOptionsWithColor = computed(() =>
  statusOptions.filter(s => statusColorMap[s.value])
)


const fetchGlobalRecruiters = async () => {
  const res = await axios.get('http://localhost:5000/api/departments/global-recruiters')
  globalRecruiters.value = res.data.map(r => r.name)
}

const fetchDepartments = async () => {
  if (!subType.value) return
  const res = await axios.get(`http://localhost:5000/api/departments?type=Blue Collar&subType=${subType.value}`)
  departments.value = res.data
}

const onDepartmentChange = () => {
  const dept = departments.value.find(d => d._id === form.value.departmentId)
  jobTitles.value = dept?.jobTitles || []
  recruiters.value = dept?.recruiters || []
}

const fetchRequisitions = async () => {
  const res = await axios.get('http://localhost:5000/api/job-requisitions')
  jobRequisitions.value = res.data.filter(j => j.type === 'Blue Collar')
}

const handleSubmit = async () => {
  const payload = { ...form.value, type: 'Blue Collar' }
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:5000/api/job-requisitions/${editingId.value}`, payload)
      Swal.fire('✅ Updated', 'Job requisition updated', 'success')
    } else {
      await axios.post('http://localhost:5000/api/job-requisitions', payload)
      Swal.fire('✅ Created', 'Job requisition created', 'success')
    }
    fetchRequisitions()
    resetForm()
    showForm.value = false
  } catch (err) {
    Swal.fire('❌ Error', err?.response?.data?.message || 'Failed to submit', 'error')
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
  const confirm = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes' })
  if (confirm.isConfirmed) {
    await axios.delete(`http://localhost:5000/api/job-requisitions/${id}`)
    Swal.fire('Deleted', 'Requisition removed', 'success')
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

const goToFilteredCandidates = (job, status) => {
  const stageMap = {
    Filled: 'Onboard',
    Suspended: 'JobOffer'
  }

  const stage = stageMap[status]
  if (!stage) {
    return Swal.fire('⚠️ No candidate to show for this status', '', 'info')
  }

  // 💡 Redirect with job ID + stage, frontend will filter
  const url = `/bluecollar/candidates?jobRequisitionId=${job._id}&stage=${stage}`
  router.push(url)
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

/* mini navbar */
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
