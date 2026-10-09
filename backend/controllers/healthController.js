const { getDbStatus, testConnection } = require('../config/db');

/**
 * Health check controller
 * Endpoint: GET /api/health
 */
const getHealth = async (req, res) => {
  // Re-check or retrieve current database status
  const dbStatus = getDbStatus();

  return res.status(200).json({
    success: true,
    message: "Employee Onboarding API is running",
    service: "Employee Onboarding Management System",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      message: dbStatus.message,
      error: dbStatus.error
    }
  });
};

/**
 * Explicit DB health ping
 * Endpoint: GET /api/health/db
 */
const getDatabaseHealth = async (req, res) => {
  const result = await testConnection();
  if (result.connected) {
    return res.status(200).json({
      success: true,
      message: "Database connection is healthy",
      data: result
    });
  } else {
    return res.status(503).json({
      success: false,
      message: "Database connection failed",
      data: result
    });
  }
};

module.exports = {
  getHealth,
  getDatabaseHealth
};
