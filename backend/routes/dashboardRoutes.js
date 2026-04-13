const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/occupancy', dashboardController.getOccupancyDashboard);

module.exports = router;
