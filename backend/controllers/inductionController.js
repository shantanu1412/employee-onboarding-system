const { pool } = require('../config/db');

/**
 * Get all induction sessions across candidates
 * Endpoint: GET /api/induction
 */
const getAllInductions = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        i.id, i.candidate_id, i.session_title, i.instructor_name, i.scheduled_date,
        i.completion_status, i.it_assets_assigned, i.policy_acceptance, i.notes,
        i.completed_at, i.created_at, i.updated_at,
        c.first_name, c.last_name, c.email, c.department, c.position, c.status as candidate_status
      FROM induction i
      JOIN candidates c ON i.candidate_id = c.id
      ORDER BY i.scheduled_date ASC
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
 * Get induction session for a candidate
 * Endpoint: GET /api/candidates/:candidateId/induction
 */
const getInductionByCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM induction WHERE candidate_id = ?`,
      [candidateId]
    );

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No induction record scheduled yet for this candidate'
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
 * Schedule or update induction for a candidate
 * Endpoint: POST & PUT /api/candidates/:candidateId/induction
 */
const saveInduction = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const {
      session_title = 'Corporate Orientation & HR Briefing',
      instructor_name,
      scheduled_date,
      completion_status = 'scheduled',
      it_assets_assigned = false,
      policy_acceptance = false,
      notes
    } = req.body;

    // Verify candidate existence
    const [cands] = await pool.query(`SELECT id, status FROM candidates WHERE id = ?`, [candidateId]);
    if (!cands.length) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const [existing] = await pool.query(`SELECT id FROM induction WHERE candidate_id = ?`, [candidateId]);

    const completedAt = completion_status === 'completed' ? new Date() : null;

    if (existing.length > 0) {
      await pool.query(
        `UPDATE induction 
         SET session_title = ?, instructor_name = ?, scheduled_date = ?, completion_status = ?, 
             it_assets_assigned = ?, policy_acceptance = ?, notes = ?, completed_at = ? 
         WHERE candidate_id = ?`,
        [
          session_title,
          instructor_name || null,
          scheduled_date || null,
          completion_status,
          Boolean(it_assets_assigned),
          Boolean(policy_acceptance),
          notes || null,
          completedAt,
          candidateId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO induction 
         (candidate_id, session_title, instructor_name, scheduled_date, completion_status, it_assets_assigned, policy_acceptance, notes, completed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          session_title,
          instructor_name || null,
          scheduled_date || null,
          completion_status,
          Boolean(it_assets_assigned),
          Boolean(policy_acceptance),
          notes || null,
          completedAt
        ]
      );
    }

    // Lifecycle transition:
    // If induction is marked completed, candidate status becomes 'completed'!
    // Else if scheduled/in_progress, ensure candidate is at least 'induction_in_progress'
    if (completion_status === 'completed') {
      await pool.query(`UPDATE candidates SET status = 'completed' WHERE id = ?`, [candidateId]);
    } else if (cands[0].status === 'joining_pending' || cands[0].status === 'selected' || cands[0].status === 'document_verification') {
      // Auto move candidate status to induction_in_progress
      await pool.query(`UPDATE candidates SET status = 'induction_in_progress' WHERE id = ?`, [candidateId]);
    }

    const [updated] = await pool.query(`SELECT * FROM induction WHERE candidate_id = ?`, [candidateId]);

    return res.status(200).json({
      success: true,
      message: completion_status === 'completed' 
        ? 'Induction completed! Candidate onboarding is now fully Completed 🎉' 
        : 'Induction schedule updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInductions,
  getInductionByCandidate,
  saveInduction
};
