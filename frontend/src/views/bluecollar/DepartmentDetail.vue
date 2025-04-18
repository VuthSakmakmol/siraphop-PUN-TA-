<template>
    <v-container>
      <v-card class="pa-5" elevation="5">
        <v-card-title>
          Department Details
          <v-spacer />
          <v-btn color="primary" @click="goBack">Back</v-btn>
        </v-card-title>
  
        <v-card-text>
          <p><strong>Department ID:</strong> {{ department?.departmentId }}</p>
          <p><strong>Department Name:</strong> {{ department?.name }}</p>
          <p><strong>Type:</strong> {{ department?.type }}</p>
          <p v-if="department?.type === 'Blue Collar'"><strong>Sub-Type:</strong> {{ department?.subType || '—' }}</p>
        </v-card-text>
  
        <v-divider class="my-4" />
  
        <!-- Job Title Input -->
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="newJobTitle"
              label="Add Job Title"
              density="compact"
              outlined
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn color="success" class="mt-2" @click="addJobTitle">Add</v-btn>
          </v-col>
        </v-row>
  
        <!-- Job Titles Table -->
        <h4 class="text-subtitle-1 mt-4">Job Titles</h4>
        <v-table class="elevation-1">
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
  
  // ✅ Fetch department info
  const fetchDepartment = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/departments/${route.params.id}`)
      department.value = res.data
    } catch {
      Swal.fire('Error', 'Failed to load department', 'error')
    }
  }
  
  // ✅ Add job title
  const addJobTitle = async () => {
    if (!newJobTitle.value.trim()) return
  
    try {
      await axios.put(`http://localhost:5000/api/departments/${route.params.id}/job-title`, {
        title: newJobTitle.value.trim()
      })
      Swal.fire('✅ Added', 'Job title added', 'success')
      newJobTitle.value = ''
      fetchDepartment()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add job title'
      Swal.fire('Error', msg, 'error')
    }
  }
  
  // ✅ Remove job title
  const removeJobTitle = async (title) => {
    const confirm = await Swal.fire({
      title: 'Remove Job Title?',
      text: `Are you sure you want to delete "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    })
  
    if (!confirm.isConfirmed) return
  
    try {
      const res = await axios.put(`http://localhost:5000/api/departments/${route.params.id}/remove-job-title`, {
        title
      })
      Swal.fire('✅ Removed', 'Job title deleted', 'success')
      department.value = res.data.department
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove job title'
      Swal.fire('Error', msg, 'error')
    }
  }
  
  // ✅ Dynamic Back Button
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
  .v-table th, .v-table td {
    padding: 8px;
  }
  </style>
  