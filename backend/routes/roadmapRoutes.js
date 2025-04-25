const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController'); // ✅ Make sure this file exists and exports functions

router.get('/', roadmapController.getRoadmaps);
router.post('/', roadmapController.createRoadmap);
router.put('/:id', roadmapController.updateRoadmap);
router.delete('/:id', roadmapController.deleteRoadmap);

module.exports = router;
