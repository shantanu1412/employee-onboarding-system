const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllDocuments,
  updateDocumentStatus,
  deleteDocument,
  downloadDocumentFile
} = require('../controllers/documentController');

// GET /api/documents
router.get('/', getAllDocuments);

// GET /api/documents/:id/file
router.get('/:id/file', downloadDocumentFile);

// PUT /api/documents/:documentId
router.put('/:documentId', updateDocumentStatus);

// DELETE /api/documents/:documentId
router.delete('/:documentId', deleteDocument);

module.exports = router;
