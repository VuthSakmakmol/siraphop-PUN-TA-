const moment = require('moment-timezone')
const JobRequisition = require('../models/JobRequisition')
const Department = require('../models/Department')

// ✅ Get job titles from White Collar departments
exports.getWhiteCollarJobTitles = async (req, res) => {
  try {
    const departments = await Department.find({ type: 'White Collar' })
    const jobTitles = departments.flatMap(d => d.jobTitles || [])
    const uniqueTitles = [...new Set(jobTitles)]
    res.json(uniqueTitles)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job titles' })
  }
}


// Get all job requisitions
exports.getJobRequisitions = async (req, res) => {
  try {
    const jobs = await JobRequisition.find()
  .populate('departmentId', 'name') // 👈 This brings in the name only
  .sort({ createdAt: -1 })
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job requisitions' });
  }
};


exports.createJobRequisition = async (req, res) => {
  try {
    const {
      departmentId, jobTitle, recruiter, targetCandidates,
      hiringCost, status, openingDate, startDate
    } = req.body

    if (!departmentId || !jobTitle || !recruiter || !status || !openingDate || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const count = await JobRequisition.countDocuments()
    const jobRequisitionId = `JR-${String(count + 1).padStart(4, '0')}`

    const newJob = new JobRequisition({
      jobRequisitionId,
      departmentId,
      jobTitle,
      recruiter,
      targetCandidates: parseInt(targetCandidates),
      hiringCost: parseFloat(hiringCost),
      status,
      openingDate: moment.tz(openingDate, 'Asia/Phnom_Penh').toDate(),
      startDate: moment.tz(startDate, 'Asia/Phnom_Penh').toDate()
    })

    await newJob.save()
    res.status(201).json(newJob)
  } catch (err) {
    console.error('Create Job Error:', err)
    res.status(500).json({ message: 'Failed to create job requisition' })
  }
}


// ✅ Get job requisition by ID
exports.getJobRequisitionById = async (req, res) => {
  try {
    const job = await JobRequisition.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisition' })
  }
}

// ✅ Update job requisition
exports.updateJobRequisition = async (req, res) => {
  try {
    const { id } = req.params
    const {
      departmentId,
      jobTitle,
      recruiter,
      targetCandidates,
      hiringCost,
      status,
      openingDate,
      startDate
    } = req.body

    const updated = await JobRequisition.findByIdAndUpdate(
      id,
      {
        departmentId,
        jobTitle,
        recruiter,
        targetCandidates,
        hiringCost,
        status,
        openingDate: moment.tz(openingDate, 'Asia/Phnom_Penh'),
        startDate: moment.tz(startDate, 'Asia/Phnom_Penh')
      },
      { new: true }
    )

    res.status(200).json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job requisition' })
  }
}

// ✅ Get job titles and recruiters for a department
exports.getJobTitlesAndRecruiters = async (req, res) => {
  try {
    const { departmentId } = req.params
    const department = await Department.findById(departmentId)
    if (!department) return res.status(404).json({ message: 'Department not found' })

    res.json({
      jobTitles: department.jobTitles || [],
      recruiters: department.recruiters || []
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to load department data' })
  }
}

// Delete
exports.deleteJobRequisition = async (req, res) => {
  try {
    await JobRequisition.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job requisition' });
  }
};
