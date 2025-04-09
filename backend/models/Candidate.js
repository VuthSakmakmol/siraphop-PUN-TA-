const mongoose = require('mongoose');
const Counter = require('./Counter');

const candidateSchema = new mongoose.Schema({
  candidateId: { type: Number, unique: true, sparse: true }, // <- add sparse!
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
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
});

// ✅ Only generate candidateId if it's new
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
