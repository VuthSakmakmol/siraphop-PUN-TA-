<template>
  <v-container>
    <!-- Blue Collar Navigation -->
    <div class="bluecollar-nav">
      <v-btn :class="{ 'active-tab': currentRoute === 'dashboard' }" @click="goTo('/bluecollar/dashboard')">Dashboard</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'departments' }" @click="goTo('/bluecollar/departments')">Department</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'requisitions' }" @click="goTo('/bluecollar/requisitions')">Job Requisition</v-btn>
      <v-btn :class="{ 'active-tab': currentRoute === 'candidates' }" @click="goTo('/bluecollar/candidates')">Candidates</v-btn>
    </div>

    <v-card class="pa-5" elevation="5">
      <!-- Title & Recruiter Button -->
      <v-card-title>
        <span class="text-h6">Blue Collar Departments</span>
        <v-spacer />
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon size="small" v-bind="props" color="indigo" @click="toggleRecruiterSection">
              <v-badge :content="globalRecruiters.length" color="red" offset-x="4" offset-y="4">
                <v-icon size="22">mdi-account-group</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <span>{{ showRecruiterSection ? 'Hide Recruiters' : 'Manage Recruiters' }}</span>
        </v-tooltip>
      </v-card-title>

      <!-- Recruiter Section -->
      <v-expand-transition>
        <v-sheet v-if="showRecruiterSection" class="pa-4" elevation="2" rounded>
          <v-row class="mb-2">
            <v-col cols="12" md="6">
              <v-text-field v-model="globalRecruiter" label="Add Global Recruiter" prepend-icon="mdi-account" />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="indigo" class="mt-2" @click="addRecruiter">Add</v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-chip-group column>
                <v-chip v-for="(r, i) in globalRecruiters" :key="r._id" class="ma-1" color="indigo" text-color="white" size="small" @dblclick="showEditDeleteOptions(r)">
                  {{ r.name }}
                </v-chip>
              </v-chip-group>
              <p class="text-caption text-grey mt-1">💡 Double-click a chip to edit or delete recruiter</p>
            </v-col>
          </v-row>
        </v-sheet>
      </v-expand-transition>

      <!-- Sewer / Non-Sewer Buttons -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-btn block color="teal" @click="activeSubType = activeSubType === 'Sewer' ? null : 'Sewer'">
            {{ activeSubType === 'Sewer' ? 'Close Sewer Form' : '➕ Add Sewer Department' }}
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn block color="purple" @click="activeSubType = activeSubType === 'Non-Sewer' ? null : 'Non-Sewer'">
            {{ activeSubType === 'Non-Sewer' ? 'Close Non-Sewer Form' : '➕ Add Non-Sewer Department' }}
          </v-btn>
        </v-col>
      </v-row>

      <!-- Dynamic Department Form -->
      <v-expand-transition>
        <v-form v-if="activeSubType" @submit.prevent="handleSubmit" class="mt-3">
          <v-sheet class="pa-4" elevation="2" rounded>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.departmentId" label="Department ID" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.name" label="Department Name" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-btn color="success" type="submit" :loading="loading" class="mt-2">
                  {{ form._id ? 'Update' : `Create ${activeSubType}` }}
                </v-btn>
              </v-col>
            </v-row>
          </v-sheet>
        </v-form>
      </v-expand-transition>

      <!-- Department Table -->
      <v-divider class="my-4" />
      <v-table>
        <thead>
          <tr>
            <th>Dept ID</th>
            <th>Department Name</th>
            <th>Sub-Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dept in departments" :key="dept._id">
            <td>{{ dept.departmentId }}</td>
            <td>{{ dept.name }}</td>
            <td>
              <v-chip v-if="dept.subType" :color="dept.subType === 'Sewer' ? 'teal' : 'purple'" class="text-white" size="small">
                {{ dept.subType }}
              </v-chip>
              <span v-else>—</span>
            </td>
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
const goTo = (path) => { if (route.path !== path) router.push(path) }

