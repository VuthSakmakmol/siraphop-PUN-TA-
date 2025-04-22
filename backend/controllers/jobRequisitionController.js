const moment = require('moment-timezone');
const JobRequisition = require('../models/JobRequisition');
const Department = require('../models/Department');
const Counter = require('../models/Counter');
const Candidate = require('../models/Candidate'); // Needed for onboard/offer count updates

// ✅ Get all job requisitions (filterable by type)
exports.getJobRequisitions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const jobRequisitions = await JobRequisition.find(filter).populate('departmentId');

    const withCounts = await Promise.all(jobRequisitions.map(async (job) => {
      const offerCount = await getOfferCount(job._id)
      return {
        ...job.toObject(),
        offerCount
      }
    }))

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisitions' });
  }
};


const getOfferCount = async (jobId) => {
  return await Candidate.countDocuments({
    jobRequisitionId: jobId,
    progress: 'JobOffer',
    hireDecision: { $in: ['Candidate in Process', null] }
  })
}


// ✅ Get single job requisition
exports.getJobRequisitionById = async (req, res) => {
  try {
    const job = await JobRequisition.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisition' });
  }
};

// ✅ Create job requisitions (multi-row if target > 1)
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
      startDate,
      type
    } = req.body;

    // Get prefix for counter
    const prefix = type === 'Blue Collar' ? 'BJR' : 'WJR';

    // Increment counter
    const counter = await Counter.findOneAndUpdate(
      { name: `jobRequisition${prefix}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const baseJobRequisitionId = `${prefix}-${counter.value}`;
    const generatedRequisitions = [];

    for (let i = 1; i <= targetCandidates; i++) {
      const individualId = `${baseJobRequisitionId.replace('-', '')}-${i}`; // BJR4-1 or WJR4-1

      const newRequisition = new JobRequisition({
        baseJobRequisitionId,
        jobRequisitionId: individualId,
        departmentId,
        jobTitle,
        recruiter,
        targetCandidates: 1,
        hiringCost,
        status,
        type,
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

// ✅ Update requisition
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

    const existing = await JobRequisition.findById(id);
    if (!existing) return res.status(404).json({ message: 'Requisition not found' });

    // Apply only editable updates
    existing.recruiter = recruiter;
    existing.targetCandidates = targetCandidates;
    existing.hiringCost = hiringCost;
    existing.status = status;
    existing.openingDate = moment.tz(openingDate, 'Asia/Phnom_Penh');

    await existing.save();

    res.status(200).json({ message: 'Updated successfully', requisition: existing });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ message: 'Failed to update job requisition' });
  }
};

// ✅ Delete requisition
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

// ✅ Auto update counts and status (called from candidateController)
exports.updateRequisitionCounts = async (jobRequisitionId) => {
  const allCandidates = await Candidate.find({ jobRequisitionId });

  const offerCount = allCandidates.filter(c =>
    c.progress === 'JobOffer' &&
    c.hireDecision !== 'Not Hired' &&
    c.hireDecision !== 'Candidate Refusal' &&
    c.progressDates?.JobOffer
  ).length;

  const onboardCount = allCandidates.filter(c =>
    c.progress === 'Onboard' &&
    c.hireDecision === 'Hired'
  ).length;

  const job = await JobRequisition.findById(jobRequisitionId);
  if (!job) return;

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


