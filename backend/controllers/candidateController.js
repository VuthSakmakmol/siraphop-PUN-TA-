const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');
const Counter = require('../models/Counter');

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
    // Get Job and Department info
    const job = await JobRequisition.findById(jobRequisitionId).populate('departmentId');
    if (!job) {
      return res.status(404).json({ message: '❌ Job requisition not found.' });
    }

    if (job.status !== 'Vacant') {
      return res.status(400).json({
        message: `⚠️ Cannot apply. Job requisition is currently ${job.status}.`
      });
    }

    // Determine ID prefix: WC-, S-, or NS-
    let prefix;

    if (job.departmentId?.type === 'White Collar') {
      prefix = 'WC';
    } else if (job.departmentId?.subType === 'Sewer') {
      prefix = 'S';
    } else if (job.departmentId?.subType === 'Non-Sewer') {
      prefix = 'NS';
    } else {
      return res.status(400).json({ message: '❌ Invalid department type or subType.' });
    }

    // Auto-increment candidate ID using Counter model
    const counter = await Counter.findOneAndUpdate(
      { name: `candidateId_${prefix}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const candidateId = `${prefix}-${counter.value}`;

    const newCandidate = new Candidate({
      candidateId,
      fullName: name,
      recruiter,
      applicationSource,
      jobRequisitionId,
      hireDecision,
      documents,
      progress: 'Application',
      progressDates: {
        Application: applicationDate ? new Date(applicationDate) : new Date()
      }
    });

    await newCandidate.save();

    res.status(201).json({
      message: `✅ Candidate ${name} (ID: ${candidateId}) created.`,
      candidate: newCandidate
    });

  } catch (err) {
    console.error('❌ Error creating candidate:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};


// ✅ Get All Candidates
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
    const { name, email, phone, gender, applicationSource, jobRequisitionId, hireDecision } = req.body;
    const updatedFields = {
      fullName: name,
      email,
      phone,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision
    };

    if (req.files && req.files.length > 0) {
      updatedFields.documents = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

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

    if (job.status === 'Cancel') {
      return res.status(400).json({ message: '🚫 Cannot update progress. Job is canceled.' });
    }

    if (['Candidate Refusal', 'Not Hired'].includes(candidate.hireDecision)) {
      return res.status(400).json({ message: `🚫 Progress is locked due to decision: ${candidate.hireDecision}` });
    }

    const stageOrder = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const currentIndex = stageOrder.indexOf(candidate.progress);
    const newIndex = stageOrder.indexOf(newStage);

    if (newIndex === -1) {
      return res.status(400).json({ message: '❌ Invalid stage name' });
    }

    candidate.progressDates = {
      ...candidate.progressDates,
      [newStage]: new Date(progressDate)
    };

    if (newIndex > currentIndex) {
      candidate.progress = newStage;
    }

    // ✅ Offer logic
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

    // ✅ Onboard logic with hiring cost implication
    if (newStage === 'Onboard' && !candidate._onboardCounted) {
      job.onboardCount = (job.onboardCount || 0) + 1;

      // Reduce offer count if previously counted
      if (candidate._offerCounted) {
        job.offerCount = Math.max((job.offerCount || 1) - 1, 0);
      }

      candidate._onboardCounted = true;
      candidate.hireDecision = 'Hired';

      // Fill job if onboarded reaches target
      if (job.onboardCount >= job.targetCandidates) {
        job.status = 'Filled';
      }

      // ✅ (Optional) Log cost-per-hire for debugging
      console.log(`💰 ${candidate.fullName} counted for cost. HiringCost = $${job.hiringCost}, onboarded = ${job.onboardCount}`);
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
