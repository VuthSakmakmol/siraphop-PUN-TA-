const mongoose = require('mongoose');

const jobRequisitionSchema = new mongoose.Schema({
  jobRequisitionId: { type: String, required: true, unique: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  jobTitle: { type: String, required: true },
  recruiter: { type: String, required: true },
  targetCandidates: { type: Number, required: true },
  filledCandidates: { type: Number, default: 0 },
  hiringCost: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['Vacant', 'Suspended', 'Filled', 'Cancel'],
    default: 'Vacant'
  },

  openingDate: { type: Date, required: true },
  startDate: { type: Date, required: false },

  // Type: White or Blue
  type: {
    type: String,
    enum: ['White Collar', 'Blue Collar'],
    required: true
  },

  // Subtype: Sewer/Non-Sewer for Blue Collar
  subType: {
    type: String,
    enum: ['Sewer', 'Non-Sewer'],
    default: function () {
      return this.type === 'Blue Collar' ? 'Non-Sewer' : undefined;
    }
  },

  onboardCount: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('JobRequisition', jobRequisitionSchema);
