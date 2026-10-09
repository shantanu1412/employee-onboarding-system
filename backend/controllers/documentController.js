const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

const ALLOWED_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Degree Certificate',
  'Resume',
  'Experience Letter',
  'Address Proof',
  'Other'
];

/**
 * Get all documents across candidates (with optional status filter)
 * Endpoint: GET /api/documents
 */
const getAllDocuments = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        d.id, d.candidate_id, d.document_type, d.document_name, d.file_url, 
        d.verification_status, d.remarks, d.uploaded_at, d.verified_at,
        c.first_name, c.last_name, c.email as candidate_email, c.department, c.position
      FROM documents d
      JOIN candidates c ON d.candidate_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND d.verification_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY d.uploaded_at DESC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents for a specific candidate
 * Endpoint: GET /api/candidates/:candidateId/documents
 */
const getCandidateDocuments = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    // Verify candidate
    const [cand] = await pool.query(`SELECT id, first_name, last_name FROM candidates WHERE id = ?`, [candidateId]);
    if (!cand.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const [docs] = await pool.query(
      `SELECT id, candidate_id, document_type, document_name, file_url, verification_status, remarks, uploaded_at, verified_at
       FROM documents 
       WHERE candidate_id = ? 
       ORDER BY uploaded_at DESC`,
      [candidateId]
    );

    return res.status(200).json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a document for a candidate
 * Endpoint: POST /api/candidates/:candidateId/documents
 */
const uploadDocument = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { document_type, remarks } = req.body;

    // Verify candidate exists
    const [cand] = await pool.query(`SELECT id, status FROM candidates WHERE id = ?`, [candidateId]);
    if (!cand.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    if (!document_type || !document_type.trim()) {
      return res.status(400).json({ success: false, message: 'Document type is required' });
    }

    let documentName = req.body.document_name;
    let fileUrl = null;

    if (req.file) {
      documentName = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!documentName || !documentName.trim()) {
      return res.status(400).json({ success: false, message: 'A document file or document name is required' });
    }

    // Insert document
    const [result] = await pool.query(
      `INSERT INTO documents 
       (candidate_id, document_type, document_name, file_url, verification_status, remarks) 
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [
        candidateId,
        document_type.trim(),
        documentName.trim(),
        fileUrl,
        remarks ? remarks.trim() : null
      ]
    );

    // If candidate status is 'selected', advance to 'document_verification'
    if (cand[0].status === 'selected') {
      await pool.query(`UPDATE candidates SET status = 'document_verification' WHERE id = ?`, [candidateId]);
    }

    const [newDoc] = await pool.query(`SELECT * FROM documents WHERE id = ?`, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and marked for HR review',
      data: newDoc[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document verification status & remarks
 * Endpoint: PUT /api/documents/:documentId
 */
const updateDocumentStatus = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { verification_status, remarks } = req.body;

    if (!verification_status || !['pending', 'verified', 'rejected'].includes(verification_status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid verification status. Must be 'pending', 'verified', or 'rejected'" 
      });
    }

    // Requirement: Require HR remarks when rejecting
    if (verification_status === 'rejected' && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: 'HR remarks are required when rejecting a document to advise the candidate on issues.'
      });
    }

    const [existing] = await pool.query(`SELECT * FROM documents WHERE id = ?`, [documentId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const verifiedAt = verification_status === 'verified' ? new Date() : null;

    await pool.query(
      `UPDATE documents 
       SET verification_status = ?, remarks = ?, verified_at = ? 
       WHERE id = ?`,
      [
        verification_status,
        remarks ? remarks.trim() : existing[0].remarks,
        verifiedAt,
        documentId
      ]
    );

    const [updated] = await pool.query(`SELECT * FROM documents WHERE id = ?`, [documentId]);

    return res.status(200).json({
      success: true,
      message: `Document status updated to ${verification_status}`,
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 * Endpoint: DELETE /api/documents/:documentId
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const [existing] = await pool.query(`SELECT * FROM documents WHERE id = ?`, [documentId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = existing[0];

    // Safely delete underlying physical file if exists
    if (doc.file_url) {
      const filename = path.basename(doc.file_url);
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
      }
    }

    await pool.query(`DELETE FROM documents WHERE id = ?`, [documentId]);

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Safe download/view endpoint
 * Endpoint: GET /api/documents/:id/file
 */
const downloadDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [docs] = await pool.query(`SELECT * FROM documents WHERE id = ?`, [id]);

    if (!docs.length) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];

    if (!doc.file_url) {
      // If no file uploaded, return text info or metadata
      return res.status(200).json({
        success: true,
        message: 'No physical file was uploaded for this record (electronic verification placeholder)',
        data: doc
      });
    }

    const filename = path.basename(doc.file_url);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `File ${doc.document_name} is not present on disk`
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDocuments,
  getCandidateDocuments,
  uploadDocument,
  updateDocumentStatus,
  deleteDocument,
  downloadDocumentFile,
  ALLOWED_TYPES
};
