const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  candidateId: { type: String, unique: true, required: true },
  fullName: { type: String, required: true },
  recruiter: { type: String, required: true },
  applicationSource: { type: String, required: true },

  jobRequisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequisition',
    required: true
  },
  jobRequisitionCode: { type: String },
  departmentCode: { type: String },

  type: {
    type: String,
    enum: ['White Collar', 'Blue Collar'],
    required: true
  },

  subType: {
    type: String,
    enum: ['Sewer', 'Non-Sewer'],
    default: null
  },

  progress: {
    type: String,
    enum: [
      'Application',
      'ManagerReview',
      'Interview',
      'JobOffer',
      'Hired',
      'Onboard'
    ],
    default: 'Application'
  },

  progressDates: {
    type: Object,
    default: {}
  },

  documents: { type: [String], default: [] },
  hireDecision: {
    type: String,
    enum: ['Hired', 'Candidate in Process', 'Candidate Refusal', 'Not Hired'],
    default: 'Candidate in Process'
  },

  noted: { type: String, default: '' },

  _offerCounted: { type: Boolean, default: false },
  _onboardCounted: { type: Boolean, default: false }
}, { timestamps: true }); // ✅ move this here

module.exports = mongoose.model('Candidate', candidateSchema);
