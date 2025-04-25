const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Add all necessary dashboard routes
router.post('/stats', dashboardController.getDashboardStats);
router.get('/kpis', dashboardController.getVacancyKPIs);
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/pipeline', dashboardController.getRecruitmentPipeline);
router.get('/sources', dashboardController.getApplicationSources);
router.get('/monthly', dashboardController.getMonthlyApplications);
router.get('/decisions', dashboardController.getFinalDecisions);

module.exports = router;
