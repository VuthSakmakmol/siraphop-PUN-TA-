const Department = require('../models/Department');
const Counter = require('../models/Counter');


// Get all departments (with optional filtering by type)
exports.getDepartments = async (req, res) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {}
    const departments = await Department.find(filter)
    res.json(departments)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments' })
  }
}


exports.getDepartmentById = async (req, res) => {
  const department = await Department.findById(req.params.id)
  if (!department) return res.status(404).json({ message: 'Department not found' })
  res.json(department)
}


exports.createDepartment = async (req, res) => {
  try {
    const { name, type } = req.body

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' })
    }

    // Check for duplicate
    const exists = await Department.findOne({ name, type })
    if (exists) {
      return res.status(400).json({ message: 'Department already exists' })
    }

    // Generate department ID
    const count = await Department.countDocuments()
    const departmentId = `DEPT-${String(count + 1).padStart(3, '0')}`

    const department = await Department.create({
      name,
      type,
      departmentId,
      jobTitles: [],
      recruiters: []
    })

    res.status(201).json(department)
  } catch (err) {
    console.error('Create error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}


// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update department' })
  }
}


// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete department' })
  }
}

// Add unique job title
exports.addJobTitle = async (req, res) => {
  const { title } = req.body
  try {
    const dept = await Department.findById(req.params.id)
    if (dept.jobTitles.includes(title)) {
      return res.status(400).json({ message: 'Job title already exists' })
    }
    dept.jobTitles.push(title)
    await dept.save()
    res.json(dept)
  } catch (err) {
    res.status(500).json({ message: 'Failed to add job title' })
  }
}

// Add unique recruiter
exports.addRecruiter = async (req, res) => {
  const { recruiter } = req.body
  try {
    const dept = await Department.findById(req.params.id)
    if (dept.recruiters.includes(recruiter)) {
      return res.status(400).json({ message: 'Recruiter already exists' })
    }
    dept.recruiters.push(recruiter)
    await dept.save()
    res.json(dept)
  } catch (err) {
    res.status(500).json({ message: 'Failed to add recruiter' })
  }
}


// ✅ Remove Job Title
exports.removeJobTitle = async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body

    const dept = await Department.findById(id)
    if (!dept) return res.status(404).json({ message: 'Department not found' })

    dept.jobTitles = dept.jobTitles.filter(t => t !== title)
    await dept.save()

    res.json(dept)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// ✅ Remove Recruiter
exports.removeRecruiter = async (req, res) => {
  try {
    const { id } = req.params
    const { recruiter } = req.body

    const dept = await Department.findById(id)
    if (!dept) return res.status(404).json({ message: 'Department not found' })

    dept.recruiters = dept.recruiters.filter(r => r !== recruiter)
    await dept.save()

    res.json(dept)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

