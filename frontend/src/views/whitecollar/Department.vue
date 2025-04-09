<template>
  <v-container>
    <v-card class="pa-5" elevation="5">
      <v-card-title>
        White Collar Departments
        <v-spacer />
        <v-btn color="primary" @click="resetForm">{{ form._id ? 'Cancel Edit' : 'New Department' }}</v-btn>
      </v-card-title>

      <!-- Create/Update Form -->
      <v-expand-transition>
        <div v-show="!formCollapsed">
          <v-form @submit.prevent="handleSubmit">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.name" label="Department Name" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-btn color="success" type="submit" :loading="loading" class="mt-2">
                  {{ form._id ? 'Update' : 'Create' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <v-divider class="my-4"></v-divider>

      <!-- Department Table -->
      <v-table>
        <thead>
          <tr>
            <th>Dept ID</th>
            <th>Department Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dept in departments" :key="dept._id">
            <td>{{ dept.departmentId }}</td>
            <td>{{ dept.name }}</td>
            <td>
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click="edit(dept)"
              >
                <v-icon size="18">mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="red"
                @click="confirmDelete(dept)"
              >
                <v-icon size="18">mdi-delete</v-icon>
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="teal"
                @click="goToDetail(dept)"
              >
                <v-icon size="18">mdi-eye</v-icon>
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
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const router = useRouter()
const departments = ref([])
const loading = ref(false)
const formCollapsed = ref(false)

const form = ref({
  name: '',
  type: 'White Collar'
})

const resetForm = () => {
  form.value = {
    name: '',
    type: 'White Collar'
  }
  formCollapsed.value = false
}

// Fetch departments
const fetchDepartments = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
    departments.value = res.data
  } catch {
    Swal.fire('Error', 'Failed to fetch departments', 'error')
  }
}

// Submit
const handleSubmit = async () => {
  if (!form.value.name.trim()) return

  loading.value = true
  try {
    if (form.value._id) {
      await axios.put(`http://localhost:5000/api/departments/${form.value._id}`, form.value)
      Swal.fire('✅ Updated', 'Department updated successfully', 'success')
    } else {
      await axios.post('http://localhost:5000/api/departments', {
        name: form.value.name.trim(),
        type: form.value.type
      })
      Swal.fire('✅ Created', 'Department created successfully', 'success')
    }
    resetForm()
    fetchDepartments()
  } catch (err) {
    const msg = err?.response?.data?.message
    if (msg === 'Department already exists') {
      Swal.fire('Duplicate', 'This department already exists.', 'warning')
    } else {
      Swal.fire('Error', msg || 'Failed to save department', 'error')
    }
  } finally {
    loading.value = false
  }
}

// Edit
const edit = (dept) => {
  form.value = { ...dept }
  formCollapsed.value = false
}

// Delete
const confirmDelete = (dept) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the department.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${dept._id}`)
        Swal.fire('🗑️ Deleted', 'Department has been removed.', 'success')
        fetchDepartments()
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to delete department'
        const link = err?.response?.data?.link
        if (link) {
          Swal.fire({
            icon: 'warning',
            title: 'Cannot Delete',
            html: `<p>${msg}</p>
              <a href="${link}" target="_blank" style="color:#1e88e5; font-weight: bold;">
              👉 Go to Job Requisitions
              </a>`
          })
        } else {
          Swal.fire('Error', msg, 'error')
        }
      }
    }
  })
}

// Detail
const goToDetail = (dept) => {
  router.push(`/whitecollar/departments/${dept._id}`)
}

onMounted(fetchDepartments)
</script>

<style scoped>
.v-table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.v-table th,
.v-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.v-btn {
  min-width: 32px;
  padding: 4px 6px;
}
</style>
