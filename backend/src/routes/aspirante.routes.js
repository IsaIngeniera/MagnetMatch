const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/authMiddleware');
const aspiranteController = require('../controllers/aspirante.controller');
const experienciaController = require('../controllers/experiencia.controller');
const educacionController = require('../controllers/educacion.controller');
const habilidadController = require('../controllers/habilidad.controller');
const logroController = require('../controllers/logro.controller');
const matchController = require('../controllers/match.controller');
const upload = require('../middleware/uploadMiddleware');

// Importamos el middleware para el Sprint 2


// =============================================
// Rutas de Mi Perfil (Basadas en Token Mock)
// Estas van primero para evitar conflicto con /:id
// =============================================

/**
 * GET /api/aspirantes/perfil/me
 * HU-04: Ver perfil completo del aspirante (Usuario actual)
 */
//router.get('/perfil/me', verificarToken, aspiranteController.getAspiranteById);
router.get('/perfil/me', verificarToken, aspiranteController.getAspiranteById);
// PUT /api/aspirantes/perfil/me — Editar perfil del usuario autenticado
router.put('/perfil/me', verificarToken, aspiranteController.updateAspirante);
/**
 * GET /api/aspirantes/perfil/completitud
 * HU-02: Visualizar Porcentaje de Completitud (Usuario actual)
 */
router.get('/me/completitud', verificarToken, aspiranteController.getCompletitud);

router.get('/me/mensajes', verificarToken, aspiranteController.getMensajes);

// HU-5: Subir hoja de vida (Usuario actual)
router.post('/me/upload-cv', verificarToken, upload.single('cv'), aspiranteController.uploadCV);

/**
 * GET /api/aspirantes/recomendaciones/me
 * HU-11: Obtener vacantes recomendadas (Usuario actual)
 */
router.get('/recomendaciones/me', verificarToken, matchController.getRecomendaciones);

router.get('/me/postulaciones', verificarToken, matchController.getPostulaciones); // HU-14


// =============================================
// Aspirante Base Routes
// =============================================

router.get('/me/match/:vacanteId', verificarToken, matchController.getMatchScore); // HU-16
router.post('/me/match/:vacanteId', verificarToken, matchController.updatePostulacion); // HU-13 y 15
router.patch('/me/mensajes/:id_mensaje/leido', verificarToken, aspiranteController.marcarMensajeLeido); // HU-14
/**
 * POST /api/aspirantes
 * HU-01: Registrar nuevo aspirante
 */
router.post('/', aspiranteController.createAspirante);

/**
 * GET /api/aspirantes
 * List all aspirantes
 */
router.get('/', aspiranteController.getAllAspirantes);

/**
 * GET /api/aspirantes/:id
 * HU-04: Ver perfil completo del aspirante
 */
router.get('/:id', aspiranteController.getAspiranteById);

/**
 * PUT /api/aspirantes/:id
 * HU-03: Editar perfil del aspirante
 */
router.put('/:id', aspiranteController.updateAspirante);

/**
 * DELETE /api/aspirantes/:id
 * Delete aspirante
 */
router.delete('/:id', aspiranteController.deleteAspirante);

/**
 * GET /api/aspirantes/:id/completitud
 * HU-05: Visualizar Porcentaje de Completitud
 */
router.get('/:id/completitud', aspiranteController.getCompletitud);

// =============================================
// Experiencia Routes
// =============================================

/**
 * GET /api/aspirantes/:id/experiencia
 * HU-02: Lista experiencias laborales
 */
router.get('/:id/experiencia', experienciaController.getExperiencias);

/**
 * POST /api/aspirantes/:id/experiencia
 * HU-02: Agregar experiencia laboral
 */
router.post('/:id/experiencia', experienciaController.createExperiencia);

/**
 * GET /api/aspirantes/:id/experiencia/:expId
 * Get specific experience
 */
router.get('/:id/experiencia/:expId', experienciaController.getExperienciaById);

