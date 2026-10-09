const express = require('express');
const router = express.Router();
const {
  getAllJoiningDetails,
  getJoiningByCandidate,
  saveJoiningDetails
} = require('../controllers/joiningController');

// GET /api/joining
router.get('/', getAllJoiningDetails);

// GET /api/joining/:candidateId
router.get('/:candidateId', getJoiningByCandidate);

// POST /api/joining/:candidateId
router.post('/:candidateId', saveJoiningDetails);

// PUT /api/joining/:candidateId
router.put('/:candidateId', saveJoiningDetails);

module.exports = router;
