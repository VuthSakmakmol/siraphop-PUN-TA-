<template>
  <v-container>
    <v-card class="pa-5" elevation="4" rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h6 mb-1">Department Details</h2>
          <div class="text-caption text-grey">Manage job titles below</div>
        </div>
        <v-btn variant="tonal" color="primary" @click="goBack">Back</v-btn>
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4"><strong>ID:</strong> {{ department?.departmentId }}</v-col>
          <v-col cols="12" md="4"><strong>Name:</strong> {{ department?.name }}</v-col>
          <v-col cols="12" md="4"><strong>Type:</strong> {{ department?.type }}</v-col>
          <v-col cols="12" md="4" v-if="department?.type === 'Blue Collar'">
            <strong>Sub-Type:</strong> {{ department?.subType || '—' }}
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider class="my-4" />

      <v-card-text>
        <h4 class="text-subtitle-1 font-weight-medium mb-3">Add Job Title</h4>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="newJobTitle"
              label="Job Title"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="mdi-briefcase"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block class="mt-2" color="success" @click="addJobTitle">Add</v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider class="my-4" />

      <v-card-text>
        <h4 class="text-subtitle-1 font-weight-medium mb-3">Job Titles</h4>
        <v-table class="elevation-1 rounded-xl">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(title, index) in department?.jobTitles" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ title }}</td>
              <td>
                <v-btn icon color="error" variant="text" @click="removeJobTitle(title)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const department = ref({})
const newJobTitle = ref('')

const fetchDepartment = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/departments/${route.params.id}`)
    department.value = res.data
  } catch {
    Swal.fire({
      icon: 'error',
      title: '❌ Error',
      text: 'Failed to load department',
      allowEnterKey: true
    })
  }
}

const addJobTitle = async () => {
  if (!newJobTitle.value.trim()) {
    return Swal.fire({
      icon: 'warning',
      title: '⚠️ Missing Input',
      text: 'Please enter a job title before adding.',
      allowEnterKey: true
    })
  }

  try {
    await axios.put(`http://localhost:5000/api/departments/${route.params.id}/job-title`, {
      title: newJobTitle.value.trim()
    })
    Swal.fire({
      icon: 'success',
      title: '✅ Added',
      text: 'Job title has been added.',
      allowEnterKey: true
    })
    newJobTitle.value = ''
    fetchDepartment()
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: '❌ Error',
      text: err.response?.data?.message || 'Failed to add job title',
      allowEnterKey: true
    })
  }
}

const removeJobTitle = async (title) => {
  const confirm = await Swal.fire({
    title: 'Remove Job Title?',
    text: `Are you sure you want to delete "${title}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove',
    cancelButtonText: 'Cancel',
    allowEnterKey: true
  })

  if (!confirm.isConfirmed) return

  try {
    const res = await axios.put(`http://localhost:5000/api/departments/${route.params.id}/remove-job-title`, {
      title
    })
    Swal.fire({
      icon: 'success',
      title: '✅ Removed',
      text: 'Job title deleted successfully.',
      allowEnterKey: true
    })
    department.value = res.data.department
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: '❌ Error',
      text: err.response?.data?.message || 'Failed to delete job title',
      allowEnterKey: true
    })
  }
}

const goBack = () => {
  if (department.value?.type === 'Blue Collar') {
    router.push('/bluecollar/departments')
  } else {
    router.push('/whitecollar/departments')
  }
}

onMounted(fetchDepartment)
</script>


<style scoped>
.v-table {
  white-space: nowrap;
  overflow-x: auto;
}
.v-table th,
.v-table td {
  padding: 8px 12px;
}
</style>