/**
 * PUT /api/aspirantes/:id/experiencia/:expId
 * HU-03: Editar experiencia laboral
 */
router.put('/:id/experiencia/:expId', experienciaController.updateExperiencia);

/**
 * DELETE /api/aspirantes/:id/experiencia/:expId
 * HU-03: Eliminar experiencia laboral
 */
router.delete('/:id/experiencia/:expId', experienciaController.deleteExperiencia);

// =============================================
// Educacion Routes
// =============================================

/**
 * GET /api/aspirantes/:id/educacion
 * HU-02: Lista educación
 */
router.get('/:id/educacion', educacionController.getEducaciones);

/**
 * POST /api/aspirantes/:id/educacion
 * HU-02: Agregar educación
 */
router.post('/:id/educacion', educacionController.createEducacion);

/**
 * GET /api/aspirantes/:id/educacion/:eduId
 * Get specific education entry
 */
router.get('/:id/educacion/:eduId', educacionController.getEducacionById);

/**
 * PUT /api/aspirantes/:id/educacion/:eduId
 * HU-03: Editar educación
 */
router.put('/:id/educacion/:eduId', educacionController.updateEducacion);

/**
 * DELETE /api/aspirantes/:id/educacion/:eduId
 * HU-03: Eliminar educación
 */
router.delete('/:id/educacion/:eduId', educacionController.deleteEducacion);

// =============================================
// Habilidades Routes
// =============================================

/**
 * GET /api/aspirantes/:id/habilidades
 * HU-06: Lista habilidades del aspirante
 */
router.get('/:id/habilidades', habilidadController.getAspiranteHabilidades);

/**
 * POST /api/aspirantes/:id/habilidades
 * HU-06: Agregar habilidad al perfil
 */
router.post('/:id/habilidades', habilidadController.addHabilidadToAspirante);

/**
 * PUT /api/aspirantes/:id/habilidades/:habId
 * HU-07: Editar nivel o años de experiencia
 */
router.put('/:id/habilidades/:habId', habilidadController.updateAspiranteHabilidad);

/**
 * DELETE /api/aspirantes/:id/habilidades/:habId
 * HU-07: Eliminar habilidad del perfil
 */
router.delete('/:id/habilidades/:habId', habilidadController.removeHabilidadFromAspirante);

// =============================================
// Logros Routes
// =============================================

/**
 * GET /api/aspirantes/:id/logros
 * HU-08: Lista logros del aspirante
 */
router.get('/:id/logros', logroController.getLogros);

/**
 * POST /api/aspirantes/:id/logros
 * HU-08: Agregar logro
 */
router.post('/:id/logros', logroController.createLogro);

/**
 * GET /api/aspirantes/:id/logros/:logroId
 * Get specific achievement
 */
router.get('/:id/logros/:logroId', logroController.getLogroById);

/**
 * PUT /api/aspirantes/:id/logros/:logroId
 * HU-08: Editar logro
 */
router.put('/:id/logros/:logroId', logroController.updateLogro);

/**
 * DELETE /api/aspirantes/:id/logros/:logroId
 * HU-08: Eliminar logro
 */
router.delete('/:id/logros/:logroId', logroController.deleteLogro);

// =============================================
// Recomendaciones y Match Routes
// =============================================
// 2. Ruta para un ID específico (HU-11 con ID directo)

router.get('/:id/recomendaciones', verificarToken, matchController.getRecomendaciones);
/**
 * GET /api/aspirantes/:id/match/:vacanteId
 * HU-12: Calcular score de compatibilidad
 */
router.get('/:id/match/:vacanteId', verificarToken, matchController.getMatchScore);

/**
 * POST /api/aspirantes/:id/match/:vacanteId
 * HU-12: Actualizar estado de postulación
 */
router.post('/:id/match/:vacanteId', verificarToken, matchController.updatePostulacion);

module.exports = router;