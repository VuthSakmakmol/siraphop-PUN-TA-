<template>
  <v-container>

  <div class="whitecollar-nav">
  <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/whitecollar/dashboard')">
    Dashboard
  </v-btn>
  <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/whitecollar/departments')">
    Department
  </v-btn>
  <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/whitecollar/requisitions')">
    Job Openings
  </v-btn>
  <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/whitecollar/candidates')">
    Candidates
  </v-btn>
</div>


    <v-card class="pa-5" elevation="5">
      <v-card-title>
        <span class="text-h6">White Collar Departments</span>
        <v-spacer />
        <!-- Recruiter Toggle Button with Badge -->
        <div class="recruiter-button" @click="toggleRecruiterSection">
          <v-btn icon size="small" color="indigo">
            <v-badge :content="globalRecruiters.length" color="red" offset-x="4" offset-y="4">
              <v-icon size="22">mdi-account-group</v-icon>
            </v-badge>
          </v-btn>
          <span class="recruiter-label">{{ showRecruiterSection ? 'Hide Recruiters' : 'Manage Recruiters' }}</span>
        </div>
      </v-card-title>

      <!-- Recruiter Section -->
      <v-expand-transition>
        <v-sheet v-if="showRecruiterSection" class="pa-4" elevation="2" rounded>
          <v-row class="mb-2">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="globalRecruiter"
                label="Add Global Recruiter"
                prepend-icon="mdi-account"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="indigo" class="mt-2" @click="addRecruiter">Add New Recruiter</v-btn>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-chip-group column>
                <v-chip
                  v-for="(r, i) in globalRecruiters"
                  :key="r._id"
                  class="ma-1"
                  color="indigo"
                  text-color="white"
                  size="small"
                  @dblclick="showEditDeleteOptions(r)"
                >
                  {{ r.name }}
                </v-chip>
              </v-chip-group>
              <p class="text-caption text-grey mt-1">💡 Double-click a chip to edit or delete recruiter</p>
            </v-col>
          </v-row>
        </v-sheet>
      </v-expand-transition>

      <!-- Department Form -->
      <v-form @submit.prevent="handleSubmit">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="form.departmentId" label="Department ID" required />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="form.name" label="Department Name" required />
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="success" type="submit" :loading="loading" class="mt-2">
              {{ form._id ? 'Update' : 'Add New Department' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-form>

      <v-divider class="my-4" />

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
              <v-btn size="small" variant="text" color="primary" @click="edit(dept)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn size="small" variant="text" color="red" @click="confirmDelete(dept)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-btn size="small" variant="text" color="teal" @click="goToDetail(dept)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.path.split('/')[2])

const departments = ref([])
const globalRecruiters = ref([])
const globalRecruiter = ref('')
const showRecruiterSection = ref(false)
const loading = ref(false)

const form = ref({
  departmentId: '',
  name: '',
  type: 'White Collar'
})

const goTo = (path) => {
  if (route.path !== path) router.push(path)
}

const resetForm = () => {
  form.value = {
    departmentId: '',
    name: '',
    type: 'White Collar'
  }
}

const fireAlert = (type, title, text) => {
  Swal.fire({ icon: type, title, text, allowEnterKey: true })
}

const fetchDepartments = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
    departments.value = res.data
  } catch (err) {
    fireAlert('error', 'Fetch Failed', err?.response?.data?.message || 'Failed to fetch departments')
  }
}

const fetchGlobalRecruiters = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments/global-recruiters')
    globalRecruiters.value = res.data
  } catch (err) {
    fireAlert('error', 'Load Error', 'Failed to load global recruiters')
  }
}

