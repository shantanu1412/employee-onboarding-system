/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : {
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack
    }
  });
};

module.exports = errorHandler;
