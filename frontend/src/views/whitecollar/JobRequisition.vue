<template>
  <v-container>
    <v-card class="pa-5" elevation="5">
      <v-card-title>
        Create Job Requisition
        <v-spacer />
      </v-card-title>

      <v-form @submit.prevent="handleSubmit">
        <v-row>
          <!-- Department -->
          <v-col cols="12" md="4">
            <v-select
              v-model="form.departmentId"
              label="Department"
              :items="departments"
              item-title="name"
              item-value="_id"
              required
              @update:model-value="onDepartmentChange"
            />
          </v-col>

          <!-- Job Title -->
          <v-col cols="12" md="4">
            <v-select
              v-model="form.jobTitle"
              label="Job Title"
              :items="jobTitles"
              :disabled="!jobTitles.length"
              required
            />
          </v-col>

          <!-- Recruiter -->
          <v-col cols="12" md="4">
            <v-select
              v-model="form.recruiter"
              label="Recruiter"
              :items="recruiters"
              :disabled="!recruiters.length"
            />
          </v-col>

          <!-- Target Candidates -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.targetCandidates"
              type="number"
              label="Target Candidates"
              required
            />
          </v-col>

          <!-- Status -->
          <v-col cols="12" md="3">
            <v-select
              v-model="form.status"
              label="Status"
              :items="['Vacant', 'Suspended', 'Filled', 'Cancel']"
              required
            />
          </v-col>

          <!-- Hiring Cost -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.hiringCost"
              label="Hiring Cost ($)"
              type="number"
              prefix="$"
            />
          </v-col>

          <!-- Opening Date -->
          <v-col cols="12" md="3">
            <v-menu v-model="openingDateMenu" :close-on-content-click="false" offset-y>
              <template #activator="{ props }">
                <v-text-field
                  v-model="form.openingDate"
                  label="Opening Date"
                  readonly
                  v-bind="props"
                  prepend-inner-icon="mdi-calendar"
                />
              </template>
              <v-date-picker
                @update:modelValue="val => {
                  form.openingDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD')
                  openingDateMenu = false
                }"
              />
            </v-menu>
          </v-col>

          <!-- Start Date -->
          <v-col cols="12" md="3">
            <v-menu v-model="startDateMenu" :close-on-content-click="false" offset-y>
              <template #activator="{ props }">
                <v-text-field
                  v-model="form.startDate"
                  label="Start Date"
                  readonly
                  v-bind="props"
                  prepend-inner-icon="mdi-calendar"
                />
              </template>
              <v-date-picker
                @update:modelValue="val => {
                  form.startDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD')
                  startDateMenu = false
                }"
              />
            </v-menu>
          </v-col>

          <!-- Submit Button -->
          <v-col cols="12" md="3">
            <v-btn color="success" type="submit" class="mt-2">
              {{ isEditing ? 'Update' : 'Create' }}
            </v-btn>
          </v-col>

          <!-- Global Search -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="globalSearch"
              label="Search All"
              prepend-inner-icon="mdi-magnify"
              clearable
            />
          </v-col>
          <v-btn color="green" class="ml-2" @click="exportToExcel">
            <v-icon start>mdi-file-excel</v-icon> Export Excel
          </v-btn>
        </v-row>
      </v-form>

      <!-- Job Requisition Table -->
      <v-table class="mt-5">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Target</th>
            <th>Filled</th>
            <th>Remaining</th>
            <th>Hiring Cost</th>
            <th>Status</th>
            <th>Opening Date</th>
            <th>Start Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredRequisitions" :key="item._id">
            <td>{{ item.jobRequisitionId }}</td>
            <td>{{ item.departmentName || '—' }}</td>
            <td>{{ item.jobTitle }}</td>
            <td>{{ item.targetCandidates }}</td>
            <td>{{ item.filledCandidates || 0 }}</td>
            <td>{{ item.remainingCandidates }}</td>
            <td>{{ item.hiringCost.toFixed(2) }}$</td>
            <td>{{ item.status }}</td>
            <td>{{ formatDate(item.openingDate) }}</td>
            <td>{{ formatDate(item.startDate) }}</td>
            <td>
              <v-btn icon size="small" color="blue" @click="editRequisition(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" color="red" @click="deleteRequisition(item._id)">
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
import axios from 'axios'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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

const fetchDepartments = async () => {
  const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
  departments.value = res.data
}

const onDepartmentChange = () => {
  const selected = departments.value.find(d => d._id === form.value.departmentId)
  if (selected) {
    jobTitles.value = selected.jobTitles || []
    recruiters.value = selected.recruiters || []
  } else {
    jobTitles.value = []
    recruiters.value = []
  }
}

const fetchRequisitions = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/job-requisitions')
    jobRequisitions.value = res.data.map(j => ({
      ...j,
      remainingCandidates: j.targetCandidates - j.filledCandidates,
      departmentName: j.departmentId?.name || '—'
    }))
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

const handleSubmit = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await axios.put(`http://localhost:5000/api/job-requisitions/${editingId.value}`, form.value)
      Swal.fire('Updated!', 'Job Requisition updated successfully.', 'success')
    } else {
      await axios.post('http://localhost:5000/api/job-requisitions', form.value)
      Swal.fire('Success', 'Job Requisition created', 'success')
    }
    resetForm()
    fetchRequisitions()
  } catch (err) {
    console.error(err)
    Swal.fire('Error', 'Failed to submit requisition', 'error')
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
    'Filled': item.filledCandidates || 0,
    'Remaining': item.remainingCandidates,
    'Hiring Cost ($)': item.hiringCost?.toFixed(2),
    'Status': item.status,
    'Opening Date': formatDate(item.openingDate),
    'Start Date': formatDate(item.startDate)
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Requisitions')

  // 👉 Output the Excel file as a Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  // 👉 Save as Excel with .xlsx
  saveAs(blob, 'Job_Requisitions.xlsx')
}


onMounted(() => {
  fetchDepartments()
  fetchRequisitions()
})
</script>
