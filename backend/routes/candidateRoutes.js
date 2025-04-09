// routes/candidateRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const candidateController = require('../controllers/candidateController');

// ✅ Multer setup
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
router.get('/', candidateController.getCandidates);
router.get('/:id', candidateController.getCandidateById);
router.post('/', upload.array('documents'), candidateController.createCandidate);
router.put('/:id/progress', candidateController.updateCandidateProgress);
router.put('/:id', upload.array('documents'), candidateController.updateCandidate); // ✅ Fixed
router.put('/:id/lock', candidateController.lockCandidateProgress);
router.delete('/:id', candidateController.deleteCandidate);
router.post('/:id/documents', upload.array('documents'), candidateController.uploadMoreDocuments);

// ✅ Export routes
module.exports = router;
