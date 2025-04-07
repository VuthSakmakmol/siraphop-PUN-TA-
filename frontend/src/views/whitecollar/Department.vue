<!-- src/views/whitecollar/Department.vue -->
<template>
  <v-container>
    <v-card class="pa-5" elevation="5">
      <v-card-title>White Collar Departments</v-card-title>

      <!-- Create/Update Form -->
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

      <!-- Department Table -->
      <v-data-table
        class="mt-6"
        :headers="headers"
        :items="departments"
        item-value="_id"
      >
        <template #item.actions="{ item }">
          <v-btn icon @click="edit(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon color="red" @click="confirmDelete(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <v-btn icon color="blue" @click="goToDetail(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
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

const form = ref({
  name: '',
  type: 'White Collar'
})

const headers = [
  { text: 'Dept ID', value: 'departmentId' },
  { text: 'Department Name', value: 'name' },
  { text: 'Actions', value: 'actions', sortable: false }
]

const fetchDepartments = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
    departments.value = res.data
  } catch (err) {
    Swal.fire('Error', 'Failed to fetch departments', 'error')
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    type: 'White Collar'
  }
}


const handleSubmit = async () => {
  if (!form.value.name.trim()) return

  loading.value = true
  try {
    if (form.value._id) {
      await axios.put(`http://localhost:5000/api/departments/${form.value._id}`, form.value)
      Swal.fire('Updated', 'Department updated successfully', 'success')
    } else {
      await axios.post('http://localhost:5000/api/departments', form.value)
      Swal.fire('Created', 'Department created successfully', 'success')
    }
    resetForm()
    fetchDepartments()
  } catch (err) {
    console.error('Error:', err)
    Swal.fire('Error', 'Failed to create department', 'error')
  } finally {
    loading.value = false
  }
}


const edit = (item) => {
  form.value = { ...item }
}

const confirmDelete = (item) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the department.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${item._id}`)
        Swal.fire('Deleted', 'Department has been removed.', 'success')
        fetchDepartments()
      } catch (err) {
        Swal.fire('Error', 'Failed to delete department', 'error')
      }
    }
  })
}

const goToDetail = (item) => {
  router.push(`/whitecollar/departments/${item._id}`)
}


onMounted(fetchDepartments)
</script>
