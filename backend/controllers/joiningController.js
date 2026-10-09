const { pool } = require('../config/db');

/**
 * Get all joining records across candidates
 * Endpoint: GET /api/joining
 */
const getAllJoiningDetails = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        j.id, j.candidate_id, j.employee_code, j.official_email, j.work_location,
        j.employment_type, j.reporting_manager, j.salary_ctc, j.joining_status,
        j.actual_joining_date, j.created_at, j.updated_at,
        c.first_name, c.last_name, c.email as personal_email, c.department, c.position, c.status as candidate_status, c.joining_date
      FROM joining_details j
      JOIN candidates c ON j.candidate_id = c.id
      ORDER BY j.created_at DESC
    `;
    const [rows] = await pool.query(query);

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
 * Get joining details for a specific candidate
 * Endpoint: GET /api/candidates/:candidateId/joining
 */
const getJoiningByCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM joining_details WHERE candidate_id = ?`,
      [candidateId]
    );

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No joining record exists yet for this candidate'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or initialize joining details for a candidate
 * Endpoint: POST /api/candidates/:candidateId/joining
 */
const saveJoiningDetails = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const {
      employee_code,
      official_email,
      work_location = 'Headquarters',
      employment_type = 'full_time',
      reporting_manager,
      salary_ctc,
      joining_status = 'pending',
      actual_joining_date
    } = req.body;

    // Check candidate existence
    const [cands] = await pool.query(`SELECT id, status, department, position, joining_date FROM candidates WHERE id = ?`, [candidateId]);
    if (!cands.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Verify documents rule: If trying to mark as joined, check verification
    if (joining_status === 'joined') {
      const [docs] = await pool.query(`SELECT verification_status FROM documents WHERE candidate_id = ?`, [candidateId]);
      const hasUnverified = docs.some(d => d.verification_status !== 'verified');
      if (docs.length === 0 || hasUnverified) {
        return res.status(400).json({
          success: false,
          message: 'Candidate cannot be marked as joined until required documents are verified.'
        });
      }
    }

    // Check if joining details record already exists for candidate
    const [existing] = await pool.query(`SELECT id FROM joining_details WHERE candidate_id = ?`, [candidateId]);

    let finalJoiningStatus = joining_status;
    if (finalJoiningStatus === 'joining_pending') finalJoiningStatus = 'pending';

    if (existing.length > 0) {
      // Update existing record
      await pool.query(
        `UPDATE joining_details 
         SET employee_code = ?, official_email = ?, work_location = ?, employment_type = ?, 
             reporting_manager = ?, salary_ctc = ?, joining_status = ?, actual_joining_date = ? 
         WHERE candidate_id = ?`,
        [
          employee_code || null,
          official_email || null,
          work_location,
          employment_type,
          reporting_manager || null,
          salary_ctc || null,
          finalJoiningStatus,
          actual_joining_date || null,
          candidateId
        ]
      );
    } else {
      // Insert new joining details record
      await pool.query(
        `INSERT INTO joining_details 
         (candidate_id, employee_code, official_email, work_location, employment_type, reporting_manager, salary_ctc, joining_status, actual_joining_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          employee_code || null,
          official_email || null,
          work_location,
          employment_type,
          reporting_manager || null,
          salary_ctc || null,
          finalJoiningStatus,
          actual_joining_date || null
        ]
      );
    }

    // Lifecycle auto-progression:
    // If joining_status is 'joined', advance candidate to 'induction_in_progress'
    // Else if joining record is created/saved and candidate was in 'document_verification', advance to 'joining_pending'
    if (finalJoiningStatus === 'joined') {
      await pool.query(`UPDATE candidates SET status = 'induction_in_progress' WHERE id = ?`, [candidateId]);
    } else if (cands[0].status === 'document_verification' || cands[0].status === 'selected') {
      await pool.query(`UPDATE candidates SET status = 'joining_pending' WHERE id = ?`, [candidateId]);
    }

    const [updated] = await pool.query(`SELECT * FROM joining_details WHERE candidate_id = ?`, [candidateId]);

    return res.status(200).json({
      success: true,
      message: finalJoiningStatus === 'joined' ? 'Candidate confirmed joined and moved to Induction' : 'Joining details saved successfully',
      data: updated[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee code or official email is already assigned to another employee.'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllJoiningDetails,
  getJoiningByCandidate,
  saveJoiningDetails
};