const departments = ref([])
const loading = ref(false)
const globalRecruiter = ref('')
const showRecruiterSection = ref(false)
const globalRecruiters = ref([])
const activeSubType = ref(null)

const form = ref({
  departmentId: '',
  name: '',
  type: 'Blue Collar',
  subType: ''
})

const resetForm = () => {
  form.value = {
    departmentId: '',
    name: '',
    type: 'Blue Collar',
    subType: activeSubType.value || ''
  }
  activeSubType.value = null
}

const fetchDepartments = async () => {
  const res = await axios.get('http://localhost:5000/api/departments?type=Blue Collar')
  departments.value = res.data
}

const fetchGlobalRecruiters = async () => {
  const res = await axios.get('http://localhost:5000/api/departments/global-recruiters')
  globalRecruiters.value = res.data
}

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.departmentId.trim()) return
  loading.value = true
  form.value.type = 'Blue Collar'
  form.value.subType = activeSubType.value || form.value.subType

  try {
    if (form.value._id) {
      await axios.put(`http://localhost:5000/api/departments/${form.value._id}`, form.value)
      Swal.fire('✅ Updated', 'Department updated successfully', 'success')
    } else {
      await axios.post('http://localhost:5000/api/departments', form.value)
      Swal.fire('✅ Created', 'Department created successfully', 'success')
    }
    resetForm()
    fetchDepartments()
  } catch (err) {
    Swal.fire('Error', err?.response?.data?.message || 'Failed to save department', 'error')
  } finally {
    loading.value = false
  }
}

const addRecruiter = async () => {
  if (!globalRecruiter.value.trim()) return
  await axios.post('http://localhost:5000/api/departments/global-recruiter', {
    recruiter: globalRecruiter.value.trim()
  })
  globalRecruiter.value = ''
  await fetchGlobalRecruiters()
  Swal.fire('✅ Success', 'Recruiter added', 'success')
}

const showEditDeleteOptions = async (recruiter) => {
  const { value: action } = await Swal.fire({
    title: `Manage "${recruiter.name}"`,
    showDenyButton: true,
    confirmButtonText: 'Edit',
    denyButtonText: 'Delete',
    showCancelButton: true,
    icon: 'info'
  })

  if (action === true) {
    const { value: newName } = await Swal.fire({
      title: 'Edit Recruiter',
      input: 'text',
      inputValue: recruiter.name,
      showCancelButton: true,
      confirmButtonText: 'Update'
    })
    if (newName?.trim()) {
      await axios.put(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`, { name: newName })
      await fetchGlobalRecruiters()
      Swal.fire('✅ Updated', 'Recruiter updated', 'success')
    }
  } else if (action === false) {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `Remove recruiter "${recruiter.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    })
    if (confirm.isConfirmed) {
      await axios.delete(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`)
      await fetchGlobalRecruiters()
      Swal.fire('✅ Deleted', 'Recruiter removed', 'success')
    }
  }
}

const edit = (dept) => {
  form.value = { ...dept }
  activeSubType.value = dept.subType
}

const confirmDelete = async (dept) => {
  const result = await Swal.fire({
    title: 'Delete?',
    text: 'This will remove the department.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes'
  })
  if (result.isConfirmed) {
    try {
      await axios.delete(`http://localhost:5000/api/departments/${dept._id}`)
      fetchDepartments()
      Swal.fire('✅ Deleted', 'Department removed', 'success')
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to delete department', 'error')
    }
  }
}

const goToDetail = (dept) => {
  router.push(`/bluecollar/departments/${dept._id}`)
}

const toggleRecruiterSection = () => {
  showRecruiterSection.value = !showRecruiterSection.value
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
.v-table th, .v-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.bluecollar-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.bluecollar-nav .v-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  padding: 6px 18px;
  background-color: #f1f5fb;
  color: #1976d2;
  transition: all 0.25s ease;
}
.bluecollar-nav .v-btn:hover:not(.active-tab) {
  background-color: #e3f2fd;
  color: #1565c0;
}
.active-tab {
  background-color: #1976d2 !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
</style>
