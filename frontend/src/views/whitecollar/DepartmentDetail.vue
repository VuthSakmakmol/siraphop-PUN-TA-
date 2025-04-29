<template>
  <v-container class="py-4">
    <v-card class="pa-4" elevation="4" rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h6 mb-1">Department Details</h2>
          <div class="text-caption text-grey">
            {{ department?.name }} (ID: {{ department?.departmentId }}) - {{ department?.type }}
          </div>
        </div>
        <v-btn variant="tonal" color="primary" @click="goBack">Back</v-btn>
      </v-card-title>

      <v-divider class="my-3" />

      <!-- Job Title Input -->
      <v-row dense class="mb-2">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="newJobTitle"
            label="New Job Title"
            density="comfortable"
            variant="outlined"
            prepend-inner-icon="mdi-briefcase"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-btn color="success" class="mt-2" @click="addJobTitle" block>Add</v-btn>
        </v-col>
      </v-row>

      <!-- Job Titles Table -->
      <div class="mt-4">
        <h4 class="text-subtitle-1 font-weight-medium mb-2">Job Titles</h4>
        <v-table class="rounded-xl elevation-1" density="compact">
          <thead>
            <tr>
              <th class="text-left">#</th>
              <th class="text-left">Title</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(title, index) in department?.jobTitles" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ title }}</td>
              <td>
                <v-btn
                  icon
                  variant="text"
                  color="red"
                  @click="removeJobTitle(title)"
                >
                  <v-icon size="20">mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api' // ✅ use centralized API
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const department = ref({})
const newJobTitle = ref('')

const fireAlert = (type, title, text) => {
  Swal.fire({ icon: type, title, text, allowEnterKey: true })
}

const fetchDepartment = async () => {
  try {
    const res = await api.get(`/departments/${route.params.id}`)
    department.value = res.data
  } catch {
    fireAlert('error', 'Failed to Load', 'Could not load department details.')
  }
}

const addJobTitle = async () => {
  if (!newJobTitle.value.trim()) {
    fireAlert('warning', 'Missing Title', 'Please enter a job title before adding.')
    return
  }

  try {
    await api.put(`/departments/${route.params.id}/job-title`, {
      title: newJobTitle.value.trim()
    })
    fireAlert('success', '✅ Added', 'Job title has been added.')
    newJobTitle.value = ''
    fetchDepartment()
  } catch (err) {
    fireAlert('error', 'Add Failed', err.response?.data?.message || 'Failed to add job title')
  }
}

const removeJobTitle = async (title) => {
  const confirm = await Swal.fire({
    title: 'Remove Job Title?',
    text: `Do you want to delete "${title}" from this department?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove',
    cancelButtonText: 'Cancel',
    allowEnterKey: true
  })

  if (!confirm.isConfirmed) return

  try {
    const res = await api.put(`/departments/${route.params.id}/remove-job-title`, {
      title
    })
    fireAlert('success', '✅ Removed', 'Job title has been removed.')
    department.value = res.data.department
  } catch (err) {
    fireAlert('error', 'Remove Failed', err.response?.data?.message || 'Failed to remove job title')
  }
}

const goBack = () => {
  router.push('/whitecollar/departments')
}

onMounted(fetchDepartment)
</script>


<style scoped>
.v-table {
  white-space: nowrap;
  overflow-x: auto;
  font-size: 0.92rem;
}
.v-table th,
.v-table td {
  padding: 10px 12px;
  vertical-align: middle;
}
</style>
