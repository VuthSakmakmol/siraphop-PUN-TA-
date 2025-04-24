const express = require('express');
const router = express.Router();
const {
  createJobRequisition,
  getJobRequisitions,
  getJobRequisitionById,
  updateJobRequisition,
  deleteJobRequisition,
  getJobTitlesAndRecruiters,
  getOfferStageCandidate
} = require('../controllers/jobRequisitionController');

// 🔹 Get job titles & recruiters for a department
router.get('/department/:departmentId', getJobTitlesAndRecruiters);

// 🔹 Create a new job requisition
router.post('/', createJobRequisition);

// 🔹 Get all job requisitions
router.get('/', getJobRequisitions);

// 🔹 Get one by ID
router.get('/:id', getJobRequisitionById);

// 🔹 Update job requisition
router.put('/:id', updateJobRequisition);

// 🔹 Delete job requisition
router.delete('/:id', deleteJobRequisition);

// 🔹 Get the one candidate in JobOffer stage for this requisition
router.get('/requisition/:id/offer-candidate', getOfferStageCandidate);

module.exports = router;
