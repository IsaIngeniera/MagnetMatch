const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes'); 

const aspiranteRoutes = require('./aspirante.routes');
const vacanteRoutes = require('./vacante.routes');
const habilidadRoutes = require('./habilidad.routes');

// Mount routes
// Esto crea el prefijo /auth
router.use('/auth', authRoutes); 
router.use('/aspirantes', aspiranteRoutes);
router.use('/vacantes', vacanteRoutes);
router.use('/habilidades', habilidadRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;