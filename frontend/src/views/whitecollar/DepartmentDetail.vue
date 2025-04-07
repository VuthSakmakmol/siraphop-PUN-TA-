<template>
  <v-container>
    <v-card class="pa-4" elevation="4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h2>Department Details</h2>
        <v-btn color="primary" @click="$router.back()">
          <v-icon start>mdi-arrow-left</v-icon> Back
        </v-btn>
      </div>

      <v-row>
        <!-- ✅ Job Titles -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-title>
              Job Titles ({{ jobTitles.length }})
              <v-spacer />
              <v-btn size="small" color="primary" @click="promptAdd('jobTitle')">
                <v-icon start>mdi-plus</v-icon> Add
              </v-btn>
            </v-card-title>

            <v-data-table
              :headers="jobTitleHeaders"
              :items="jobTitlesFormatted"
              hide-default-footer
              density="compact"
            >
              <template #item.actions="{ item }">
                <v-btn icon size="x-small" @click="promptEdit('jobTitle', item.title)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" color="red" @click="removeItem('jobTitle', item.title)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <template #no-data>
                <v-card-text>No job titles available.</v-card-text>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <!-- ✅ Recruiters -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-title>
              Recruiters ({{ recruiters.length }})
              <v-spacer />
              <v-btn size="small" color="green" @click="promptAdd('recruiter')">
                <v-icon start>mdi-plus</v-icon> Add
              </v-btn>
            </v-card-title>

            <v-data-table
              :headers="recruiterHeaders"
              :items="recruitersFormatted"
              hide-default-footer
              density="compact"
            >
              <template #item.actions="{ item }">
                <v-btn icon size="x-small" @click="promptEdit('recruiter', item.recruiter)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" color="red" @click="removeItem('recruiter', item.recruiter)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <template #no-data>
                <v-card-text>No recruiters available.</v-card-text>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const departmentId = route.params.id

const jobTitles = ref([])
const recruiters = ref([])

// 👇 These will inject ID field
const jobTitlesFormatted = computed(() =>
  jobTitles.value.map((title, index) => ({
    id: index + 1,
    title
  }))
)

const recruitersFormatted = computed(() =>
  recruiters.value.map((recruiter, index) => ({
    id: index + 1,
    recruiter
  }))
)

const jobTitleHeaders = [
  { text: 'ID', value: 'id' },
  { text: 'Job Title', value: 'title' },
  { text: 'Actions', value: 'actions', sortable: false }
]

const recruiterHeaders = [
  { text: 'ID', value: 'id' },
  { text: 'Recruiter', value: 'recruiter' },
  { text: 'Actions', value: 'actions', sortable: false }
]

const fetchDepartment = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/departments/${departmentId}`)
    const data = res.data
    jobTitles.value = Array.isArray(data.jobTitles) ? data.jobTitles : []
    recruiters.value = Array.isArray(data.recruiters) ? data.recruiters : []
  } catch (err) {
    Swal.fire('Error', 'Failed to load department data', 'error')
  }
}

const promptAdd = async (type) => {
  const { value } = await Swal.fire({
    title: `Add ${type === 'jobTitle' ? 'Job Title' : 'Recruiter'}`,
    input: 'text',
    inputLabel: `Enter new ${type === 'jobTitle' ? 'title' : 'recruiter name'}`,
    showCancelButton: true
  })

  if (value?.trim()) {
    const formatted = value.trim()
    const list = type === 'jobTitle' ? jobTitles.value : recruiters.value
    if (list.some(item => item.toLowerCase() === formatted.toLowerCase())) {
      return Swal.fire('Duplicate', `${type === 'jobTitle' ? 'Job Title' : 'Recruiter'} already exists`, 'warning')
    }

    const endpoint = `http://localhost:5000/api/departments/${departmentId}/${type === 'jobTitle' ? 'job-title' : 'recruiter'}`
    await axios.put(endpoint, { [type === 'jobTitle' ? 'title' : 'recruiter']: formatted })
    Swal.fire('Success', 'Added successfully', 'success')
    fetchDepartment()
  }
}

const promptEdit = async (type, oldValue) => {
  const { value } = await Swal.fire({
    title: `Edit ${type === 'jobTitle' ? 'Job Title' : 'Recruiter'}`,
    input: 'text',
    inputValue: oldValue,
    showCancelButton: true
  })

  if (value?.trim() && value.trim() !== oldValue) {
    const endpoint = `http://localhost:5000/api/departments/${departmentId}/update-${type}`
    const payload = {
      [type === 'jobTitle' ? 'oldTitle' : 'oldRecruiter']: oldValue,
      [type === 'jobTitle' ? 'newTitle' : 'newRecruiter']: value.trim()
    }
    await axios.put(endpoint, payload)
    Swal.fire('Updated', `${type === 'jobTitle' ? 'Title' : 'Recruiter'} updated`, 'success')
    fetchDepartment()
  }
}



const removeItem = async (type, value) => {
  const confirm = await Swal.fire({
    title: `Remove ${value}?`,
    icon: 'warning',
    showCancelButton: true
  })

  if (confirm.isConfirmed) {
    const endpoint = `http://localhost:5000/api/departments/${departmentId}/remove-${type === 'jobTitle' ? 'job-title' : 'recruiter'}`
    await axios.put(endpoint, { [type === 'jobTitle' ? 'title' : 'recruiter']: value })
    Swal.fire('Removed', `${type === 'jobTitle' ? 'Title' : 'Recruiter'} removed`, 'success')
    fetchDepartment()
  }
}


onMounted(fetchDepartment)
</script>
