const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: String, required: true },
  roadmapHC: { type: Number, required: true },
  actualHC: { type: Number, required: true },
  hiringTargetHC: { type: Number, required: true },
  type: { type: String, enum: ['White Collar', 'Blue Collar'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
