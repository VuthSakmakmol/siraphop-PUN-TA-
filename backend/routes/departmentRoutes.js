const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// ✅ Recruiter routes — placed FIRST
router.get('/global-recruiters', departmentController.getGlobalRecruiters);
router.post('/global-recruiter', departmentController.addGlobalRecruiter);

// ✅ Main department CRUD
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// ✅ Job titles and recruiter operations
router.get('/global-recruiters', departmentController.getGlobalRecruiters);
router.post('/global-recruiter', departmentController.addGlobalRecruiter);
router.put('/global-recruiters/:id', departmentController.updateGlobalRecruiter);
router.delete('/global-recruiters/:id', departmentController.deleteGlobalRecruiter);


module.exports = router;

