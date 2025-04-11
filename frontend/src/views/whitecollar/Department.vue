<template>
  <v-container>

  <div class="whitecollar-nav">
    <v-btn :class="currentRoute === 'dashboard' ? 'active-tab' : ''" @click="goTo('/whitecollar/dashboard')">
      Dashboard
    </v-btn>
    <v-btn :class="currentRoute === 'departments' ? 'active-tab' : ''" @click="goTo('/whitecollar/departments')">
      Department
    </v-btn>
    <v-btn :class="currentRoute === 'requisitions' ? 'active-tab' : ''" @click="goTo('/whitecollar/requisitions')">
      Job Requisition
    </v-btn>
    <v-btn :class="currentRoute === 'candidates' ? 'active-tab' : ''" @click="goTo('/whitecollar/candidates')">
      Candidates
    </v-btn>
  </div>

    <v-card class="pa-5" elevation="5">
      <v-card-title>
        <span class="text-h6">White Collar Departments</span>
        <v-spacer />
        <!-- Recruiter Toggle Button with Badge -->
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
              <v-text-field
                v-model="globalRecruiter"
                label="Add Global Recruiter"
                prepend-icon="mdi-account"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="indigo" class="mt-2" @click="addRecruiter">Add</v-btn>
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
              {{ form._id ? 'Update' : 'Create' }}
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
import { ref, onMounted } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import { computed } from 'vue'

const router = useRouter()
const departments = ref([])
const loading = ref(false)
const globalRecruiter = ref('')
const showRecruiterSection = ref(false)
const globalRecruiters = ref([])
const route = useRoute()


const currentRoute = computed(() => route.path.split('/')[2])

const goTo = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const form = ref({
  departmentId: '',
  name: '',
  type: 'White Collar'
})

const resetForm = () => {
  form.value = {
    departmentId: '',
    name: '',
    type: 'White Collar'
  }
}

const fetchDepartments = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments?type=White Collar')
    departments.value = res.data
  } catch {
    Swal.fire('Error', 'Failed to fetch departments', 'error')
  }
}

const fetchGlobalRecruiters = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/departments/global-recruiters')
    globalRecruiters.value = res.data
  } catch {
    console.error('Failed to load global recruiters')
  }
}

const toggleRecruiterSection = () => {
  showRecruiterSection.value = !showRecruiterSection.value
}

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.departmentId.trim()) return
  loading.value = true
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
    const msg = err?.response?.data?.message
    Swal.fire('Error', msg || 'Failed to save department', 'error')
  } finally {
    loading.value = false
  }
}

const addRecruiter = async () => {
  if (!globalRecruiter.value.trim()) return
  try {
    await axios.post('http://localhost:5000/api/departments/global-recruiter', {
      recruiter: globalRecruiter.value.trim()
    })
    Swal.fire('✅ Success', 'Recruiter added globally', 'success')
    globalRecruiter.value = ''
    await fetchGlobalRecruiters()
  } catch (err) {
    Swal.fire('❌ Error', err?.response?.data?.message || 'Failed to add recruiter', 'error')
  }
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
      inputLabel: 'New Recruiter Name',
      inputValue: recruiter.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
      inputValidator: (value) => {
        if (!value.trim()) return 'Name cannot be empty'
      }
    })
    if (newName && newName.trim()) {
      try {
        await axios.put(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`, {
          name: newName.trim()
        })
        Swal.fire('✅ Updated', 'Recruiter updated successfully', 'success')
        await fetchGlobalRecruiters()
      } catch (err) {
        Swal.fire('❌ Error', err?.response?.data?.message || 'Update failed', 'error')
      }
    }
  } else if (action === false) {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete recruiter "${recruiter.name}" from all departments?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    })
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/global-recruiters/${recruiter._id}`)
        Swal.fire('✅ Deleted', 'Recruiter removed', 'success')
        await fetchGlobalRecruiters()
      } catch (err) {
        Swal.fire('❌ Error', err?.response?.data?.message || 'Failed to delete recruiter', 'error')
      }
    }
  }
}

const edit = (dept) => {
  form.value = { ...dept }
}

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
            html: `<p>${msg}</p><a href="${link}" target="_blank" style="color:#1e88e5;">👉 Go to Job Requisitions</a>`
          })
        } else {
          Swal.fire('Error', msg, 'error')
        }
      }
    }
  })
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


</style>
