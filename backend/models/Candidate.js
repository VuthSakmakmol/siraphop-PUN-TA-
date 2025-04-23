const mongoose = require('mongoose');
const candidateSchema = new mongoose.Schema({
  candidateId: { type: String, unique: true, sparse: true, required: true },
  fullName: { type: String, required: true },
  recruiter: { type: String, required: true },
  applicationSource: { type: String, required: true },
  jobRequisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequisition',
    required: true
  },
  // ✅ Add these:
  jobRequisitionCode: { type: String },   // e.g., WJR13-3
  departmentCode: { type: String },       // e.g., WC-2

  progress: { type: String, default: 'Application' },
  progressDates: { type: Object, default: {} },
  documents: { type: [String], default: [] },
  hireDecision: { type: String, default: 'Candidate in Process' },
  noted: { type: String, default: '' },
  _offerCounted: { type: Boolean, default: false },
  _onboardCounted: { type: Boolean, default: false }
})

module.exports = mongoose.model('Candidate', candidateSchema);
