const moment = require('moment-timezone');
const JobRequisition = require('../models/JobRequisition');
const Department = require('../models/Department');
const Counter = require('../models/Counter');


// ✅ Get job titles from White Collar departments
exports.getWhiteCollarJobTitles = async (req, res) => {
  try {
    const departments = await Department.find({ type: 'White Collar' });
    const jobTitles = departments.flatMap(d => d.jobTitles || []);
    const uniqueTitles = [...new Set(jobTitles)];
    res.json(uniqueTitles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job titles' });
  }
};


// ✅ Get all job requisitions
exports.getJobRequisitions = async (req, res) => {
  try {
    const jobRequisitions = await JobRequisition.find().populate('departmentId', 'name');
    res.json(jobRequisitions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisitions' });
  }
};


// ✅ Create new requisition (multiple rows per target)
exports.createJobRequisition = async (req, res) => {
  try {
    const {
      departmentId,
      jobTitle,
      recruiter,
      targetCandidates,
      hiringCost,
      status,
      openingDate,
      startDate
    } = req.body;

    const counter = await Counter.findOneAndUpdate(
      { name: 'jobRequisitionWC' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const baseJobRequisitionId = `WJR-${counter.value}`;
    const generatedRequisitions = [];

    for (let i = 1; i <= targetCandidates; i++) {
      const individualId = `${baseJobRequisitionId.replace('-', '')}-${i}`; // e.g., WJR4-1

      const newRequisition = new JobRequisition({
        baseJobRequisitionId,
        jobRequisitionId: individualId,
        departmentId,
        jobTitle,
        recruiter,
        targetCandidates: 1,
        hiringCost,
        status,
        openingDate,
        startDate
      });

      await newRequisition.save();
      generatedRequisitions.push(newRequisition);
    }

    res.status(201).json({
      message: `${targetCandidates} requisition slots created successfully`,
      requisitions: generatedRequisitions
    });

  } catch (err) {
    console.error('❌ Create Job Requisition Error:', err);
    res.status(500).json({ message: 'Failed to create job requisitions', error: err.message });
  }
};



// ✅ Get single requisition
exports.getJobRequisitionById = async (req, res) => {
  try {
    const job = await JobRequisition.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisition' });
  }
};


// ✅ Update requisition (basic fields)
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
        openingDate: moment.tz(openingDate, 'Asia/Phnom_Penh')
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job requisition' });
  }
};


// ✅ Auto-update offer/onboard counts + status
exports.updateRequisitionCounts = async (jobRequisitionId) => {
  const allCandidates = await Candidate.find({ jobRequisitionId });

  // Offer Count: only if candidate is in JobOffer stage and not hired or refused
  const offerCount = allCandidates.filter(c =>
    c.progress === 'JobOffer' &&
    c.hireDecision !== 'Not Hired' &&
    c.hireDecision !== 'Candidate Refusal' &&
    c.progressDates?.JobOffer // only count if JobOffer date is set
  ).length;

  // Onboard Count: only if candidate reached final Onboard stage
  const onboardCount = allCandidates.filter(c =>
    c.progress === 'Onboard' &&
    c.hireDecision === 'Hired'
  ).length;

  const job = await JobRequisition.findById(jobRequisitionId);
  if (!job) return;

  // Update status
  let newStatus = 'Vacant';
  if (onboardCount >= job.targetCandidates) {
    newStatus = 'Filled';
  } else if (offerCount >= job.targetCandidates) {
    newStatus = 'Suspended';
  }

  await JobRequisition.findByIdAndUpdate(jobRequisitionId, {
    offerCount,
    onboardCount,
    status: newStatus
  });
};


// ✅ Delete job requisition
exports.deleteJobRequisition = async (req, res) => {
  try {
    await JobRequisition.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job requisition' });
  }
};


// ✅ Get job titles & recruiters for department
exports.getJobTitlesAndRecruiters = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    res.json({
      jobTitles: department.jobTitles || [],
      recruiters: department.recruiters || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load department data' });
  }
};
