const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/authMiddleware');
const {
  getAllVacantes,
  getVacanteById,
  createVacante,
  updateVacante,
  deleteVacante,
  recomendarVacantes,
  aplicarVacante    // ✅ HU-10
} = require('../controllers/vacante.controller');

// GET /api/vacantes/recomendadas  ← debe ir ANTES de /:id
router.get('/recomendadas', verificarToken, recomendarVacantes);

// ✅ HU-10: Aplicar a vacante con validación de porcentaje mínimo
router.post('/:id/aplicar', verificarToken, aplicarVacante);

router.get('/',     getAllVacantes);
router.get('/:id',  getVacanteById);
router.post('/',    createVacante);
router.put('/:id',  updateVacante);
router.delete('/:id', deleteVacante);

module.exports = router;