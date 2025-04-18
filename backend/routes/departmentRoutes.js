const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// ✅ Global Recruiter Routes
router.get('/global-recruiters', departmentController.getGlobalRecruiters);
router.post('/global-recruiter', departmentController.addGlobalRecruiter);
router.put('/global-recruiters/:id', departmentController.updateGlobalRecruiter);
router.delete('/global-recruiters/:id', departmentController.deleteGlobalRecruiter);

// ✅ Department CRUD Routes
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// ✅ Job Title Management
router.put('/:id/job-title', departmentController.addJobTitle);
router.put('/:id/remove-job-title', departmentController.removeJobTitle);

module.exports = router;
