const { Educacion, Aspirante } = require('../models');
const { updateProfileCompleteness } = require('../services/profile.service');

/**
 * GET /api/aspirantes/:id/educacion
 * HU-02: Lista toda la educación del aspirante
 */
const getEducaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const idAspirante = parseInt(id);

    if (isNaN(idAspirante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const educaciones = await Educacion.findAll({
      where: { id_aspirante: idAspirante },
      order: [['fecha_fin', 'DESC NULLS FIRST']]
    });

    return res.json({
      success: true,
      data: educaciones
    });
  } catch (error) {
    console.error('Error fetching educaciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/aspirantes/:id/educacion
 * HU-02: Agregar educación al perfil
 */
const createEducacion = async (req, res) => {
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

    const { institucion, titulo, estado, fecha_fin } = req.body;

    // Validate required fields
    if (!institucion || !titulo || !estado) {
      return res.status(400).json({
        success: false,
        error: 'Institución, título y estado son requeridos'
      });
    }

    const educacion = await Educacion.create({
      id_aspirante: idAspirante,
      institucion,
      titulo,
      estado,
      fecha_fin: fecha_fin || null
    });

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.status(201).json({
      success: true,
      data: educacion,
      message: 'Educación agregada exitosamente'
    });
  } catch (error) {
    console.error('Error creating educacion:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/aspirantes/:id/educacion/:eduId
 * Get specific education entry
 */
const getEducacionById = async (req, res) => {
  try {
    const { id, eduId } = req.params;
    const idAspirante = parseInt(id);
    const idEducacion = parseInt(eduId);

    if (isNaN(idAspirante) || isNaN(idEducacion)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const educacion = await Educacion.findOne({
      where: { id_educacion: idEducacion, id_aspirante: idAspirante }
    });

    if (!educacion) {
      return res.status(404).json({
        success: false,
        error: 'Educación no encontrada'
      });
    }

    return res.json({
      success: true,
      data: educacion
    });
  } catch (error) {
    console.error('Error fetching educacion:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/aspirantes/:id/educacion/:eduId
 * HU-03: Editar educación
 */
const updateEducacion = async (req, res) => {
  try {
    const { id, eduId } = req.params;
    const idAspirante = parseInt(id);
    const idEducacion = parseInt(eduId);

    if (isNaN(idAspirante) || isNaN(idEducacion)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const educacion = await Educacion.findOne({
      where: { id_educacion: idEducacion, id_aspirante: idAspirante }
    });

    if (!educacion) {
      return res.status(404).json({
        success: false,
        error: 'Educación no encontrada'
      });
    }

    const { institucion, titulo, estado, fecha_fin } = req.body;

    if (institucion !== undefined) educacion.institucion = institucion;
    if (titulo !== undefined) educacion.titulo = titulo;
    if (estado !== undefined) educacion.estado = estado;
    if (fecha_fin !== undefined) educacion.fecha_fin = fecha_fin;

    await educacion.save();

    return res.json({
      success: true,
      data: educacion,
      message: 'Educación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating educacion:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * DELETE /api/aspirantes/:id/educacion/:eduId
 * HU-03: Eliminar educación
 */
const deleteEducacion = async (req, res) => {
  try {
    const { id, eduId } = req.params;
    const idAspirante = parseInt(id);
    const idEducacion = parseInt(eduId);

    if (isNaN(idAspirante) || isNaN(idEducacion)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const deleted = await Educacion.destroy({
      where: { id_educacion: idEducacion, id_aspirante: idAspirante }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Educación no encontrada'
      });
    }

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.json({
      success: true,
      message: 'Educación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting educacion:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getEducaciones,
  createEducacion,
  getEducacionById,
  updateEducacion,
  deleteEducacion
};
