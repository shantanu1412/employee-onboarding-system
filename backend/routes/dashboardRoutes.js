const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/dashboardController');

// GET /api/dashboard/overview
router.get('/overview', getDashboardOverview);

module.exports = router;
