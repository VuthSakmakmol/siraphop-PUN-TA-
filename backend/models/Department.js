const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['White Collar', 'Blue Collar'], required: true },  
  subType: {
    type: String,
    enum: ['Sewer', 'Non-Sewer'],
    required: function () {
      return this.type === 'Blue Collar';
    },
    default: null
  },  
  jobTitles: [{ type: String }],
  recruiters: {
    type: [String],
    default: []
  }
  
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
