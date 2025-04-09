<template>
  <v-container>
    <v-card class="pa-6" elevation="4">
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
          <v-col cols="12" md="4">
            <strong>Full Name:</strong> {{ candidate.fullName }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Email:</strong> {{ candidate.email || '-' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Phone:</strong> {{ candidate.phone || '-' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Gender:</strong> {{ candidate.gender }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Source:</strong> {{ candidate.applicationSource }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Hire Decision:</strong> {{ candidate.hireDecision || '-' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Applied Job:</strong> {{ candidate.jobRequisitionId?.jobTitle || '-' }}
          </v-col>
          <v-col cols="12" md="4">
            <strong>Department:</strong> {{ candidate.jobRequisitionId?.departmentId?.name || '-' }}
          </v-col>
        </v-row>

        <!-- Progress Dates -->
        <v-divider class="my-4" />
        <h4 class="text-subtitle-1 mb-2">Progress Dates</h4>
        <v-row dense>
          <v-col cols="12" md="3" v-for="stage in stages" :key="stage">
            <strong>{{ stage }}:</strong>
            <div>{{ formatDate(candidate.progressDates?.[stage]) }}</div>
          </v-col>
        </v-row>

        <!-- Upload New Documents -->
        <v-divider class="my-6" />
        <h4 class="text-subtitle-1 mb-2">Upload Documents</h4>
        <v-file-input
          v-model="newDocuments"
          multiple
          label="Select Documents"
          prepend-icon="mdi-paperclip"
          show-size
          variant="outlined"
        />
        <v-btn
          class="mt-2"
          variant="elevated"
          color="primary"
          @click="uploadDocuments"
        >
          Upload
        </v-btn>

        <!-- Uploaded Documents -->
        <v-divider class="my-6" />
        <h4 class="text-subtitle-1 mb-2">Uploaded Documents</h4>
        <v-row>
          <v-col
            v-for="(doc, index) in candidate.documents"
            :key="index"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card class="pa-4" elevation="1">
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-medium">Document {{ index + 1 }}</span>
                <div>
                  <v-btn icon @click="previewDocument(doc)" variant="text">
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                  <v-btn icon @click="deleteDocument(index)" variant="text" color="error">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
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
import axios from 'axios'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const candidate = ref({})
const newDocuments = ref([])
const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired']

const fetchCandidate = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/candidates/${route.params.id}`)
    candidate.value = res.data
  } catch (err) {
    Swal.fire('❌ Error', 'Failed to load candidate details', 'error')
  }
}

const uploadDocuments = async () => {
  if (!newDocuments.value.length) {
    Swal.fire('⚠️ No Files', 'Please select documents to upload.', 'warning')
    return
  }

  try {
    const formData = new FormData()
    newDocuments.value.forEach(file => {
      formData.append('documents', file)
    })

    await axios.post(`http://localhost:5000/api/candidates/${route.params.id}/documents`, formData)
    Swal.fire('✅ Uploaded', 'Documents uploaded successfully', 'success')
    newDocuments.value = []
    fetchCandidate()
  } catch (err) {
    console.error(err)
    Swal.fire('❌ Error', 'Failed to upload documents', 'error')
  }
}

const previewDocument = (docPath) => {
  const fullUrl = `http://localhost:5000/${docPath.replace(/\\/g, '/')}`
  window.open(fullUrl, '_blank')
}

const deleteDocument = async (index) => {
  const confirm = await Swal.fire({
    title: 'Delete Document?',
    text: 'Are you sure you want to remove this document?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirm.isConfirmed) return

  try {
    const updatedDocs = candidate.value.documents.filter((_, i) => i !== index)
    const res = await axios.put(`http://localhost:5000/api/candidates/${route.params.id}`, {
      documents: updatedDocs
    })
    Swal.fire('🗑️ Deleted', 'Document removed', 'success')
    candidate.value = res.data.candidate
  } catch (err) {
    Swal.fire('❌ Error', 'Failed to delete document', 'error')
  }
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString() : '-'
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
