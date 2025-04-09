const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

router.put('/:id/job-title', departmentController.addJobTitle);  // ✅ Add job title
router.put('/:id/recruiter', departmentController.addRecruiter); // ✅ Add recruiter

router.put('/:id/remove-job-title', departmentController.removeJobTitle); // ✅ Remove title
router.put('/:id/remove-recruiter', departmentController.removeRecruiter); // ✅ Remove recruiter

module.exports = router;
