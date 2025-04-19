const mongoose = require('mongoose');

const globalRecruiterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('GlobalRecruiter', globalRecruiterSchema);
