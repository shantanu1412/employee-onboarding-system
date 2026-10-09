const { pool, getDbStatus } = require('../config/db');

/**
 * Get comprehensive dashboard overview metrics
 * Endpoint: GET /api/dashboard/overview
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const status = getDbStatus();
    if (!status.connected) {
      return res.status(200).json({
        success: true,
        data: {
          totalCandidates: 0,
          selected: 0,
          documentVerification: 0,
          joiningPending: 0,
          inductionInProgress: 0,
          completed: 0,
          pendingDocuments: 0
        }
      });
    }

    // Candidate count by status
    const [candidateCounts] = await pool.query(
      `SELECT status, COUNT(*) as count FROM candidates GROUP BY status`
    );

    const counts = {
      selected: 0,
      document_verification: 0,
      joining_pending: 0,
      induction_in_progress: 0,
      completed: 0,
      rejected: 0
    };

    let totalCandidates = 0;
    candidateCounts.forEach(c => {
      counts[c.status] = Number(c.count);
      totalCandidates += Number(c.count);
    });

    // Pending documents count
    const [pendingDocs] = await pool.query(
      `SELECT COUNT(*) as count FROM documents WHERE verification_status = 'pending'`
    );
    const pendingDocumentsCount = Number(pendingDocs[0]?.count || 0);

    return res.status(200).json({
      success: true,
      data: {
        totalCandidates: totalCandidates,
        selected: counts.selected,
        documentVerification: counts.document_verification,
        joiningPending: counts.joining_pending,
        inductionInProgress: counts.induction_in_progress,
        completed: counts.completed,
        pendingDocuments: pendingDocumentsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview
};
