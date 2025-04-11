const Department = require('../models/Department');
const JobRequisition = require('../models/JobRequisition');
const GlobalRecruiter = require('../models/GlobalRecruiter');


// ✅ Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments', error: err.message });
  }
};

// ✅ Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Create department
exports.createDepartment = async (req, res) => {
  try {
    const { departmentId, name, type } = req.body;

    if (!departmentId || !name || !type) {
      return res.status(400).json({ message: 'Department ID, name and type are required' });
    }

    const existingId = await Department.findOne({ departmentId });
    if (existingId) return res.status(400).json({ message: 'Department ID already exists' });

    const existingName = await Department.findOne({ name, type });
    if (existingName) return res.status(400).json({ message: 'Department name already exists' });

    const newDept = new Department({
      departmentId,
      name,
      type,
      jobTitles: [],
      recruiters: []
    });

    await newDept.save();
    res.status(201).json(newDept);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create department', error: err.message });
  }
};

// ✅ Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentId, name, type } = req.body;
    const current = await Department.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Department not found' });

    const existingId = await Department.findOne({ departmentId, _id: { $ne: req.params.id } });
    if (existingId) return res.status(400).json({ message: 'Department ID already exists' });

    const existingName = await Department.findOne({ name, type, _id: { $ne: req.params.id } });
    if (existingName) return res.status(400).json({ message: 'Department name already exists' });

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { departmentId, name, type },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update department', error: err.message });
  }
};

// ✅ Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const jobCount = await JobRequisition.countDocuments({ departmentId: req.params.id });
    if (jobCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete department. It is currently used in job requisitions.',
        link: '/whitecollar/requisitions'
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error while deleting department.', error: err.message });
  }
};

// ✅ Add job title
exports.addJobTitle = async (req, res) => {
  const { title } = req.body;
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    if (department.jobTitles.includes(title)) {
      return res.status(400).json({ message: 'Job title already exists' });
    }

    department.jobTitles.push(title);
    await department.save();
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add job title', error: err.message });
  }
};

// ✅ Remove job title
exports.removeJobTitle = async (req, res) => {
  try {
    const { title } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    const inUse = await JobRequisition.findOne({ departmentId: req.params.id, jobTitle: title });
    if (inUse) {
      return res.status(400).json({
        message: `❌ The job title "${title}" is used in a job requisition.`,
        link: '/whitecollar/requisitions'
      });
    }

    dept.jobTitles = dept.jobTitles.filter(t => t !== title);
    await dept.save();
    res.json({ message: 'Job title removed', department: dept });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getGlobalRecruiters = async (req, res) => {
  try {
    const recruiters = await GlobalRecruiter.find().select('name'); // Keep _id
    res.status(200).json(recruiters);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load global recruiters', error: err.message });
  }
};


// ✅ POST: Add global recruiter and apply to all departments
exports.addGlobalRecruiter = async (req, res) => {
  const { recruiter } = req.body;

  if (!recruiter || recruiter.trim() === '') {
    return res.status(400).json({ message: 'Recruiter name is required' });
  }

  try {
    const existing = await GlobalRecruiter.findOne({ name: recruiter.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Recruiter already exists globally' });
    }

    // Save to global recruiter table
    await GlobalRecruiter.create({ name: recruiter.trim() });

    // Add to all departments if not already present
    const departments = await Department.find();
    for (const dept of departments) {
      if (!dept.recruiters.includes(recruiter.trim())) {
        dept.recruiters.push(recruiter.trim());
        await dept.save();
      }
    }

    res.status(201).json({ message: 'Global recruiter added successfully.' });
  } catch (err) {
    console.error('🔥 Error adding recruiter:', err.message);
    res.status(500).json({ message: 'Failed to add recruiter', error: err.message });
  }
};

// ✅ Delete a global recruiter
exports.deleteGlobalRecruiter = async (req, res) => {
  const { name } = req.body;
  try {
    await GlobalRecruiter.deleteOne({ name });

    // Also remove from all departments
    const departments = await Department.find();
    for (let dept of departments) {
      dept.recruiters = dept.recruiters.filter(r => r !== name);
      await dept.save();
    }

    res.json({ message: `Global recruiter "${name}" removed from all departments.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete global recruiter', error: err.message });
  }
};

exports.deleteGlobalRecruiter = async (req, res) => {
  try {
    const recruiter = await GlobalRecruiter.findById(req.params.id);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const name = recruiter.name;
    await GlobalRecruiter.findByIdAndDelete(req.params.id);

    // Remove from all departments
    const departments = await Department.find();
    for (let dept of departments) {
      dept.recruiters = dept.recruiters.filter(r => r !== name);
      await dept.save();
    }

    res.json({ message: `Global recruiter "${name}" removed from all departments.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete global recruiter', error: err.message });
  }
};


// ✅ PUT: Update recruiter name globally
exports.updateGlobalRecruiter = async (req, res) => {
  const recruiterId = req.params.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Recruiter name is required' });
  }

  try {
    const recruiter = await GlobalRecruiter.findById(recruiterId);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    // Update name in recruiter table
    const oldName = recruiter.name;
    recruiter.name = name.trim();
    await recruiter.save();

    // Update all departments
    const departments = await Department.find({ recruiters: oldName });
    for (let dept of departments) {
      dept.recruiters = dept.recruiters.map(r => r === oldName ? name.trim() : r);
      await dept.save();
    }

    res.json({ message: 'Recruiter updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update recruiter', error: err.message });
  }
};

