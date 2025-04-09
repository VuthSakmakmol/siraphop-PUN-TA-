const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');
const Counter = require('../models/Counter');

// ✅ Create a new candidate
exports.createCandidate = async (req, res) => {
  const {
    name,
    email,
    phone,
    gender,
    applicationSource,
    jobRequisitionId,
    hireDecision,
    noted
  } = req.body;

  const documents = req.files?.map(file => file.path) || [];

  // ✅ Validation
  if (!jobRequisitionId || !mongoose.Types.ObjectId.isValid(jobRequisitionId)) {
    return res.status(400).json({ message: '❌ Invalid or missing Job Requisition ID.' });
  }

  try {
    const job = await JobRequisition.findById(jobRequisitionId);
    if (!job) {
      return res.status(404).json({ message: '❌ Job requisition not found.' });
    }

    if (job.status !== 'Vacant') {
      return res.status(400).json({ message: `⚠️ Cannot apply. Job requisition is currently ${job.status}.` });
    }

    // ✅ Generate unique incremental candidate ID using Counter model
    const counter = await Counter.findOneAndUpdate(
      { name: 'candidateId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const candidateId = counter.value;

    const newCandidate = new Candidate({
      candidateId,
      fullName: name,
      email,
      phone,
      gender,
      applicationSource,
      jobRequisitionId,
      hireDecision,
      noted,
      documents,
      progress: 'Application',
      progressDates: { Application: new Date() }
    });

    await newCandidate.save();
    return res.status(201).json({
      message: `✅ Candidate ${name} (ID: ${candidateId}) successfully created.`,
      candidate: newCandidate
    });

  } catch (err) {
    console.error('❌ Error creating candidate:', err);
    return res.status(500).json({ message: '❌ Server error while creating candidate', error: err.message });
  }
};

exports.getJobRequisitions = async (req, res) => {
  try {
    const jobRequisitions = await JobRequisition.find()
    console.log('👉 Job Requisitions:', jobRequisitions)
    res.json(jobRequisitions)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job requisitions' })
  }
}

// controllers/candidateController.js
exports.getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate({
        path: 'jobRequisitionId',
        populate: {
          path: 'departmentId',
          model: 'Department'
        }
      });

    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidates', error: err.message });
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
      hireDecision,
    };

    // Handle file upload (optional)
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


// ✅ Update candidate progress and filledCandidates in job requisition
exports.updateCandidateProgress = async (req, res) => {
  const { newStage, progressDates } = req.body;

  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const job = await JobRequisition.findById(candidate.jobRequisitionId);
    if (!job) return res.status(404).json({ message: '❌ Related job requisition not found' });

    // ❌ Prevent update to JobOffer if job is already filled or target reached
    if (newStage === 'JobOffer') {
      if (job.status === 'Filled' || (job.filledCandidates || 0) >= job.targetCandidates) {
        return res.status(400).json({
          message: '🚫 Cannot move to Job Offer. Job is already filled or candidate target reached.'
        });
      }

      // ✅ Safe to increase
      job.filledCandidates = (job.filledCandidates || 0) + 1;

      if (job.filledCandidates >= job.targetCandidates) {
        job.status = 'Filled';
      }

      await job.save();
    }

    // ✅ Proceed to update candidate
    candidate.progress = newStage;
    candidate.progressDates = { ...candidate.progressDates, ...progressDates };
    await candidate.save();

    res.status(200).json({ message: `✅ Progress updated to ${newStage}`, candidate });

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


// controllers/candidateController.js

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: '❌ Candidate not found' });
    }

    res.status(200).json({ message: '✅ Candidate deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ message: '❌ Failed to delete candidate', error: error.message });
  }
};


// ✅ Lock/unlock progress
exports.lockCandidateProgress = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: '❌ Candidate not found' });

    const job = await JobRequisition.findById(candidate.jobRequisitionId);
    if (job && job.filledCount >= job.targetCandidates) {
      candidate.locked = true;
      await candidate.save();
      return res.json({ message: '🔒 Candidate auto-locked (job filled)', candidate });
    }

    candidate.locked = !candidate.locked;
    await candidate.save();
    res.json({ message: `🔄 Candidate ${candidate.locked ? 'locked' : 'unlocked'}`, candidate });

  } catch (err) {
    res.status(500).json({ message: '❌ Lock toggle failed', error: err.message });
  }
};
