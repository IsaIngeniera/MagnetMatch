const { Op } = require('sequelize');
const { Habilidad, AspiranteHabilidad, Aspirante } = require('../models');
const { updateProfileCompleteness } = require('../services/profile.service');

/**
 * GET /api/habilidades
 * HU-06: Lista todas las habilidades disponibles
 */
const getAllHabilidades = async (req, res) => {
  try {
    const { categoria, search } = req.query;
    
    const whereClause = {};
    
    if (categoria) {
      whereClause.categoria = categoria;
    }
    
    if (search) {
      whereClause.nombre = { [Op.iLike]: `%${search}%` };
    }

    const habilidades = await Habilidad.findAll({
      where: whereClause,
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });

    // Get available categories
    const categorias = await Habilidad.findAll({
      attributes: [[Habilidad.sequelize.fn('DISTINCT', Habilidad.sequelize.col('categoria')), 'categoria']],
      order: [['categoria', 'ASC']]
    });

    return res.json({
      success: true,
      data: {
        habilidades,
        categorias: categorias.map(c => c.categoria)
      }
    });
  } catch (error) {
    console.error('Error fetching habilidades:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/habilidades
 * Admin endpoint to add new skills
 */
const createHabilidad = async (req, res) => {
  try {
    const { nombre, categoria } = req.body;

    if (!nombre || !categoria) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y categoría son requeridos'
      });
    }

    // Check if skill already exists
    const existing = await Habilidad.findOne({
      where: { nombre: { [Op.iLike]: nombre } }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Esta habilidad ya existe'
      });
    }

    const habilidad = await Habilidad.create({ nombre, categoria });

    return res.status(201).json({
      success: true,
      data: habilidad,
      message: 'Habilidad creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating habilidad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/aspirantes/:id/habilidades
 * HU-06: Lista las habilidades del aspirante
 */
const getAspiranteHabilidades = async (req, res) => {
  try {
    const { id } = req.params;
    const idAspirante = parseInt(id);

    if (isNaN(idAspirante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const habilidades = await AspiranteHabilidad.findAll({
      where: { id_aspirante: idAspirante },
      include: [{ model: Habilidad }],
      order: [['anios_experiencia', 'DESC']]
    });

    return res.json({
      success: true,
      data: habilidades.map(h => ({
        id_aspirante: h.id_aspirante,
        id_habilidad: h.id_habilidad,
        nivel: h.nivel,
        anios_experiencia: h.anios_experiencia,
        nombre: h.Habilidad.nombre,
        categoria: h.Habilidad.categoria
      }))
    });
  } catch (error) {
    console.error('Error fetching aspirante habilidades:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/aspirantes/:id/habilidades
 * HU-06: Agregar habilidad al perfil del aspirante
 */
const addHabilidadToAspirante = async (req, res) => {
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

    const { id_habilidad, nivel, anios_experiencia } = req.body;

    // Validate required fields
    if (!id_habilidad || !nivel) {
      return res.status(400).json({
        success: false,
        error: 'id_habilidad y nivel son requeridos'
      });
    }

    // Validate nivel
    const validNiveles = ['básico', 'intermedio', 'avanzado', 'experto'];
    if (!validNiveles.includes(nivel.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Nivel debe ser uno de: ${validNiveles.join(', ')}`
      });
    }

    // Check if habilidad exists
    const habilidad = await Habilidad.findByPk(id_habilidad);
    if (!habilidad) {
      return res.status(404).json({
        success: false,
        error: 'Habilidad no encontrada'
      });
    }

    // Check if already assigned
    const existing = await AspiranteHabilidad.findOne({
      where: { id_aspirante: idAspirante, id_habilidad }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Esta habilidad ya está asignada'
      });
    }

    await AspiranteHabilidad.create({
      id_aspirante: idAspirante,
      id_habilidad,
      nivel: nivel.toLowerCase(),
      anios_experiencia: anios_experiencia || 0
    });

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.status(201).json({
      success: true,
      data: {
        id_aspirante: idAspirante,
        id_habilidad,
        nivel: nivel.toLowerCase(),
        anios_experiencia: anios_experiencia || 0,
        nombre: habilidad.nombre,
        categoria: habilidad.categoria
      },
      message: 'Habilidad agregada exitosamente'
    });
  } catch (error) {
    console.error('Error adding habilidad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/aspirantes/:id/habilidades/:habId
 * HU-07: Editar nivel o años de experiencia
 */
const updateAspiranteHabilidad = async (req, res) => {
  try {
    const { id, habId } = req.params;
    const idAspirante = parseInt(id);
    const idHabilidad = parseInt(habId);

    if (isNaN(idAspirante) || isNaN(idHabilidad)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const aspiHab = await AspiranteHabilidad.findOne({
      where: { id_aspirante: idAspirante, id_habilidad: idHabilidad },
      include: [{ model: Habilidad }]
    });

    if (!aspiHab) {
      return res.status(404).json({
        success: false,
        error: 'Habilidad no asignada a este aspirante'
      });
    }

    const { nivel, anios_experiencia } = req.body;

    // Validate nivel if provided
    if (nivel) {
      const validNiveles = ['básico', 'intermedio', 'avanzado', 'experto'];
      if (!validNiveles.includes(nivel.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Nivel debe ser uno de: ${validNiveles.join(', ')}`
        });
      }
      aspiHab.nivel = nivel.toLowerCase();
    }

    if (anios_experiencia !== undefined) {
      aspiHab.anios_experiencia = anios_experiencia;
    }

    await aspiHab.save();

    return res.json({
      success: true,
      data: {
        id_aspirante: aspiHab.id_aspirante,
        id_habilidad: aspiHab.id_habilidad,
        nivel: aspiHab.nivel,
        anios_experiencia: aspiHab.anios_experiencia,
        nombre: aspiHab.Habilidad.nombre,
        categoria: aspiHab.Habilidad.categoria
      },
      message: 'Habilidad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating habilidad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * DELETE /api/aspirantes/:id/habilidades/:habId
 * HU-07: Eliminar habilidad del perfil
 */
const removeHabilidadFromAspirante = async (req, res) => {
  try {
    const { id, habId } = req.params;
    const idAspirante = parseInt(id);
    const idHabilidad = parseInt(habId);

    if (isNaN(idAspirante) || isNaN(idHabilidad)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const deleted = await AspiranteHabilidad.destroy({
      where: { id_aspirante: idAspirante, id_habilidad: idHabilidad }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Habilidad no asignada a este aspirante'
      });
    }

    // Update profile completeness
    await updateProfileCompleteness(idAspirante);

    return res.json({
      success: true,
      message: 'Habilidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting habilidad:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllHabilidades,
  createHabilidad,
  getAspiranteHabilidades,
  addHabilidadToAspirante,
  updateAspiranteHabilidad,
  removeHabilidadFromAspirante
};
