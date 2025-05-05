const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: String,
    required: true
  },

  // Main category
  type: {
    type: String,
    enum: ['White Collar', 'Blue Collar'],
    required: true
  },

  // Only applicable if type is Blue Collar
  subType: {
    type: String,
    enum: ['Sewer', 'Non-Sewer'],
    default: null
  },

  roadmapHC: {
    type: Number,
    required: true
  },
  actualHC: {
    type: Number,
    required: true
  },
  hiringTargetHC: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
