const mongoose = require('mongoose');
const JobRequisition = require('../models/JobRequisition');
const Counter = require('../models/Counter');
const Candidate = require('../models/Candidate')

exports.createCandidate = async (req, res) => {
  try {
    const {
      name,
      recruiter,
      applicationSource,
      jobRequisitionId,
      hireDecision = 'Candidate in Process',
      applicationDate
    } = req.body;

    const documents = req.files?.map(file => file.path) || [];

    if (!jobRequisitionId) {
      return res.status(400).json({ message: 'Job requisition ID is required' });
    }

    const job = await JobRequisition.findById(jobRequisitionId).populate('departmentId');
    if (!job) return res.status(404).json({ message: 'Job requisition not found' });

    const jobRequisitionCode = job.jobRequisitionId;
    const departmentCode = job.departmentId?.departmentId;
    const departmentSubType = job.departmentId?.subType || null;

    // 👇 Prefix for ID
    let prefix = 'WC';
    if (job.type === 'Blue Collar') {
      prefix = departmentSubType === 'Sewer' ? 'BS' : 'NS';
    }

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const mmYY = `${mm}${yy}`;
    const counterKey = `${prefix}-${mmYY}`;

    const counter = await Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const candidateId = `${prefix}${mmYY}-${counter.value}`;

    const newCandidate = new Candidate({
      candidateId,
      fullName: name,
      recruiter,
      applicationSource,
      jobRequisitionId,
      jobRequisitionCode,
      departmentCode,
      documents,
      hireDecision,
      type: job.type,                   // ✅ Required for filtering
      subType: departmentSubType,       // ✅ Required for Blue Collar subtypes
      progress: 'Application',
      progressDates: {
        Application: applicationDate ? new Date(applicationDate) : new Date()
      }
    });

    await newCandidate.save();
    res.status(201).json({ message: 'Candidate created', candidate: newCandidate });

  } catch (err) {
    console.error('❌ Candidate creation failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ✅ Get Candidates with type and subType filtering
exports.getCandidates = async (req, res) => {
  try {
    const { type, subType } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (subType) filters.subType = subType;

    const candidates = await Candidate.find(filters).populate({
      path: 'jobRequisitionId',
      populate: { path: 'departmentId', model: 'Department' }
    });

    res.status(200).json(candidates);
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


exports.updateCandidate = async (req, res) => {
  try {
    const {
      name,
      fullName,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision,
      documents
    } = req.body;
    

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    // 🔁 Handle job reassignment (only if allowed)
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
      candidate.applicationSource = applicationSource || candidate.applicationSource || 'Other';
      candidate.jobTitle = newJob.jobTitle;
      candidate.recruiter = newJob.recruiter;
    }

    // ✅ Apply basic updates
    candidate.fullName = fullName || name || candidate.fullName;
candidate.gender = gender || candidate.gender;
candidate.applicationSource = applicationSource || candidate.applicationSource || 'Other';
candidate.hireDecision = hireDecision || candidate.hireDecision;


    // ✅ Accept either new uploads or array-based update
    if (documents) {
      candidate.documents = documents; // <-- allows delete
    } else if (req.files && req.files.length > 0) {
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

    // 🔒 Block if candidate was refused
    if (['Candidate Refusal', 'Not Hired'].includes(candidate.hireDecision) && newIndex > currentIndex) {
      return res.status(400).json({ message: `🚫 Progress is locked due to: ${candidate.hireDecision}` });
    }

    // 🔒 Enforce JobOffer locking if someone already reached it
    const existingOfferCandidate = await Candidate.findOne({
      jobRequisitionId: candidate.jobRequisitionId,
      _id: { $ne: candidate._id },
      progress: 'JobOffer',
      hireDecision: { $in: ['Candidate in Process', null] }
    });

    const tryingToMoveForward = newIndex > currentIndex;
    const isNotYetAtJobOffer = !['JobOffer', 'Hired', 'Onboard'].includes(candidate.progress);

    if (existingOfferCandidate && tryingToMoveForward && isNotYetAtJobOffer) {
      return res.status(400).json({
        message: '🔒 Progress is locked. Another candidate has already reached Job Offer. Please assign a different Job ID to continue.'
      });
    }

    // ✅ Always update the selected stage's date
    const updatedProgressDates = { ...candidate.progressDates };
    updatedProgressDates[newStage] = new Date(progressDate);
    candidate.progressDates = updatedProgressDates;

    // ✅ Update progress field only if moving forward
    if (newIndex > currentIndex) {
      candidate.progress = newStage;
    }

    // ✅ Handle JobOffer logic
    if (
      newStage === 'JobOffer' &&
      !candidate._offerCounted &&
      candidate.hireDecision === 'Candidate in Process'
    ) {
      job.offerCount = (job.offerCount || 0) + 1;
      candidate._offerCounted = true;

      if (job.offerCount >= job.targetCandidates) {
        job.status = 'Suspended';
      }
    }

    // ✅ Handle Onboard logic
    if (newStage === 'Onboard' && !candidate._onboardCounted) {
      job.onboardCount = (job.onboardCount || 0) + 1;

      // Decrease offerCount if previously counted
      if (candidate._offerCounted) {
        job.offerCount = Math.max((job.offerCount || 1) - 1, 0);
      }

      candidate._onboardCounted = true;
      candidate.hireDecision = 'Hired';

      if (job.onboardCount >= job.targetCandidates) {
        job.status = 'Filled';
      }
    }

    await candidate.save();
    await job.save();

    return res.status(200).json({ message: `✅ Candidate moved to ${newStage}`, candidate });
  } catch (err) {
    console.error('❌ Progress update error:', err);
    return res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};





// ✅ Upload More Documents
exports.uploadMoreDocuments = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' })

    const newDocs = req.files?.map(f => f.path) || []
    candidate.documents.push(...newDocs)
    await candidate.save()

    res.json({ message: '✅ Documents uploaded', candidate })
  } catch (err) {
    res.status(500).json({ message: '❌ Document upload error', error: err.message })
  }
}


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