const toggleRecruiterSection = () => {
  showRecruiterSection.value = !showRecruiterSection.value
}

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.departmentId.trim()) {
    fireAlert('warning', 'Required Fields Missing', 'Please fill in both Department ID and Name.')
    return
  }

  const duplicate = departments.value.find(d => d.departmentId == form.value.departmentId && d._id !== form.value._id)
  if (!form.value._id && duplicate) {
    fireAlert('warning', 'Duplicate ID', 'A department with this ID already exists.')
    return
  }

  loading.value = true
  try {
    if (form.value._id) {
      await axios.put(`http://localhost:5000/api/departments/${form.value._id}`, form.value)
      fireAlert('success', '✅ Updated', 'Department updated successfully')
    } else {
      await axios.post('http://localhost:5000/api/departments', form.value)
      fireAlert('success', '✅ Created', 'Department created successfully')
    }
    resetForm()
    fetchDepartments()
  } catch (err) {
    fireAlert('error', 'Error', err?.response?.data?.message || 'Failed to save department')
  } finally {
    loading.value = false
  }
}

const addRecruiter = async () => {
  if (!globalRecruiter.value.trim()) {
    fireAlert('warning', 'Recruiter Required', 'Please enter a recruiter name before adding.')
    return
  }

  try {
    await axios.post('http://localhost:5000/api/departments/global-recruiter', {
      recruiter: globalRecruiter.value.trim()
    })
    fireAlert('success', '✅ Success', 'Recruiter added globally')
    globalRecruiter.value = ''
    await fetchGlobalRecruiters()
  } catch (err) {
    fireAlert('error', '❌ Error', err?.response?.data?.message || 'Failed to add recruiter')
  }
}

const showEditDeleteOptions = async (recruiter) => {
  const { value: action } = await Swal.fire({
    title: `Manage Recruiter: "${recruiter.name}"`,
    showDenyButton: true,
    confirmButtonText: '✏️ Edit',
    denyButtonText: '🗑️ Delete',
    showCancelButton: true,
    icon: 'question',
    allowEnterKey: true
  })

  if (action === true) {
    const { value: newName } = await Swal.fire({
      title: 'Edit Recruiter',
      input: 'text',
      inputLabel: 'New Recruiter Name',
      inputValue: recruiter.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
      allowEnterKey: true,
      inputValidator: (value) => {
        if (!value.trim()) return 'Name cannot be empty'
      }
    })

    if (newName && newName.trim()) {
      try {
        await axios.put(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`, {
          name: newName.trim()
        })
        fireAlert('success', '✅ Updated', 'Recruiter updated successfully')
        await fetchGlobalRecruiters()
      } catch (err) {
        fireAlert('error', '❌ Error', err?.response?.data?.message || 'Update failed')
      }
    }
  } else if (action === false) {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete recruiter "${recruiter.name}" from all departments?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      allowEnterKey: true
    })

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`)
        fireAlert('success', '✅ Deleted', 'Recruiter removed')
        await fetchGlobalRecruiters()
      } catch (err) {
        fireAlert('error', '❌ Error', err?.response?.data?.message || 'Failed to delete recruiter')
      }
    }
  }
}

const confirmDelete = (dept) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the department.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    allowEnterKey: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${dept._id}`)
        fireAlert('success', '🗑️ Deleted', 'Department has been removed.')
        fetchDepartments()
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to delete department'
        const link = err?.response?.data?.link
        if (link) {
          Swal.fire({
            icon: 'warning',
            title: '⚠️ Deletion Blocked',
            html: `<p>${msg}</p><p><a href="${link}" target="_blank" style="color:#1e88e5;font-weight:bold;">👉 View Related Job Requisitions</a></p>`,
            allowEnterKey: true
          })
        } else {
          fireAlert('error', 'Error', msg)
        }
      }
    }
  })
}

const edit = (dept) => {
  form.value = { ...dept }
}

const goToDetail = (dept) => {
  router.push(`/whitecollar/departments/${dept._id}`)
}

onMounted(() => {
  fetchDepartments()
  fetchGlobalRecruiters()
})
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

/* navbar */

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
  transition: all 0.25s ease;
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

.recruiter-button {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.recruiter-label {
  font-size: 0.85rem;
  color: #1976d2;
  font-weight: 500;
}



</style>
