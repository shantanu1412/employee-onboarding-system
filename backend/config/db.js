const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool with environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_onboarding',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper function to test DB connectivity safely
let dbStatus = {
  connected: false,
  message: 'Database connection has not been initialized yet',
  error: null
};

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    dbStatus = {
      connected: true,
      message: 'Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'employee_onboarding'),
      error: null
    };
    console.log(`[Database] MySQL Connection established successfully on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    connection.release();
    return dbStatus;
  } catch (error) {
    dbStatus = {
      connected: false,
      message: 'Failed to connect to MySQL database',
      error: error.message
    };
    console.warn(`[Database Warning] MySQL connection failed (${error.code || error.message}). Ensure MySQL is running and database exists.`);
    return dbStatus;
  }
}

function getDbStatus() {
  return dbStatus;
}

module.exports = {
  pool,
  testConnection,
  getDbStatus
};
