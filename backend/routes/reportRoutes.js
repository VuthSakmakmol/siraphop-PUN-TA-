const express = require('express')
const router = express.Router()
const { getMonthlyPerformance } = require('../controllers/reportController')

// ✅ Correct
router.get('/monthly-performance', getMonthlyPerformance)

module.exports = router
