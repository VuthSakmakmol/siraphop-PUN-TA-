const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById, // ✅ Add this line
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addJobTitle,
  addRecruiter,
  removeRecruiter,
  removeJobTitle
} = require('../controllers/departmentController')

router.get('/', getDepartments);
router.get('/:id', getDepartmentById)
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.put('/:id/job-title', addJobTitle);
router.put('/:id/recruiter', addRecruiter);
router.put('/:id/remove-job-title', removeJobTitle);
router.put('/:id/remove-recruiter', removeRecruiter);


module.exports = router;
