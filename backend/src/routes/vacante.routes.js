const express = require('express');
const router = express.Router();

const vacanteController = require('../controllers/vacante.controller');

const {verificarToken} = require('../middleware/authMiddleware');
/**
 * GET /api/vacantes
 * HU-09: Lista todas las vacantes activas
 * 
 * Query params:
 * - modalidad: Filter by work modality (remoto, híbrido, presencial)
 * - salario_min: Minimum salary filter
 * - salario_max: Maximum salary filter
 * - search: Search in title and description
 * - empresa: Filter by company ID
 * - page: Page number for pagination (default 1)
 * - limit: Results per page (default 10)
 */
router.get('/', vacanteController.getAllVacantes);

/**
 * GET /api/vacantes/:id
 * HU-10: Ver detalle de una vacante específica
 */
router.get('/:id', vacanteController.getVacanteById);


// Esta ruta llamará a la función de recomendación que usa el algoritmo
router.get('/recomendadas', verificarToken, vacanteController.recomendarVacantes);


/**
 * POST /api/vacantes
 * Create a new job posting
 */
router.post('/', verificarToken, vacanteController.createVacante);

/**
 * PUT /api/vacantes/:id
 * Update a job posting
 */
router.put('/:id', verificarToken, vacanteController.updateVacante);

/**
 * DELETE /api/vacantes/:id
 * Delete (deactivate) a job posting
 */
router.delete('/:id', verificarToken, vacanteController.deleteVacante);

module.exports = router;
