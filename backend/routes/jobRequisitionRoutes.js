const express = require('express')
const router = express.Router()
const {
  createJobRequisition,
  getJobRequisitions,
  getJobRequisitionById,
  updateJobRequisition,
  deleteJobRequisition,
  getJobTitlesAndRecruiters
} = require('../controllers/jobRequisitionController')

router.get('/', getJobRequisitions)
router.get('/:id', getJobRequisitionById)
router.get('/department/:departmentId', getJobTitlesAndRecruiters)
router.post('/', createJobRequisition)
router.put('/:id', updateJobRequisition)
router.delete('/:id', deleteJobRequisition)

module.exports = router
