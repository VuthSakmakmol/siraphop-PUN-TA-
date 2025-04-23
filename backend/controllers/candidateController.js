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

    let counterName, prefix;
    if (job.type === 'White Collar') {
      counterName = 'white_collar_candidate_counter';
      prefix = 'W';
    } else if (job.type === 'Blue Collar') {
      counterName = 'blue_collar_candidate_counter';
      prefix = job.departmentId?.subType === 'Sewer' ? 'BS' : 'BN';
    } else {
      return res.status(400).json({ message: '❌ Unknown job type.' });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const candidateId = `${prefix}${mm}${yy}${counter.value}`;

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

// ✅ Get Candidates
exports.getCandidates = async (req, res) => {
  try {
    const type = req.query.type;
    const candidates = await Candidate.find().populate({
      path: 'jobRequisitionId',
      populate: [{ path: 'departmentId', model: 'Department' }]
    });

    const filtered = type ? candidates.filter(c => c.jobRequisitionId?.type === type) : candidates;
    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch candidates', error: err.message });
  }
};

// ✅ Get Candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('jobRequisitionId');
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// ✅ Update Candidate
exports.updateCandidate = async (req, res) => {
  try {
    const {
      name,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision
    } = req.body;

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const currentJob = await JobRequisition.findById(candidate.jobRequisitionId);

    // 🔁 If hire decision changed to "Refused" or "Not Hired", adjust offer count
    if (['Candidate Refusal', 'Not Hired'].includes(hireDecision) && candidate._offerCounted && currentJob) {
      currentJob.offerCount = Math.max((currentJob.offerCount || 1) - 1, 0);
      candidate._offerCounted = false;
      if (currentJob.offerCount < currentJob.targetCandidates) currentJob.status = 'Vacant';
      await currentJob.save();
    }

    // 🔁 If job ID changed and candidate hasn't reached JobOffer yet
    if (
      jobRequisitionId &&
      candidate.progress !== 'JobOffer' &&
      String(jobRequisitionId) !== String(candidate.jobRequisitionId)
    ) {
      const newJob = await JobRequisition.findById(jobRequisitionId).populate('departmentId');
      if (!newJob) return res.status(404).json({ message: '❌ New job requisition not found.' });

      candidate.jobRequisitionId = newJob._id;
      candidate.jobRequisitionCode = newJob.jobRequisitionId;
      candidate.departmentCode = newJob.departmentId?.departmentId || '';
      candidate.jobTitle = newJob.jobTitle;
      candidate.recruiter = newJob.recruiter;
    }

    // ✅ Basic fields
    candidate.fullName = name;
    candidate.gender = gender;
    candidate.applicationSource = applicationSource;
    candidate.hireDecision = hireDecision;

    if (req.files && req.files.length > 0) {
      candidate.documents = req.files.map(file => file.path);
    }

    await candidate.save();

    res.status(200).json({ message: '✅ Candidate updated successfully', candidate });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: '❌ Failed to update candidate', error: err.message });
  }
};



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

    // Prevent updates if candidate is marked as refused
    if (['Candidate Refusal', 'Not Hired'].includes(candidate.hireDecision) && newIndex > currentIndex) {
      return res.status(400).json({ message: `🚫 Progress is locked due to: ${candidate.hireDecision}` });
    }

    // ✅ Lock enforcement: if someone has already placed JobOffer
    const existingOfferCandidate = await Candidate.findOne({
      jobRequisitionId: candidate.jobRequisitionId,
      _id: { $ne: candidate._id },
      progress: 'JobOffer',
      hireDecision: { $in: ['Candidate in Process', null] }
    });

    const tryingToMoveForward = newIndex > currentIndex;
    const isBeyondAllowed = !['JobOffer', 'Hired', 'Onboard'].includes(candidate.progress);

    if (existingOfferCandidate && tryingToMoveForward && isBeyondAllowed) {
      return res.status(400).json({
        message: '🔒 Progress is locked. Another candidate has already reached Job Offer. Please assign a different Job ID to continue.'
      });
    }

    // ✅ Save progress date
    candidate.progressDates = {
      ...candidate.progressDates,
      [newStage]: new Date(progressDate)
    };

    if (newIndex > currentIndex) {
      candidate.progress = newStage;
    }

    // ✅ Handle JobOffer
    if (newStage === 'JobOffer' && !candidate._offerCounted && candidate.hireDecision === 'Candidate in Process') {
      job.offerCount = (job.offerCount || 0) + 1;
      candidate._offerCounted = true;
      if (job.offerCount >= job.targetCandidates) job.status = 'Suspended';
    }

    // ✅ Handle Onboard
    if (newStage === 'Onboard' && !candidate._onboardCounted) {
      job.onboardCount = (job.onboardCount || 0) + 1;
      if (candidate._offerCounted) {
        job.offerCount = Math.max((job.offerCount || 1) - 1, 0);
      }
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


// ✅ Upload Documents
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

// ✅ Delete Candidate
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

// ✅ Lock/Unlock Progress
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

// ✅ Check Active Offers
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

// ✅ Optional endpoint if you really want to use it
exports.getActiveOffersByRequisitionId = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const offers = await Candidate.find({
      jobRequisitionId: requisitionId,
      progress: 'JobOffer',
      hireDecision: { $in: ['Candidate in Process', null] }
    });
    res.json({ count: offers.length, offers });
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch active offers', error: err.message });
  }
};

