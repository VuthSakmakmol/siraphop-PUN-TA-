const Department = require('../models/Department');
const JobRequisition = require('../models/JobRequisition');
const GlobalRecruiter = require('../models/GlobalRecruiter');

// ✅ Get all departments (with optional filter by type/subType)
exports.getDepartments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.subType) filter.subType = req.query.subType;

    const departments = await Department.find(filter);
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments', error: err.message });
  }
};

// ✅ Used in dashboard dropdown (collect recruiters from all departments)

exports.getAllRecruitersFromDepartments = async (req, res) => {
  try {
    const allDepartments = await Department.find();
    const allRecruiters = allDepartments.flatMap(d => d.recruiters || []);
    const unique = [...new Set(allRecruiters)];
    res.json({ recruiters: unique });
  } catch (err) {
    console.error('❌ Global Recruiters Fetch Error:', err);
    res.status(500).json({ message: 'Failed to fetch global recruiters', error: err.message });
  }
};




// ✅ Used in settings: return all global recruiters
exports.getGlobalRecruiters = async (req, res) => {
  try {
    const recruiters = await GlobalRecruiter.find().select('name');
    res.status(200).json(recruiters);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load global recruiters', error: err.message });
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

// ✅ Create new department
// ✅ Create new department
exports.createDepartment = async (req, res) => {
  try {
    const { departmentId, name, type, subType } = req.body;

    if (!departmentId || !name || !type) {
      return res.status(400).json({ message: 'Department ID, name and type are required' });
    }

    const idExists = await Department.findOne({ departmentId });
    if (idExists) return res.status(400).json({ message: 'Department ID already exists' });

    const nameExists = await Department.findOne({ name, type });
    if (nameExists) return res.status(400).json({ message: 'Department name already exists' });

    const newDept = new Department({
      departmentId,
      name,
      type,
      subType: type === 'Blue Collar' ? subType : null, // ✅ Only include subType for Blue Collar
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
    const { departmentId, name, type, subType } = req.body;

    const current = await Department.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Department not found' });

    const idConflict = await Department.findOne({ departmentId, _id: { $ne: req.params.id } });
    if (idConflict) return res.status(400).json({ message: 'Department ID already exists' });

    const nameConflict = await Department.findOne({ name, type, _id: { $ne: req.params.id } });
    if (nameConflict) return res.status(400).json({ message: 'Department name already exists' });

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { departmentId, name, type, subType },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update department', error: err.message });
  }
};

// ✅ Delete department if not used
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const inUse = await JobRequisition.countDocuments({ departmentId: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        message: 'Cannot delete department. It is currently used in job requisitions.',
        link: '/whitecollar/requisitions'
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete department.', error: err.message });
  }
};

// ✅ Add job title to department
exports.addJobTitle = async (req, res) => {
  try {
    const { title } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    if (dept.jobTitles.includes(title)) {
      return res.status(400).json({ message: 'Job title already exists' });
    }

    dept.jobTitles.push(title);
    await dept.save();
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add job title', error: err.message });
  }
};

// ✅ Remove job title from department
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
    res.status(500).json({ message: 'Failed to remove job title', error: err.message });
  }
};

// ✅ Add a global recruiter and push to all departments
exports.addGlobalRecruiter = async (req, res) => {
  const { recruiter } = req.body;
  if (!recruiter || recruiter.trim() === '') {
    return res.status(400).json({ message: 'Recruiter name is required' });
  }

  try {
    const exists = await GlobalRecruiter.findOne({ name: recruiter.trim() });
    if (exists) {
      return res.status(400).json({ message: 'Recruiter already exists globally' });
    }

    await GlobalRecruiter.create({ name: recruiter.trim() });

    const departments = await Department.find();
    for (let dept of departments) {
      if (!dept.recruiters.includes(recruiter.trim())) {
        dept.recruiters.push(recruiter.trim());
        await dept.save();
      }
    }

    res.status(201).json({ message: 'Global recruiter added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add recruiter', error: err.message });
  }
};

// ✅ Update recruiter name globally
exports.updateGlobalRecruiter = async (req, res) => {
  const recruiterId = req.params.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Recruiter name is required' });
  }

  try {
    const recruiter = await GlobalRecruiter.findById(recruiterId);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const oldName = recruiter.name;
    recruiter.name = name.trim();
    await recruiter.save();

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

// ✅ Delete recruiter by name
exports.deleteGlobalRecruiterByName = async (req, res) => {
  const { name } = req.body;
  try {
    await GlobalRecruiter.deleteOne({ name });

    const departments = await Department.find();
    for (let dept of departments) {
      dept.recruiters = dept.recruiters.filter(r => r !== name);
      await dept.save();
    }

    res.json({ message: `Global recruiter "${name}" removed from all departments.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete recruiter', error: err.message });
  }
};

// ✅ Delete recruiter by ID
exports.deleteGlobalRecruiter = async (req, res) => {
  try {
    const recruiter = await GlobalRecruiter.findById(req.params.id);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const name = recruiter.name;
    await GlobalRecruiter.findByIdAndDelete(req.params.id);

    const departments = await Department.find();
    for (let dept of departments) {
      dept.recruiters = dept.recruiters.filter(r => r !== name);
      await dept.save();
    }

    res.json({ message: `Global recruiter "${name}" removed from all departments.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete recruiter', error: err.message });
  }
};
