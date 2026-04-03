const { Experiencia, Aspirante } = require('../models');
const { updateProfileCompleteness } = require('../services/profile.service');

/**
 * GET /api/aspirantes/:id/experiencia
 * HU-02: Lista todas las experiencias laborales
 */
const getExperiencias = async (req, res) => {
  try {
    const { id } = req.params;
    const idAspirante = parseInt(id);

    if (isNaN(idAspirante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const experiencias = await Experiencia.findAll({
      where: { id_aspirante: idAspirante },
      order: [['fecha_inicio', 'DESC']]
    });

    return res.json({
      success: true,
      data: experiencias
    });
  } catch (error) {
    console.error('Error fetching experiencias:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/aspirantes/:id/experiencia
 * HU-02: Agregar experiencia laboral
 */
const createExperiencia = async (req, res) => {
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

    const { cargo, empresa, fecha_inicio, fecha_fin, descripcion_logros } = req.body;

    // Validate required fields
    if (!cargo || !empresa || !fecha_inicio) {
      return res.status(400).json({
        success: false,
        error: 'Cargo, empresa y fecha de inicio son requeridos'
      });
    }

    const experiencia = await Experiencia.create({
      id_aspirante: idAspirante,
      cargo,
      empresa,
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      descripcion_logros: descripcion_logros || null
    });

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.status(201).json({
      success: true,
      data: experiencia,
      message: 'Experiencia agregada exitosamente'
    });
  } catch (error) {
    console.error('Error creating experiencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/aspirantes/:id/experiencia/:expId
 * Get specific experience
 */
const getExperienciaById = async (req, res) => {
  try {
    const { id, expId } = req.params;
    const idAspirante = parseInt(id);
    const idExperiencia = parseInt(expId);

    if (isNaN(idAspirante) || isNaN(idExperiencia)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const experiencia = await Experiencia.findOne({
      where: { id_experiencia: idExperiencia, id_aspirante: idAspirante }
    });

    if (!experiencia) {
      return res.status(404).json({
        success: false,
        error: 'Experiencia no encontrada'
      });
    }

    return res.json({
      success: true,
      data: experiencia
    });
  } catch (error) {
    console.error('Error fetching experiencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/aspirantes/:id/experiencia/:expId
 * HU-03: Editar experiencia laboral
 */
const updateExperiencia = async (req, res) => {
  try {
    const { id, expId } = req.params;
    const idAspirante = parseInt(id);
    const idExperiencia = parseInt(expId);

    if (isNaN(idAspirante) || isNaN(idExperiencia)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const experiencia = await Experiencia.findOne({
      where: { id_experiencia: idExperiencia, id_aspirante: idAspirante }
    });

    if (!experiencia) {
      return res.status(404).json({
        success: false,
        error: 'Experiencia no encontrada'
      });
    }

    const { cargo, empresa, fecha_inicio, fecha_fin, descripcion_logros } = req.body;

    if (cargo !== undefined) experiencia.cargo = cargo;
    if (empresa !== undefined) experiencia.empresa = empresa;
    if (fecha_inicio !== undefined) experiencia.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) experiencia.fecha_fin = fecha_fin;
    if (descripcion_logros !== undefined) experiencia.descripcion_logros = descripcion_logros;

    await experiencia.save();

    return res.json({
      success: true,
      data: experiencia,
      message: 'Experiencia actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating experiencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * DELETE /api/aspirantes/:id/experiencia/:expId
 * HU-03: Eliminar experiencia laboral
 */
const deleteExperiencia = async (req, res) => {
  try {
    const { id, expId } = req.params;
    const idAspirante = parseInt(id);
    const idExperiencia = parseInt(expId);

    if (isNaN(idAspirante) || isNaN(idExperiencia)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const deleted = await Experiencia.destroy({
      where: { id_experiencia: idExperiencia, id_aspirante: idAspirante }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Experiencia no encontrada'
      });
    }

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.json({
      success: true,
      message: 'Experiencia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting experiencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getExperiencias,
  createExperiencia,
  getExperienciaById,
  updateExperiencia,
  deleteExperiencia
};
