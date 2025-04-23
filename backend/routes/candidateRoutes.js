const express = require('express');
const router = express.Router();
const multer = require('multer');
const candidateController = require('../controllers/candidateController');

// ✅ Multer storage config for document upload
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

// ✅ ROUTES

// Get all candidates
router.get('/', candidateController.getCandidates);

// Get a candidate by ID
router.get('/:id', candidateController.getCandidateById);

// Create candidate with document upload
router.post('/', upload.array('documents'), candidateController.createCandidate);

// Update candidate (general info + documents)
router.put('/:id', upload.array('documents'), candidateController.updateCandidate);

// Update candidate stage progress
router.put('/:id/progress', candidateController.updateCandidateProgress);

// Lock/unlock candidate (e.g., filled job)
router.put('/:id/lock', candidateController.lockCandidateProgress);

// Upload additional documents to an existing candidate
router.post('/:id/documents', upload.array('documents'), candidateController.uploadMoreDocuments);

// Delete a candidate
router.delete('/:id', candidateController.deleteCandidate);

// Check if any candidate has active offer for a requisition
router.get('/requisition/:requisitionId/active-offers', candidateController.getActiveOffersByRequisitionId);

// Check if offer/hire already exists for a requisition (boolean)
router.get('/requisition/:requisitionId/offer-check', candidateController.checkActiveOffers);

// ✅ Export router
module.exports = router;
