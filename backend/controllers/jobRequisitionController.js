const moment = require('moment-timezone')
const JobRequisition = require('../models/JobRequisition')
const Department = require('../models/Department')
const Counter = require('../models/Counter');



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
// controllers/jobRequisitionController.js
exports.getJobRequisitions = async (req, res) => {
  try {
    const jobRequisitions = await JobRequisition.find()
      .populate('departmentId', 'name') // ✅ Fetch department name only
    res.json(jobRequisitions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error fetching job requisitions' })
  }
}


exports.createJobRequisition = async (req, res) => {
  try {
    const { departmentId, jobTitle } = req.body;

    const existing = await JobRequisition.findOne({
      departmentId,
      jobTitle,
      status: { $in: ['Vacant', 'Suspended'] },
    });

    if (existing) {
      return res.status(400).json({
        message: `Job title already in use and ${existing.status.toLowerCase()}. Please fill or cancel it before creating a new one.`,
      });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: 'jobRequisitionId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const jobRequisitionId = (counter?.value || 1).toString();

    const newJobRequisition = new JobRequisition({
      ...req.body,
      jobRequisitionId,
    });

    await newJobRequisition.save();
    res.status(201).json(newJobRequisition);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job requisition' });
  }
};



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

exports.updateJobRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recruiter,
      targetCandidates,
      hiringCost,
      status,
      openingDate
    } = req.body;

    const updated = await JobRequisition.findByIdAndUpdate(
      id,
      {
        recruiter,
        targetCandidates,
        hiringCost,
        status,
        openingDate: moment.tz(openingDate, 'Asia/Phnom_Penh'),
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job requisition' });
  }
};


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
