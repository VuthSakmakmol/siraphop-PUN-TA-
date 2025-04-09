<template>
  <v-container>
    <v-card class="pa-5" elevation="5">
      <v-card-title>
        White Collar Candidates
        <v-spacer />
        <v-btn color="primary" @click="showForm = !showForm">
          {{ showForm ? 'Hide Form' : 'Add Candidate' }}
        </v-btn>
      </v-card-title>

      <v-expand-transition>
        <div v-show="showForm">
          <v-form @submit.prevent="handleSubmit">
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.name" label="Full Name" required />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.email" label="Email" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.phone" label="Phone" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="form.gender" :items="['Male', 'Female', 'Other']" label="Gender" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.applicationSource" :items="['LinkedIn', 'Facebook', 'Referral', 'Agency']" label="Application Source" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.jobRequisitionId"
                  :items="jobRequisitions"
                  item-title="jobRequisitionId"
                  item-value="_id"
                  label="Job Requisition"
                  required
                  :disabled="isEditMode && form.progress === 'JobOffer'"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-file-input multiple label="Upload Documents" @change="handleFileUpload" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.hireDecision" :items="['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired']" label="Hire Decision" />
              </v-col>
              <!-- Noted input field -->
              <v-col cols="12">
                <v-btn type="submit" color="success">Submit</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-expand-transition>

      <!-- Candidate Table -->
      <v-divider class="my-4" />
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field v-model="globalSearch" label="Search" prepend-inner-icon="mdi-magnify" clearable />
        </v-col>
      </v-row>

      <v-table>
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Job ID</th>
            <th>Department</th>
            <th>Job apply for</th>
            <th>Candidate Name</th>
            <th>Gender</th>
            <th>Recieve Application</th>
            <th>Manager Review</th>
            <th>Interview</th>
            <th>Job Offer</th>
            <th>Hired</th>
            <th>Source</th>
            <th>Hire Decision</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredCandidates" :key="c._id">
            <td>{{ c.candidateId }}</td>
            <td>{{ c.jobRequisitionId?.jobRequisitionId || '-' }}</td>
            <td>{{ c.jobRequisitionId?.departmentId?.name || '-' }}</td>
            <td>{{ c.jobRequisitionId?.jobTitle || '-' }}</td>
            <td>{{ c.fullName }}</td>
            <td>{{ c.gender }}</td>
            <td>{{ formatDate(c.progressDates?.Application) || '-' }}</td>

            <!-- Manager Review -->
            <td>
              <v-btn
                :disabled="c.hireDecision === 'Not Hired' || c.progress === 'ManagerReview'"
                @click="updateProgress(c._id, 'ManagerReview')"
                size="small"
                :style="{ backgroundColor: '#e3f2fd', color: '#000' }"
              >
                {{ formatDate(c.progressDates?.ManagerReview) || 'Manager Review' }}
              </v-btn>
            </td>

            <!-- Interview -->
            <td>
              <v-btn
                :disabled="c.hireDecision === 'Not Hired' || c.progress === 'Interview'"
                @click="updateProgress(c._id, 'Interview')"
                size="small"
                :style="{ backgroundColor: '#fce4ec', color: '#000' }"
              >
                {{ formatDate(c.progressDates?.Interview) || 'Interview' }}
              </v-btn>
            </td>

            <!-- Job Offer -->
            <td>
              <v-btn
                @click="handleJobOfferClick(c)"
                size="small"
                :style="{ backgroundColor: '#fff3e0', color: '#000' }"
              >
                {{ formatDate(c.progressDates?.JobOffer) || 'Job Offer' }}
              </v-btn>
            </td>

            <!-- Hired -->
            <td>
              <v-btn
                @click="handleHiredClick(c)"
                size="small"
                :style="{ backgroundColor: '#e8f5e9', color: '#000' }"
              >
                {{ formatDate(c.progressDates?.Hired) || 'Hired' }}
              </v-btn>
            </td>

            <td>{{ c.applicationSource }}</td>
            <td>{{ c.hireDecision }}</td>

            <td>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn size="x-small" color="primary" v-bind="props" flat>
                    Actions
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="viewDetails(c._id)">
                    <v-list-item-title>Details</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="editCandidate(c._id)">
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteCandidate(c._id)">
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
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

const form = ref({
  name: '',
  email: '',
  phone: '',
  gender: '',
  applicationSource: '',
  jobRequisitionId: '',
  department: '',
  hireDecision: '',
  progress: 'Application',
  progressDates: {},
  noted: '',
  documents: []
})

const candidates = ref([])
const filteredCandidates = ref([])
const jobRequisitions = ref([])
const globalSearch = ref('')
const showForm = ref(false)
// const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired']
const isEditMode = ref(false);
const editingCandidateId = ref(null);
const router = useRouter()
const viewDetails = (id) => {
  router.push({ name: 'WhiteCollarCandidateDetail', params: { id } })
}


const fetchCandidates = async () => {
  const res = await axios.get('http://localhost:5000/api/candidates')
  candidates.value = res.data
  filterCandidates()
}

const fetchJobRequisitions = async () => {
  const res = await axios.get('http://localhost:5000/api/job-requisitions')
  jobRequisitions.value = res.data.filter(j => j.status === 'Vacant')
}


const handleFileUpload = (files) => {
  form.value.documents = Array.isArray(files) ? files : [files];
};

const handleJobOfferClick = async (c) => {
  const jobId = typeof c.jobRequisitionId === 'object' ? c.jobRequisitionId._id : c.jobRequisitionId;
  const job = jobRequisitions.value.find(j => j._id === jobId);

  if (!job) {
    Swal.fire('❌ Error', 'Job requisition not found.', 'error');
    return;
  }

  if (job.status === 'Filled' || job.filledCandidates >= job.targetCandidates) {
    Swal.fire('🚫 Job Full', 'This job is already filled or has no remaining candidate slots.', 'warning');
    return;
  }

  updateProgress(c._id, 'JobOffer');
};

