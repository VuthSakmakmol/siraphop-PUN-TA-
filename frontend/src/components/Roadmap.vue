<template>
  <v-card class="pa-4 mb-6" elevation="5">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6 font-weight-bold">📈 HC Planning Roadmap</span>
      <v-btn color="primary" @click="showForm = !showForm">
        <v-icon start>mdi-plus</v-icon>
        {{ showForm ? 'Close' : 'Add Roadmap' }}
      </v-btn>
    </v-card-title>

    <!-- Add Roadmap Form -->
    <v-expand-transition>
      <v-form v-if="showForm" @submit.prevent="handleSubmit" class="mt-4">
        <v-row dense>
          <v-col cols="6" md="3">
            <v-text-field v-model="form.year" label="Year" type="number" required />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="form.planningHC" label="Planning HC" type="number" required />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="form.actualHC" label="Actual HC" type="number" required />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="form.hiringTarget" label="Hiring Target" type="number" required />
          </v-col>
        </v-row>
        <v-btn type="submit" color="success" class="mt-2">
          <v-icon start>mdi-check</v-icon>
          {{ form._id ? 'Update' : 'Add' }}
        </v-btn>
      </v-form>
    </v-expand-transition>

    <!-- Roadmap Table -->
    <v-table class="mt-5">
      <thead>
        <tr>
          <th>#</th>
          <th>Year</th>
          <th>Planning HC</th>
          <th>Actual HC</th>
          <th>Hiring Target</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in roadmapList" :key="item._id">
          <td>{{ index + 1 }}</td>
          <td>{{ item.year }}</td>
          <td>{{ item.planningHC }}</td>
          <td>{{ item.actualHC }}</td>
          <td>{{ item.hiringTarget }}</td>
          <td>
            <v-btn icon @click="editRoadmap(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon color="red" @click="deleteRoadmap(item._id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const showForm = ref(false)
const roadmapList = ref([])

const form = ref({
  year: new Date().getFullYear(),
  planningHC: '',
  actualHC: '',
  hiringTarget: '',
  _id: null
})

// ✅ Fetch Roadmap
const fetchRoadmap = async () => {
  try {
    const res = await axios.get('/api/roadmaps')
    roadmapList.value = res.data
  } catch (err) {
    console.error('❌ Error loading roadmap:', err)
  }
}

// ✅ Add / Update
const handleSubmit = async () => {
  try {
    if (form.value._id) {
      await axios.put(`/api/roadmaps/${form.value._id}`, form.value)
      Swal.fire('✅ Updated!', '', 'success')
    } else {
      await axios.post('/api/roadmaps', form.value)
      Swal.fire('✅ Added!', '', 'success')
    }
    resetForm()
    fetchRoadmap()
  } catch (err) {
    console.error('❌ Submit error:', err)
    Swal.fire('Error', 'Failed to save roadmap', 'error')
  }
}

const resetForm = () => {
  form.value = {
    year: new Date().getFullYear(),
    planningHC: '',
    actualHC: '',
    hiringTarget: '',
    _id: null
  }
  showForm.value = false
}

// ✅ Edit mode
const editRoadmap = (item) => {
  form.value = { ...item }
  showForm.value = true
}

// ✅ Delete roadmap
const deleteRoadmap = async (id) => {
  const confirm = await Swal.fire({
    title: 'Delete?',
    text: 'Are you sure you want to remove this entry?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  })
  if (confirm.isConfirmed) {
    try {
      await axios.delete(`/api/roadmaps/${id}`)
      fetchRoadmap()
      Swal.fire('Deleted!', '', 'success')
    } catch (err) {
      console.error('❌ Delete error:', err)
    }
  }
}

onMounted(fetchRoadmap)
</script>

<style scoped>
.v-table th {
  background: #f8f8f8;
  font-weight: 600;
}
</style>
