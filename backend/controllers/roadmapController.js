const Roadmap = require('../models/Roadmap');

// 🟢 GET all roadmaps (with optional filters)
exports.getRoadmaps = async (req, res) => {
  try {
    const query = {};

    if (req.query.year) query.year = parseInt(req.query.year);
    if (req.query.month) query.month = req.query.month;

    if (req.query.type) {
      const { type, subType } = parseType(req.query.type);
      query.type = type;
      if (subType) query.subType = subType;
    }

    const data = await Roadmap.find(query).sort({ year: 1, month: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching roadmaps', error: err });
  }
};

// 🟡 CREATE roadmap
exports.createRoadmap = async (req, res) => {
  try {
    const { type, subType } = parseType(req.body.type);

    const newEntry = new Roadmap({
      ...req.body,
      type,
      subType
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: 'Creation failed', error: err });
  }
};

// 🟠 UPDATE roadmap
exports.updateRoadmap = async (req, res) => {
  try {
    const { type, subType } = parseType(req.body.type);

    const updated = await Roadmap.findByIdAndUpdate(
      req.params.id,
      { ...req.body, type, subType },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err });
  }
};

// 🔴 DELETE roadmap
exports.deleteRoadmap = async (req, res) => {
  try {
    await Roadmap.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err });
  }
};

// 🧠 Helper to split "Blue Collar - Sewer" to type and subType
function parseType(typeString) {
  if (typeString === 'White Collar') return { type: 'White Collar', subType: null };
  if (typeString === 'Blue Collar - Sewer') return { type: 'Blue Collar', subType: 'Sewer' };
  if (typeString === 'Blue Collar - Non-Sewer') return { type: 'Blue Collar', subType: 'Non-Sewer' };
  return { type: typeString, subType: null };
}