const handleHiredClick = async (c) => {
  const jobId = typeof c.jobRequisitionId === 'object' ? c.jobRequisitionId._id : c.jobRequisitionId;
  const job = jobRequisitions.value.find(j => j._id === jobId);

  if (!job) {
    Swal.fire('❌ Error', 'Job requisition not found.', 'error');
    return;
  }

  if (job.status === 'Filled' || job.filledCandidates >= job.targetCandidates) {
    Swal.fire('🚫 Job Full', 'This job is already filled or has no remaining candidate slots.', 'warning');
    return;
  }

  updateProgress(c._id, 'Hired');
};

const handleSubmit = async () => {
  try {
    const formData = new FormData();
    for (const key in form.value) {
      if (key !== 'documents') {
        formData.append(key, form.value[key]);
      }
    }

    if (Array.isArray(form.value.documents)) {
      form.value.documents.forEach(doc => {
        formData.append('documents', doc);
      });
    }

    if (isEditMode.value) {
      await axios.put(`http://localhost:5000/api/candidates/${editingCandidateId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire('✅ Updated', 'Candidate updated successfully.', 'success');
    } else {
      await axios.post('http://localhost:5000/api/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire('✅ Created', `Candidate "${form.value.name}" was successfully added!`, 'success');
    }

    form.value = {
      name: '', email: '', phone: '', gender: '', applicationSource: '',
      jobRequisitionId: '', department: '', hireDecision: '',
      progress: 'Application', progressDates: {}, noted: '', documents: []
    };
    isEditMode.value = false;
    editingCandidateId.value = null;
    showForm.value = false;
    fetchCandidates();

  } catch (error) {
    console.error('Submit error:', error);
    Swal.fire('❌ Error', 'Failed to submit candidate data', 'error');
  }
};



const updateProgress = async (candidateId, step) => {
  const confirm = await Swal.fire({
    title: `Are you sure to move to "${step}" stage?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, update',
    cancelButtonText: 'Cancel'
  });

  if (!confirm.isConfirmed) return;

  try {
    const candidate = candidates.value.find(c => c._id === candidateId);
    if (candidate) {
      candidate.progressDates[step] = new Date();  // ✅ set timestamp
      candidate.progress = step;

      // ✅ API call to backend to update candidate + job requisition
      await axios.put(`http://localhost:5000/api/candidates/${candidateId}/progress`, {
        newStage: step,
        progressDates: candidate.progressDates
      });

      await fetchCandidates(); // 🔁 Refresh list
      Swal.fire('✅ Updated!', `Candidate is now in "${step}" stage`, 'success');
    }
  } catch (error) {
    console.error('❌ Progress update failed:', error);
    Swal.fire('Error', 'Failed to update candidate progress.', 'error');
  }
};


const formatDate = (val) => {
  return val ? new Date(val).toLocaleString() : '-'
}

const filterCandidates = () => {
  let list = [...candidates.value]
  if (globalSearch.value) {
    const keyword = globalSearch.value.toLowerCase()
    list = list.filter(c => c.fullName.toLowerCase().includes(keyword))
  }
  filteredCandidates.value = list
}

const editCandidate = (id) => {
  const candidate = candidates.value.find(c => c._id === id);
  if (!candidate) return;

  form.value = {
    name: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    gender: candidate.gender,
    applicationSource: candidate.applicationSource,
    jobRequisitionId: candidate.jobRequisitionId?._id || candidate.jobRequisitionId,
    department: candidate.jobRequisitionId?.departmentId?.name || '',
    hireDecision: candidate.hireDecision,
    progress: candidate.progress,
    progressDates: candidate.progressDates || {},
    documents: [], // You can also load existing docs if needed
  };

  editingCandidateId.value = id;
  isEditMode.value = true;
  showForm.value = true;
};

const deleteCandidate = async (id) => {
  const confirm = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the candidate.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel'
  });

  if (!confirm.isConfirmed) return;

  try {
    await axios.delete(`http://localhost:5000/api/candidates/${id}`);
    await fetchCandidates();
    Swal.fire('🗑️ Deleted!', 'Candidate was removed.', 'success');
  } catch (err) {
    Swal.fire('❌ Error', 'Could not delete candidate.', 'error');
  }
};



// const isJobOfferFilled = (jobRequisitionId) => {
//   const jobRequisition = jobRequisitions.value.find(j => j._id === jobRequisitionId)
//   return jobRequisition ? jobRequisition.filledCount >= jobRequisition.targetCandidates : false
// }

onMounted(() => {
  fetchJobRequisitions()
  fetchCandidates()
})
</script>

 
<style scoped>
/* Make table horizontally scrollable */
.v-table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

/* Prevent word wrap in table header and body cells */
.v-table th,
.v-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* You can adjust this width */
}

/* Optional: make buttons smaller to fit in 1 row better */
.v-btn {
  font-size: 0.7rem;
  padding: 3px 6px;
  min-width: 80px;
}


/* Fix alignment of icons and tooltips */
.v-icon {
  vertical-align: middle;
}

/* Style file input to look consistent */
.v-file-input {
  font-size: 0.85rem;
}


.stage-btn {
  color: #000;
  font-weight: 500;
  text-transform: none;
}

.stage-manager {
  background-color: #e3f2fd; /* light blue */
}

.stage-interview {
  background-color: #fce4ec; /* light pink */
}

.stage-offer {
  background-color: #fff3e0; /* soft orange */
}

.stage-hired {
  background-color: #e8f5e9; /* light green */
}

</style>
