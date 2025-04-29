<template>
  <v-container>
    <v-card class="pa-5" elevation="4" rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h6 mb-1">Candidate Details</h2>
          <div class="text-caption text-grey">
            {{ candidate.fullName }} (ID: {{ candidate.candidateId }})
          </div>
        </div>
        <v-btn variant="tonal" color="primary" @click="goBack">Back</v-btn>
      </v-card-title>

      <v-divider class="my-4" />

      <!-- Candidate Info -->
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4"><strong>Name:</strong> {{ candidate.fullName }}</v-col>
          <v-col cols="12" md="4"><strong>Source:</strong> {{ candidate.applicationSource }}</v-col>
          <v-col cols="12" md="4"><strong>Decision:</strong> {{ candidate.hireDecision || '-' }}</v-col>
          <v-col cols="12" md="4"><strong>Job Title:</strong> {{ candidate.jobRequisitionId?.jobTitle || '-' }}</v-col>
          <v-col cols="12" md="4"><strong>Department:</strong> {{ candidate.jobRequisitionId?.departmentId?.name || '-' }}</v-col>
        </v-row>

        <!-- Progress Dates -->
        <v-divider class="my-4" />
        <h4 class="text-subtitle-1 font-weight-medium mb-2">Progress Dates</h4>
        <v-row dense>
          <v-col cols="6" md="3" v-for="stage in stages" :key="stage">
            <div class="text-caption text-grey">{{ stage }}</div>
            <div class="font-weight-medium">{{ formatDate(candidate.progressDates?.[stage]) }}</div>
          </v-col>
        </v-row>

        <!-- Upload -->
        <v-divider class="my-5" />
        <h4 class="text-subtitle-1 font-weight-medium mb-2">Upload Documents</h4>
        <v-file-input
          v-model="newDocuments"
          multiple
          label="Select Documents"
          prepend-icon="mdi-paperclip"
          show-size
          variant="outlined"
        />
        <v-btn class="mt-2" variant="elevated" color="primary" @click="uploadDocuments">
          Upload
        </v-btn>

        <!-- Uploaded -->
        <v-divider class="my-6" />
        <h4 class="text-subtitle-1 font-weight-medium mb-2">Uploaded Documents</h4>
        <v-row dense>
          <v-col
            v-for="(doc, index) in candidate.documents"
            :key="index"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card class="pa-3 d-flex justify-space-between align-center" elevation="1">
              <span class="font-weight-medium">Document {{ index + 1 }}</span>
              <div>
                <v-btn icon @click="previewDocument(doc)" variant="text">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon @click="deleteDocument(index)" variant="text" color="error">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'  // ✅ use api.js wrapper
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const candidate = ref({})
const newDocuments = ref([])
const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard']

const alertBox = (icon, title, text = '') => {
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: 'OK',
    allowEnterKey: true,
    confirmButtonColor: '#1976d2'
  })
}

const fetchCandidate = async () => {
  try {
    const res = await api.get(`/candidates/${route.params.id}`)
    candidate.value = res.data
  } catch {
    alertBox('error', '❌ Failed to Load', 'Unable to fetch candidate details.')
  }
}

const uploadDocuments = async () => {
  if (!newDocuments.value.length) {
    return alertBox('warning', '⚠ No Files Selected', 'Please choose files to upload.')
  }

  try {
    const formData = new FormData()
    newDocuments.value.forEach(file => formData.append('documents', file))
    await api.post(`/candidates/${route.params.id}/documents`, formData)
    alertBox('success', '✅ Uploaded', 'Documents uploaded successfully.')
    newDocuments.value = []
    fetchCandidate()
  } catch {
    alertBox('error', '❌ Upload Failed', 'Could not upload the selected documents.')
  }
}

const deleteDocument = async (index) => {
  const confirm = await Swal.fire({
    title: 'Delete Document?',
    text: 'Are you sure you want to remove this document?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#e53935',
    allowEnterKey: true
  })

  if (!confirm.isConfirmed) return

  try {
    const updatedDocs = candidate.value.documents.filter((_, i) => i !== index)
    await api.put(`/candidates/${route.params.id}`, { documents: updatedDocs })
    candidate.value.documents = updatedDocs
    alertBox('success', '🗑️ Deleted', 'Document removed successfully.')
  } catch {
    alertBox('error', '❌ Delete Failed', 'Could not delete the document.')
  }
}

const previewDocument = (docPath) => {
  const fullUrl = `http://localhost:5000/${docPath.replace(/\\/g, '/')}`
  window.open(fullUrl, '_blank')
}

const formatDate = (date) => {
  return date ? new Date(date).toISOString().split('T')[0] : '-'
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchCandidate()
})
</script>


<style scoped>
.v-card-text p {
  margin-bottom: 0.5rem;
}
</style>
