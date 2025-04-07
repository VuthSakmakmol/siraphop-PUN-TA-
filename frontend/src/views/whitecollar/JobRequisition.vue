<template>
  <v-container>
    <v-card class="pa-5" elevation="5">
      <v-card-title>
        Create Job Requisition
        <v-spacer />
        <!-- <v-btn color="primary" @click="fetchRequisitions">Refresh</v-btn> -->
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
              v-model="form.hiringCost"
              label="Hiring Cost"
              type="number"
            />
          </v-col>

          <!-- Opening Date -->
          <v-menu v-model="openingDateMenu" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-text-field v-model="form.openingDate" label="Opening Date" readonly v-bind="props" prepend-inner-icon="mdi-calendar" />
            </template>
            <v-date-picker
              @update:modelValue="val => {
                form.openingDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD');
                openingDateMenu = false;
              }"
            />
          </v-menu>

          <!-- Start Date -->
          <v-menu v-model="startDateMenu" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-text-field v-model="form.startDate" label="Start Date" readonly v-bind="props" prepend-inner-icon="mdi-calendar" />
            </template>
            <v-date-picker
              @update:modelValue="val => {
                form.startDate = dayjs(val).tz('Asia/Phnom_Penh').format('YYYY-MM-DD');
                startDateMenu = false;
              }"
            />
          </v-menu>

          <v-col cols="12" md="3">
            <v-btn color="success" type="submit" class="mt-2">Create</v-btn>
          </v-col>
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
    <tr v-for="item in jobRequisitions" :key="item._id">
      <td>{{ item.jobRequisitionId }}</td>
      <td>{{ item.departmentName || '—' }}</td>
      <td>{{ item.jobTitle }}</td>
      <td>{{ item.targetCandidates }}</td>
      <td>{{ item.filledCandidates || 0 }}</td>
      <td>{{ item.remainingCandidates }}</td>
      <td>{{ item.hiringCost }}</td>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

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
const requisitions = ref([])
const jobRequisitions = ref([])


const openingDateMenu = ref(false)
const startDateMenu = ref(false)



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
    const res = await axios.get('http://localhost:5000/api/job-requisitions');
    jobRequisitions.value = res.data.map(j => ({
      ...j,
      remainingCandidates: j.targetCandidates - j.filledCandidates,
      departmentName: j.departmentId?.name || '—'
    }));

  } catch (err) {
    console.error('Fetch error:', err);
  }
};


const handleSubmit = async () => {
  try {
    await axios.post('http://localhost:5000/api/job-requisitions', form.value)
    Swal.fire('Success', 'Job Requisition created', 'success')
  } catch (err) {
    console.error(err)
    Swal.fire('Error', 'Failed to create requisition', 'error')
  }
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

onMounted(() => {
  fetchDepartments()
  fetchRequisitions()
})
</script>
