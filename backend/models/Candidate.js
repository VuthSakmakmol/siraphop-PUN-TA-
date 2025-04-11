const mongoose = require('mongoose');
const Counter = require('./Counter');

const candidateSchema = new mongoose.Schema({
  candidateId: { type: Number, unique: true, sparse: true },
  fullName: { type: String, required: true },
  recruiter: { type: String,required: true, },
  applicationSource: { type: String, required: true },
  jobRequisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequisition',
    required: true
  },
  progress: { type: String, default: 'Application' },
  progressDates: { type: Object, default: {} },
  documents: { type: [String], default: [] },
  hireDecision: { type: String, default: 'Candidate in Process' },
  noted: { type: String, default: '' },
  _offerCounted: { type: Boolean, default: false },
  _onboardCounted: { type: Boolean, default: false }
});

// ✅ Auto-generate candidateId only for new candidates
candidateSchema.pre('save', async function (next) {
  if (this.isNew && !this.candidateId) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'candidateId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.candidateId = counter.value;
  }
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
