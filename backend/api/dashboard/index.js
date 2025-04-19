const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboardController');

// ✅ General dashboard summary (used in /dashboard frontend)
router.post('/stats', dashboardController.getDashboardStats);

// ✅ Additional chart endpoints (optional for detailed charts)
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/monthly', dashboardController.getMonthlyApplications);
router.get('/sources', dashboardController.getApplicationSources);
router.get('/pipeline', dashboardController.getRecruitmentPipeline);
router.get('/decisions', dashboardController.getFinalDecisions);
router.get('/kpis', dashboardController.getVacancyKPIs);

module.exports = router;
