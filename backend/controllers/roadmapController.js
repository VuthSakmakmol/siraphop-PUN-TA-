const Roadmap = require('../models/Roadmap');

// GET all roadmaps (with optional filters)
exports.getRoadmaps = async (req, res) => {
  try {
    const query = {}
    if (req.query.year) query.year = parseInt(req.query.year)
    if (req.query.type) query.type = req.query.type
    if (req.query.month) query.month = req.query.month

    const data = await Roadmap.find(query).sort({ year: 1, month: 1 })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching roadmaps' })
  }
}


// CREATE
exports.createRoadmap = async (req, res) => {
  try {
    const newEntry = new Roadmap(req.body);
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: 'Creation failed', error: err });
  }
};

// UPDATE
exports.updateRoadmap = async (req, res) => {
  try {
    const updated = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err });
  }
};

// DELETE
exports.deleteRoadmap = async (req, res) => {
  try {
    await Roadmap.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err });
  }
};
