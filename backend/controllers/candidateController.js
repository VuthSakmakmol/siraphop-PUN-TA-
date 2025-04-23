const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');
const Counter = require('../models/Counter');

// ✅ Create Candidate
exports.createCandidate = async (req, res) => {
  const {
    name,
    recruiter,
    applicationSource,
    jobRequisitionId,
    hireDecision = 'Candidate in Process',
    applicationDate
  } = req.body;

  const documents = req.files?.map(file => file.path) || [];

  if (!jobRequisitionId || !mongoose.Types.ObjectId.isValid(jobRequisitionId)) {
    return res.status(400).json({ message: '❌ Invalid or missing Job Requisition ID.' });
  }

  try {
    const job = await JobRequisition.findById(jobRequisitionId).populate('departmentId');
    if (!job) return res.status(404).json({ message: '❌ Job requisition not found.' });
    if (job.status !== 'Vacant') return res.status(400).json({ message: `⚠️ Cannot apply. Job requisition is currently ${job.status}.` });

    const jobRequisitionCode = job.jobRequisitionId;
    const departmentCode = job.departmentId?.departmentId;

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);

    const counter = await Counter.findOneAndUpdate(
      { name: 'white_collar_candidate_counter' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const candidateId = `W${mm}${yy}${counter.value}`;

    const newCandidate = new Candidate({
      candidateId,
      fullName: name,
      recruiter,
      applicationSource,
      jobRequisitionId,
      jobRequisitionCode,
      departmentCode,
      hireDecision,
      documents,
      progress: 'Application',
      progressDates: {
        Application: applicationDate ? new Date(applicationDate) : new Date()
      }
    });

    await newCandidate.save();
    res.status(201).json({ message: `✅ Candidate ${name} (ID: ${candidateId}) created.`, candidate: newCandidate });
  } catch (err) {
    console.error('❌ Error creating candidate:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// ✅ Get all candidates
exports.getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate({
      path: 'jobRequisitionId',
      populate: { path: 'departmentId', model: 'Department' }
    });
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch candidates', error: err.message });
  }
};

// ✅ Get candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('jobRequisitionId');
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// ✅ Update candidate
exports.updateCandidate = async (req, res) => {
  try {
    const {
      name,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision
    } = req.body;

    const updatedFields = {
      fullName: name,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision
    };

    if (req.files && req.files.length > 0) {
      updatedFields.documents = req.files.map(file => file.path);
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const job = await JobRequisition.findById(candidate.jobRequisitionId);
    if (['Candidate Refusal', 'Not Hired'].includes(hireDecision) && candidate._offerCounted && job) {
      job.offerCount = Math.max((job.offerCount || 1) - 1, 0);
      candidate._offerCounted = false;
      if (job.offerCount < job.targetCandidates) job.status = 'Vacant';
      await job.save();
    }

    Object.assign(candidate, updatedFields);
    await candidate.save();

    res.status(200).json({ message: '✅ Candidate updated successfully', candidate });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: '❌ Failed to update candidate', error: err.message });
  }
};

// ✅ Update progress
exports.updateCandidateProgress = async (req, res) => {
  const { newStage, progressDate } = req.body;

  try {
    if (!newStage || !progressDate) {
      return res.status(400).json({ message: '❌ Missing stage or progress date.' });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const job = await JobRequisition.findById(candidate.jobRequisitionId);
    if (!job) return res.status(404).json({ message: '❌ Job requisition not found' });
    if (job.status === 'Cancel') return res.status(400).json({ message: '🚫 Job is canceled.' });

    const stageOrder = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const currentIndex = stageOrder.indexOf(candidate.progress);
    const newIndex = stageOrder.indexOf(newStage);

    if (newIndex === -1) return res.status(400).json({ message: '❌ Invalid stage name' });
    if (['Candidate Refusal', 'Not Hired'].includes(candidate.hireDecision) && newIndex > currentIndex) {
      return res.status(400).json({ message: `🚫 Progress is locked due to: ${candidate.hireDecision}` });
    }

    const finalStages = ['JobOffer', 'Hired', 'Onboard'];
    if (finalStages.includes(newStage)) {
      const existing = await Candidate.findOne({
        jobRequisitionId: candidate.jobRequisitionId,
        _id: { $ne: candidate._id },
        progress: { $in: finalStages },
        hireDecision: { $in: ['Candidate in Process', null] }
      });
      if (existing) return res.status(409).json({ message: '⚠️ Another candidate has already been offered this job.' });
    }

    candidate.progressDates = {
      ...candidate.progressDates,
      [newStage]: new Date(progressDate)
    };

    if (newIndex > currentIndex) {
      candidate.progress = newStage;
    }

    if (newStage === 'JobOffer' && !candidate._offerCounted && candidate.hireDecision === 'Candidate in Process') {
      job.offerCount = (job.offerCount || 0) + 1;
      candidate._offerCounted = true;
      if (job.offerCount >= job.targetCandidates) job.status = 'Suspended';
    }

    if (newStage === 'Onboard' && !candidate._onboardCounted) {
      job.onboardCount = (job.onboardCount || 0) + 1;
      if (candidate._offerCounted) job.offerCount = Math.max((job.offerCount || 1) - 1, 0);
      candidate._onboardCounted = true;
      candidate.hireDecision = 'Hired';
      if (job.onboardCount >= job.targetCandidates) job.status = 'Filled';
    }

    await candidate.save();
    await job.save();

    res.status(200).json({ message: `✅ Candidate moved to ${newStage}`, candidate });
  } catch (err) {
    console.error('❌ Progress update error:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// ✅ Upload more documents
exports.uploadMoreDocuments = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const newDocs = req.files?.map(f => f.path) || [];
    candidate.documents.push(...newDocs);
    await candidate.save();

    res.json({ message: '✅ Documents uploaded', candidate });
  } catch (err) {
    res.status(500).json({ message: '❌ Document upload error', error: err.message });
  }
};

// ✅ Delete candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });
    res.status(200).json({ message: '✅ Candidate deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: '❌ Failed to delete candidate', error: err.message });
  }
};

// ✅ Lock/Unlock candidate
exports.lockCandidateProgress = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const job = await JobRequisition.findById(candidate.jobRequisitionId);
    if (job && job.filledCount >= job.targetCandidates) {
      candidate.locked = true;
      await candidate.save();
      return res.json({ message: '🔒 Auto-locked (Filled)', candidate });
    }

    candidate.locked = !candidate.locked;
    await candidate.save();
    res.json({ message: `🔄 Candidate ${candidate.locked ? 'locked' : 'unlocked'}`, candidate });
  } catch (err) {
    res.status(500).json({ message: '❌ Lock toggle failed', error: err.message });
  }
};

// ✅ Count offers for requisition
exports.getActiveOffersByRequisitionId = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const count = await Candidate.countDocuments({
      jobRequisitionId: requisitionId,
      progress: 'JobOffer',
      hireDecision: { $in: ['Candidate in Process', null] }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch active offers', error: err.message });
  }
};

// ✅ Check if offer/hire exists for requisition
exports.checkActiveOffers = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requisitionId)) return res.status(400).json({ message: '❌ Invalid requisition ID' });

    const hasActiveOffers = await Candidate.exists({
      jobRequisitionId: requisitionId,
      progress: { $in: ['JobOffer', 'Hired', 'Onboard'] },
      hireDecision: { $in: ['Candidate in Process', null] }
    });

    res.status(200).json({ hasActiveOffers: !!hasActiveOffers });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};