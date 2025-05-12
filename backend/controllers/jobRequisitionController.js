const JobRequisition = require('../models/JobRequisition');
const Department = require('../models/Department');
const Counter = require('../models/Counter');
const Candidate = require('../models/Candidate'); // Needed for onboard/offer count updates

exports.getJobRequisitions = async (req, res) => {
  try {
    const filter = {};
    const { type, subType, page = 1, limit = 10 } = req.query;

    if (type) filter.type = type;
    if (subType) filter.subType = subType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, data] = await Promise.all([
      JobRequisition.countDocuments(filter),
      JobRequisition.find(filter)
        .populate('departmentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    // ✅ Add offerCount
    const withCounts = await Promise.all(data.map(async (job) => {
      const offerCount = await getOfferCount(job._id);
      return {
        ...job.toObject(),
        offerCount
      };
    }));

    res.json({
      requisitions: withCounts,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisitions', error: err.message });
  }
};



const getOfferCount = async (jobId) => {
  return await Candidate.countDocuments({
    jobRequisitionId: jobId,
    progress: 'JobOffer',
    hireDecision: { $in: ['Candidate in Process', null] }
  });
};

exports.getJobRequisitionById = async (req, res) => {
  try {
    const job = await JobRequisition.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisition' });
  }
};

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
      type,
      subType
    } = req.body;

    // ✅ Ensure subType is set for Blue Collar
    const resolvedSubType = type === 'Blue Collar' ? (subType || 'Non-Sewer') : undefined;

    const prefix = type === 'Blue Collar' ? 'BJR' : 'WJR';
    const counter = await Counter.findOneAndUpdate(
      { name: `jobRequisition${prefix}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const baseJobRequisitionId = `${prefix}-${counter.value}`;
    const generatedRequisitions = [];

    for (let i = 1; i <= targetCandidates; i++) {
      const individualId = `${baseJobRequisitionId.replace('-', '')}-${i}`;

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
        subType: resolvedSubType,
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

const moment = require('moment-timezone');

function isValidDate(d) {
  return moment(d, 'YYYY-MM-DD', true).isValid();
}

exports.updateJobRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recruiter,
      targetCandidates,
      hiringCost,
      status,
      openingDate,
      startDate
    } = req.body;

    const existing = await JobRequisition.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    existing.recruiter = recruiter;
    existing.targetCandidates = targetCandidates;
    existing.hiringCost = hiringCost;
    existing.status = status;

    if (isValidDate(openingDate)) {
      existing.openingDate = moment.tz(openingDate, 'Asia/Phnom_Penh').toDate();
    }

    if (isValidDate(startDate)) {
      existing.startDate = moment.tz(startDate, 'Asia/Phnom_Penh').toDate();
    }

    await existing.save();
    res.status(200).json({ message: 'Updated successfully', requisition: existing });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ message: 'Failed to update job requisition', error: err.message });
  }
};


exports.deleteJobRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateCount = await Candidate.countDocuments({ jobRequisitionId: id });

    if (candidateCount > 0) {
      return res.status(400).json({
        message: `❌ Cannot delete. There are still ${candidateCount} candidate(s) applying for this Job Opening. Please remove or reassign them first.`
      });
    }

    const job = await JobRequisition.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({ message: '❌ Job Requisition not found' });
    }

    res.json({ message: '✅ Job Requisition deleted successfully' });

  } catch (err) {
    console.error('❌ Error deleting Job Requisition:', err);
    res.status(500).json({ message: '❌ Server Error', error: err.message });
  }
};

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

exports.getOfferStageCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      jobRequisitionId: req.params.id,
      progress: 'JobOffer',
      hireDecision: { $in: ['Candidate in Process', null] }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'No candidate found in Job Offer stage' });
    }

    res.json({ candidate });
  } catch (err) {
    console.error('❌ Error fetching offer candidate:', err.message);
    res.status(500).json({ message: 'Failed to fetch candidate in offer stage' });
  }
};