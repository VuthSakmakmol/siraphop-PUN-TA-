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
        <!-- Job Titles -->
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

        <!-- Recruiters -->
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

const jobTitlesFormatted = computed(() =>
  jobTitles.value.map((title, index) => ({ id: index + 1, title }))
)
const recruitersFormatted = computed(() =>
  recruiters.value.map((recruiter, index) => ({ id: index + 1, recruiter }))
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
    const res = await axios.get(`/api/departments/${departmentId}`)
    jobTitles.value = res.data.jobTitles || []
    recruiters.value = res.data.recruiters || []
  } catch (err) {
    Swal.fire('Error', 'Failed to load department data', 'error')
  }
}


const promptAdd = async (type) => {
  const { value } = await Swal.fire({
    title: `Add ${type === 'jobTitle' ? 'Job Title' : 'Recruiter'}`,
    input: 'text',
    inputLabel: `Enter ${type === 'jobTitle' ? 'title' : 'recruiter name'}`,
    showCancelButton: true
  });

  if (value?.trim()) {
    const formatted = value.trim();
    const endpoint = `/api/departments/${departmentId}/${type === 'jobTitle' ? 'job-title' : 'recruiter'}`;

    try {
      await axios.put(endpoint, {
        [type === 'jobTitle' ? 'title' : 'recruiter']: formatted
      });
      Swal.fire('Success', 'Added successfully', 'success');
      fetchDepartment();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add';
      Swal.fire('Error', msg, 'error'); // ✅ Only message, no link
    }
  }
};


const promptEdit = async (type, oldValue) => {
  const { value } = await Swal.fire({
    title: `Edit ${type}`,
    input: 'text',
    inputValue: oldValue,
    showCancelButton: true
  })

  if (value?.trim() && value !== oldValue) {
    const endpoint = `/api/departments/${departmentId}/update-${type}`
    const payload = {
      [type === 'jobTitle' ? 'oldTitle' : 'oldRecruiter']: oldValue,
      [type === 'jobTitle' ? 'newTitle' : 'newRecruiter']: value.trim()
    }

    try {
      await axios.put(endpoint, payload)
      Swal.fire('Updated', 'Updated successfully', 'success')
      fetchDepartment()
    } catch {
      Swal.fire('Error', 'Failed to update', 'error')
    }
  }
}

const removeItem = async (type, value) => {
  const confirm = await Swal.fire({
    title: `Remove ${value}?`,
    icon: 'warning',
    showCancelButton: true
  });

  if (confirm.isConfirmed) {
    const endpoint = `/api/departments/${departmentId}/remove-${type === 'jobTitle' ? 'job-title' : 'recruiter'}`;
    const payload = { [type === 'jobTitle' ? 'title' : 'recruiter']: value };

    try {
      await axios.put(endpoint, payload);
      Swal.fire('Removed', 'Removed successfully', 'success');
      fetchDepartment();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to remove';
      Swal.fire('Cannot Delete', msg, 'warning'); // ✅ Message only, no link
    }
  }
};


onMounted(fetchDepartment)
</script>
