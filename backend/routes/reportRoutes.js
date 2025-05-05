const express = require('express')
const router = express.Router()
const reportController = require('../controllers/reportController')

// ✅ Use the function, not the whole object

router.post('/', reportController.getReport);

router.get('/', reportController.getReport)

module.exports = router
