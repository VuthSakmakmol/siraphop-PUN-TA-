const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidateProgress,
  deleteCandidate,
  uploadMoreDocuments,
  updateCandidate,
  lockCandidateProgress
} = require('../controllers/candidateController');

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/candidates/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// ✅ Routes
router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/', upload.array('documents'), createCandidate);
router.put('/:id/progress', updateCandidateProgress);
router.put('/:id', updateCandidate);
router.put('/:id/lock', lockCandidateProgress);
router.delete('/:id', deleteCandidate);
router.post('/:id/documents', upload.array('documents'), uploadMoreDocuments);

// ✅ Export routes
module.exports = router;
