const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { 
  getCandidates, 
  getOnboardingOverview,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');

const {
  getCandidateDocuments,
  uploadDocument
} = require('../controllers/documentController');

const {
  getJoiningByCandidate,
  saveJoiningDetails
} = require('../controllers/joiningController');

const {
  getInductionByCandidate,
  saveInduction
} = require('../controllers/inductionController');

// Candidates Base
router.get('/', getCandidates);
router.get('/overview', getOnboardingOverview);
router.get('/:id', getCandidateById);
router.post('/', createCandidate);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

// Candidate Document Subroutes
router.get('/:candidateId/documents', getCandidateDocuments);
router.post('/:candidateId/documents', upload.single('file'), uploadDocument);

// Candidate Joining Subroutes
router.get('/:candidateId/joining', getJoiningByCandidate);
router.post('/:candidateId/joining', saveJoiningDetails);
router.put('/:candidateId/joining', saveJoiningDetails);

// Candidate Induction Subroutes
router.get('/:candidateId/induction', getInductionByCandidate);
router.post('/:candidateId/induction', saveInduction);
router.put('/:candidateId/induction', saveInduction);

module.exports = router;
