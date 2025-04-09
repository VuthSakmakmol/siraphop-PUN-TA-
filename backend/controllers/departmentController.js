const Department = require('../models/Department');
const JobRequisition = require('../models/JobRequisition');
const Counter = require('../models/Counter');

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments', error: err.message });
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
exports.createDepartment = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const existing = await Department.findOne({ name, type });
    if (existing) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: 'departmentId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const newDept = new Department({
      departmentId: counter.value,
      name,
      type,
      jobTitles: [],
      recruiters: []
    });

    await newDept.save();
    res.status(201).json(newDept);

  } catch (err) {
    console.error('❌ Create department error:', err);
    res.status(500).json({ message: 'Failed to create department', error: err.message });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { name, type } = req.body;
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { name, type },
      { new: true }
    );
    if (!updatedDepartment) return res.status(404).json({ message: 'Department not found' });
    res.json(updatedDepartment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update department', error: err.message });
  }
};

// Delete department
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

// Add job title
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

// Add recruiter
exports.addRecruiter = async (req, res) => {
  const { recruiter } = req.body;
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    if (department.recruiters.includes(recruiter)) {
      return res.status(400).json({ message: 'Recruiter already exists' });
    }

    department.recruiters.push(recruiter);
    await department.save();
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add recruiter', error: err.message });
  }
};

exports.removeJobTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const dept = await Department.findById(id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    const inUse = await JobRequisition.findOne({ departmentId: id, jobTitle: title });
    if (inUse) {
      return res.status(400).json({
        message: `❌ The job title "${title}" is used in a job requisition. Please delete the related requisitions first.`
      });
    }

    dept.jobTitles = dept.jobTitles.filter(t => t !== title);
    await dept.save();

    res.json({ message: 'Job title removed', department: dept });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove recruiter
exports.removeRecruiter = async (req, res) => {
  const { recruiter } = req.body;
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const inUse = await JobRequisition.findOne({ departmentId: req.params.id, recruiter });
    if (inUse) {
      return res.status(400).json({
        message: `Cannot remove recruiter "${recruiter}" because it's used in job requisitions.`,
        link: '/whitecollar/requisitions'
      });
    }

    department.recruiters = department.recruiters.filter(r => r !== recruiter);
    await department.save();
    res.json({ message: 'Recruiter removed successfully.', department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
