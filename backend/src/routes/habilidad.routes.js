const express = require('express');
const router = express.Router();

const habilidadController = require('../controllers/habilidad.controller');

/**
 * GET /api/habilidades
 * HU-06: Lista todas las habilidades disponibles
 * 
 * Query params:
 * - categoria: Filter by category
 * - search: Search by name
 */
router.get('/', habilidadController.getAllHabilidades);

/**
 * POST /api/habilidades
 * Admin endpoint to add new skills to the catalog
 */
router.post('/', habilidadController.createHabilidad);

module.exports = router;
