const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

const { testConnection } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const documentRoutes = require('./routes/documentRoutes');
const joiningRoutes = require('./routes/joiningRoutes');
const inductionRoutes = require('./routes/inductionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local dev environment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base Route
app.get('/', (req, res) => {
  res.json({
    name: 'Employee Onboarding Management System API',
    version: '1.0.0',
    status: 'active',
    documentation: {
      health: '/api/health',
      dbHealth: '/api/health/db',
      dashboard: '/api/dashboard/overview',
      candidates: '/api/candidates',
      documents: '/api/documents',
      joining: '/api/joining',
      induction: '/api/induction'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/joining', joiningRoutes);
app.use('/api/joining-details', joiningRoutes); // Alias for convenience
app.use('/api/induction', inductionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server and Test Database Connection
const server = app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(` Employee Onboarding API Server`);
  console.log(` Status: Running on port ${PORT}`);
  console.log(` Health URL: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);

  // Test database connection at startup
  await testConnection();
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nGracefully terminating...');
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
});

module.exports = app;
