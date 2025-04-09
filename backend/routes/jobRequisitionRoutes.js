const express = require('express');
const router = express.Router();
const {
  createJobRequisition,
  getJobRequisitions,
  getJobRequisitionById,
  updateJobRequisition,
  deleteJobRequisition,
  getJobTitlesAndRecruiters,
} = require('../controllers/jobRequisitionController');

// Define routes with correct controller methods
router.get('/', getJobRequisitions);  // Get all job requisitions
router.get('/:id', getJobRequisitionById);  // Get job requisition by ID
router.get('/department/:departmentId', getJobTitlesAndRecruiters);  // Get job titles and recruiters by department ID
router.post('/', createJobRequisition);  // Create a new job requisition
router.put('/:id', updateJobRequisition);  // Update an existing job requisition by ID
router.delete('/:id', deleteJobRequisition);  // Delete a job requisition by ID


module.exports = router;
