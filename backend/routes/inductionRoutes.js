const express = require('express');
const router = express.Router();
const {
  getAllInductions,
  getInductionByCandidate,
  saveInduction
} = require('../controllers/inductionController');

// GET /api/induction
router.get('/', getAllInductions);

// GET /api/induction/:candidateId
router.get('/:candidateId', getInductionByCandidate);

// POST /api/induction/:candidateId
router.post('/:candidateId', saveInduction);

// PUT /api/induction/:candidateId
router.put('/:candidateId', saveInduction);

module.exports = router;
