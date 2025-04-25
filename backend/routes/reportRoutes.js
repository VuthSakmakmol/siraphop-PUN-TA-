const express = require('express')
const router = express.Router()
const reportController = require('../controllers/reportController')

// ✅ Use the function, not the whole object
router.get('/', reportController.getReport)

module.exports = router
