const { pool, getDbStatus } = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = [
  'selected', 
  'document_verification', 
  'joining_pending', 
  'induction_in_progress', 
  'completed', 
  'rejected'
];

/**
 * Get all candidates (with optional search and filters)
 * Endpoint: GET /api/candidates
 */
const getCandidates = async (req, res, next) => {
  try {
    const status = getDbStatus();
    if (!status.connected) {
      return res.status(200).json({
        success: true,
        message: "Database not connected yet; schema pending import",
        data: [],
        count: 0
      });
    }

    const { status: statusFilter, department, search } = req.query;
    let query = `
      SELECT id, first_name, last_name, email, phone, position, department, status, joining_date, created_at, updated_at 
      FROM candidates 
      WHERE 1=1
    `;
    const params = [];

    if (statusFilter && statusFilter !== 'all') {
      query += ` AND status = ?`;
      params.push(statusFilter);
    }

    if (department && department !== 'all') {
      query += ` AND department = ?`;
      params.push(department);
    }

    if (search && search.trim()) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR position LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

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
 * Get candidate summary counts by onboarding stage
 * Endpoint: GET /api/candidates/overview
 */
const getOnboardingOverview = async (req, res, next) => {
  try {
    const status = getDbStatus();
    if (!status.connected) {
      return res.status(200).json({
        success: true,
        overview: {
          total: 0,
          selected: 0,
          document_verification: 0,
          joining_pending: 0,
          induction_in_progress: 0,
          completed: 0
        }
      });
    }

    const [rows] = await pool.query(
      `SELECT status, COUNT(*) as count FROM candidates GROUP BY status`
    );

    const summary = {
      selected: 0,
      document_verification: 0,
      joining_pending: 0,
      induction_in_progress: 0,
      completed: 0,
      rejected: 0
    };

    rows.forEach(curr => {
      summary[curr.status] = Number(curr.count);
    });

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single candidate by ID with associated documents, joining details, and induction
 * Endpoint: GET /api/candidates/:id
 */
const getCandidateById = async (req, res, next) => {
  try {
    const status = getDbStatus();
    if (!status.connected) {
      return res.status(503).json({
        success: false,
        message: "Database not connected"
      });
    }

    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, position, department, status, joining_date, created_at, updated_at 
       FROM candidates 
       WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const candidate = rows[0];

    // Associated Documents
    let documents = [];
    try {
      const [docs] = await pool.query(
        `SELECT id, candidate_id, document_type, document_name, file_url, verification_status, remarks, uploaded_at, verified_at 
         FROM documents 
         WHERE candidate_id = ? 
         ORDER BY uploaded_at DESC`,
        [id]
      );
      documents = docs;
    } catch (_) {}

    // Associated Joining Details
    let joiningDetails = null;
    try {
      const [joins] = await pool.query(
        `SELECT id, candidate_id, employee_code, official_email, work_location, employment_type, reporting_manager, salary_ctc, joining_status, actual_joining_date, created_at, updated_at 
         FROM joining_details 
         WHERE candidate_id = ?`,
        [id]
      );
      if (joins.length > 0) {
        joiningDetails = joins[0];
      }
    } catch (_) {}

    // Associated Induction
    let inductionDetails = null;
    try {
      const [inds] = await pool.query(
        `SELECT id, candidate_id, session_title, instructor_name, scheduled_date, completion_status, it_assets_assigned, policy_acceptance, notes, completed_at, created_at, updated_at 
         FROM induction 
         WHERE candidate_id = ?`,
        [id]
      );
      if (inds.length > 0) {
        inductionDetails = inds[0];
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      data: {
        ...candidate,
        documents,
        joining_details: joiningDetails,
        induction: inductionDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new candidate
 * Endpoint: POST /api/candidates
 */
const createCandidate = async (req, res, next) => {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      position, 
      department, 
      joining_date,
      status = 'selected' 
    } = req.body;

    // Field Validations
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required' });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!position || !position.trim()) {
      return res.status(400).json({ success: false, message: 'Position is required' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }
    if (!joining_date) {
      return res.status(400).json({ success: false, message: 'Joining date is required' });
    }

    const candidateStatus = VALID_STATUSES.includes(status) ? status : 'selected';

    // Duplicate email check
    const [existing] = await pool.query(`SELECT id FROM candidates WHERE email = ?`, [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: `A candidate with email ${email.trim()} already exists in the system.` 
      });
    }

    // Insert Candidate
    const [result] = await pool.query(
      `INSERT INTO candidates 
       (first_name, last_name, email, phone, position, department, status, joining_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        position.trim(),
        department.trim(),
        candidateStatus,
        joining_date
      ]
    );

    const [createdRows] = await pool.query(`SELECT * FROM candidates WHERE id = ?`, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing candidate
 * Endpoint: PUT /api/candidates/:id
 */
const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      position, 
      department, 
      joining_date, 
      status 
    } = req.body;

    // Check candidate existence
    const [existing] = await pool.query(`SELECT * FROM candidates WHERE id = ?`, [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    const current = existing[0];

    // Validations
    if (first_name && !first_name.trim()) {
      return res.status(400).json({ success: false, message: 'First name cannot be empty' });
    }
    if (last_name && !last_name.trim()) {
      return res.status(400).json({ success: false, message: 'Last name cannot be empty' });
    }
    if (email) {
      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'A valid email is required' });
      }
      // Check duplicate on other candidates
      const [emailConflict] = await pool.query(
        `SELECT id FROM candidates WHERE email = ? AND id != ?`, 
        [email.trim().toLowerCase(), id]
      );
      if (emailConflict.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Another candidate with this email address already exists.' 
        });
      }
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    // Controlled status transitions rules
    if (status && status !== current.status) {
      // If moving to joining_pending, check if documents are uploaded and verified
      if (status === 'joining_pending') {
        const [docs] = await pool.query(
          `SELECT verification_status FROM documents WHERE candidate_id = ?`,
          [id]
        );
        const hasUnverified = docs.some(d => d.verification_status !== 'verified');
        if (docs.length === 0 || hasUnverified) {
          return res.status(400).json({
            success: false,
            message: 'Candidate cannot be moved to Joining Pending until required documents are submitted and verified.'
          });
        }
      }

      // If moving to induction_in_progress, check if joining status is joined
      if (status === 'induction_in_progress') {
        const [joins] = await pool.query(
          `SELECT joining_status FROM joining_details WHERE candidate_id = ?`,
          [id]
        );
        if (!joins.length || joins[0].joining_status !== 'joined') {
          return res.status(400).json({
            success: false,
            message: 'Candidate cannot start induction until joining is confirmed as joined.'
          });
        }
      }

      // If moving to completed, check induction completion
      if (status === 'completed') {
        const [inds] = await pool.query(
          `SELECT completion_status FROM induction WHERE candidate_id = ?`,
          [id]
        );
        if (!inds.length || inds[0].completion_status !== 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Candidate onboarding cannot be marked completed until induction is completed.'
          });
        }
      }
    }

    const updatedFirstName = first_name !== undefined ? first_name.trim() : current.first_name;
    const updatedLastName = last_name !== undefined ? last_name.trim() : current.last_name;
    const updatedEmail = email !== undefined ? email.trim().toLowerCase() : current.email;
    const updatedPhone = phone !== undefined ? phone.trim() : current.phone;
    const updatedPosition = position !== undefined ? position.trim() : current.position;
    const updatedDepartment = department !== undefined ? department.trim() : current.department;
    const updatedJoiningDate = joining_date !== undefined ? joining_date : current.joining_date;
    const updatedStatus = status !== undefined ? status : current.status;

    await pool.query(
      `UPDATE candidates 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, position = ?, department = ?, status = ?, joining_date = ? 
       WHERE id = ?`,
      [
        updatedFirstName,
        updatedLastName,
        updatedEmail,
        updatedPhone,
        updatedPosition,
        updatedDepartment,
        updatedStatus,
        updatedJoiningDate,
        id
      ]
    );

    const [updatedRows] = await pool.query(`SELECT * FROM candidates WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a candidate safely
 * Endpoint: DELETE /api/candidates/:id
 */
const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT id, first_name, last_name FROM candidates WHERE id = ?`, [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Explicitly delete children in case of strict foreign key configurations
    await pool.query(`DELETE FROM induction WHERE candidate_id = ?`, [id]);
    await pool.query(`DELETE FROM joining_details WHERE candidate_id = ?`, [id]);
    await pool.query(`DELETE FROM documents WHERE candidate_id = ?`, [id]);
    await pool.query(`DELETE FROM candidates WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: `Candidate ${existing[0].first_name} ${existing[0].last_name} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  getOnboardingOverview,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
};
