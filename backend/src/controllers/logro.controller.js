const { Logro, Aspirante } = require('../models');
const { updateProfileCompleteness } = require('../services/profile.service');

/**
 * GET /api/aspirantes/:id/logros
 * HU-08: Lista todos los logros del aspirante
 */
const getLogros = async (req, res) => {
  try {
    const { id } = req.params;
    const idAspirante = parseInt(id);

    if (isNaN(idAspirante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const logros = await Logro.findAll({
      where: { id_aspirante: idAspirante },
      order: [['verificado', 'DESC'], ['id_logro', 'DESC']]
    });

    return res.json({
      success: true,
      data: logros
    });
  } catch (error) {
    console.error('Error fetching logros:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/aspirantes/:id/logros
 * HU-08: Agregar logro/certificación al perfil
 */
const createLogro = async (req, res) => {
  try {
    const { id } = req.params;
    const idAspirante = parseInt(id);

    if (isNaN(idAspirante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    // Verify aspirante exists
    const aspirante = await Aspirante.findByPk(idAspirante);
    if (!aspirante) {
      return res.status(404).json({
        success: false,
        error: 'Aspirante no encontrado'
      });
    }

    const { titulo_logro, url_credencial } = req.body;

    // Validate required fields
    if (!titulo_logro) {
      return res.status(400).json({
        success: false,
        error: 'titulo_logro es requerido'
      });
    }

    const logro = await Logro.create({
      id_aspirante: idAspirante,
      titulo_logro,
      url_credencial: url_credencial || null,
      verificado: false
    });

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.status(201).json({
      success: true,
      data: logro,
      message: 'Logro agregado exitosamente'
    });
  } catch (error) {
    console.error('Error creating logro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/aspirantes/:id/logros/:logroId
 * Get specific achievement
 */
const getLogroById = async (req, res) => {
  try {
    const { id, logroId } = req.params;
    const idAspirante = parseInt(id);
    const idLogro = parseInt(logroId);

    if (isNaN(idAspirante) || isNaN(idLogro)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const logro = await Logro.findOne({
      where: { id_logro: idLogro, id_aspirante: idAspirante }
    });

    if (!logro) {
      return res.status(404).json({
        success: false,
        error: 'Logro no encontrado'
      });
    }

    return res.json({
      success: true,
      data: logro
    });
  } catch (error) {
    console.error('Error fetching logro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/aspirantes/:id/logros/:logroId
 * HU-08: Editar logro
 */
const updateLogro = async (req, res) => {
  try {
    const { id, logroId } = req.params;
    const idAspirante = parseInt(id);
    const idLogro = parseInt(logroId);

    if (isNaN(idAspirante) || isNaN(idLogro)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const logro = await Logro.findOne({
      where: { id_logro: idLogro, id_aspirante: idAspirante }
    });

    if (!logro) {
      return res.status(404).json({
        success: false,
        error: 'Logro no encontrado'
      });
    }

    const { titulo_logro, url_credencial } = req.body;

    if (titulo_logro !== undefined) logro.titulo_logro = titulo_logro;
    if (url_credencial !== undefined) logro.url_credencial = url_credencial;

    await logro.save();

    return res.json({
      success: true,
      data: logro,
      message: 'Logro actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating logro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * DELETE /api/aspirantes/:id/logros/:logroId
 * HU-08: Eliminar logro
 */
const deleteLogro = async (req, res) => {
  try {
    const { id, logroId } = req.params;
    const idAspirante = parseInt(id);
    const idLogro = parseInt(logroId);

    if (isNaN(idAspirante) || isNaN(idLogro)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const deleted = await Logro.destroy({
      where: { id_logro: idLogro, id_aspirante: idAspirante }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Logro no encontrado'
      });
    }

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.json({
      success: true,
      message: 'Logro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting logro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getLogros,
  createLogro,
  getLogroById,
  updateLogro,
  deleteLogro
};
