require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { testConnection } = require('./config/database');
const routes = require('./routes');

// 1. INICIALIZAR APP (Esto debe ir antes de cualquier app.use)
const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// Middleware
// =============================================

// Security headers (CORREGIDO PARA FIREBASE POPUPS)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// Routes
// =============================================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MVP Backend API - Sistema de Matching de Empleo',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// =============================================
// Error Handling
// =============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor'
  });
});

// =============================================
// Server Startup
// =============================================

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`
========================================
  MVP Backend API
========================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}
  CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;