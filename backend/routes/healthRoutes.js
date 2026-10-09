const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseHealth } = require('../controllers/healthController');

// GET /api/health
router.get('/', getHealth);

// GET /api/health/db
router.get('/db', getDatabaseHealth);

module.exports = router;
