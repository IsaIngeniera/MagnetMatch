const { Op } = require('sequelize');
const { Vacante, Empresa, Habilidad, VacanteHabilidad } = require('../models');

/**
 * GET /api/vacantes
 * HU-09: Lista todas las vacantes activas
 */
const getAllVacantes = async (req, res) => {
  try {
    const { modalidad, salario_min, salario_max, search, empresa, page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = { activa: true };

    if (modalidad) {
      whereClause.modalidad = modalidad;
    }

    if (salario_min) {
      whereClause.salario_max = { [Op.gte]: parseFloat(salario_min) };
    }

    if (salario_max) {
      whereClause.salario_min = { [Op.lte]: parseFloat(salario_max) };
    }

    if (search) {
      whereClause[Op.or] = [
        { titulo: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (empresa) {
      whereClause.id_empresa = parseInt(empresa);
    }

    // Get vacantes with empresa info
    const { count, rows: vacantes } = await Vacante.findAndCountAll({
      where: whereClause,
      include: [{ model: Empresa, as: 'empresa' }],
      order: [['fecha_publicacion', 'DESC']],
      limit: limitNum,
      offset
    });

    // Get skills for each vacancy
    const vacantesConHabilidades = await Promise.all(
      vacantes.map(async (vacante) => {
        const habilidades = await VacanteHabilidad.findAll({
          where: { id_vacante: vacante.id_vacante },
          include: [{ model: Habilidad }],
          order: [['es_obligatoria', 'DESC']]
        });

        return {
          ...vacante.toJSON(),
          empresa_nombre: vacante.empresa.nombre,
          empresa_sector: vacante.empresa.sector,
          empresa_sitio_web: vacante.empresa.sitio_web,
          habilidades_requeridas: habilidades.map(h => ({
            id_habilidad: h.id_habilidad,
            es_obligatoria: h.es_obligatoria,
            nombre: h.Habilidad.nombre,
            categoria: h.Habilidad.categoria
          }))
        };
      })
    );

    return res.json({
      success: true,
      data: vacantesConHabilidades,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching vacantes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/vacantes/:id
 * HU-10: Ver detalle de una vacante específica
 */
const getVacanteById = async (req, res) => {
  try {
    const { id } = req.params;
    const idVacante = parseInt(id);

    if (isNaN(idVacante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const vacante = await Vacante.findByPk(idVacante, {
      include: [{ model: Empresa, as: 'empresa' }]
    });

    if (!vacante) {
      return res.status(404).json({
        success: false,
        error: 'Vacante no encontrada'
      });
    }

    // Get required skills
    const habilidades = await VacanteHabilidad.findAll({
      where: { id_vacante: idVacante },
      include: [{ model: Habilidad }],
      order: [['es_obligatoria', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        ...vacante.toJSON(),
        empresa_nombre: vacante.empresa.nombre,
        empresa_sector: vacante.empresa.sector,
        empresa_sitio_web: vacante.empresa.sitio_web,
        habilidades_requeridas: habilidades.map(h => ({
          id_habilidad: h.id_habilidad,
          es_obligatoria: h.es_obligatoria,
          nombre: h.Habilidad.nombre,
          categoria: h.Habilidad.categoria
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching vacante:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/vacantes
 * Create a new job posting
 */
const createVacante = async (req, res) => {
  try {
    const { id_empresa, titulo, descripcion, salario_min, salario_max, modalidad, habilidades } = req.body;

    // Validate required fields
    if (!id_empresa || !titulo) {
      return res.status(400).json({
        success: false,
        error: 'id_empresa y titulo son requeridos'
      });
    }

    // Verify empresa exists
    const empresa = await Empresa.findByPk(id_empresa);
    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    const vacante = await Vacante.create({
      id_empresa,
      titulo,
      descripcion: descripcion || null,
      salario_min: salario_min || null,
      salario_max: salario_max || null,
      modalidad: modalidad || null,
      activa: true
    });

    // Add skills if provided
    if (habilidades && Array.isArray(habilidades)) {
      for (const hab of habilidades) {
        await VacanteHabilidad.create({
          id_vacante: vacante.id_vacante,
          id_habilidad: hab.id_habilidad,
          es_obligatoria: hab.es_obligatoria || false
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: vacante,
      message: 'Vacante creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating vacante:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/vacantes/:id
 * Update a job posting
 */
const updateVacante = async (req, res) => {
  try {
    const { id } = req.params;
    const idVacante = parseInt(id);

    if (isNaN(idVacante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const vacante = await Vacante.findByPk(idVacante);
    if (!vacante) {
      return res.status(404).json({
        success: false,
        error: 'Vacante no encontrada'
      });
    }

    const { titulo, descripcion, salario_min, salario_max, modalidad, activa } = req.body;

    if (titulo !== undefined) vacante.titulo = titulo;
    if (descripcion !== undefined) vacante.descripcion = descripcion;
    if (salario_min !== undefined) vacante.salario_min = salario_min;
    if (salario_max !== undefined) vacante.salario_max = salario_max;
    if (modalidad !== undefined) vacante.modalidad = modalidad;
    if (activa !== undefined) vacante.activa = activa;

    await vacante.save();

    return res.json({
      success: true,
      data: vacante,
      message: 'Vacante actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating vacante:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * DELETE /api/vacantes/:id
 * Delete (deactivate) a job posting
 */
const deleteVacante = async (req, res) => {
  try {
    const { id } = req.params;
    const idVacante = parseInt(id);

    if (isNaN(idVacante)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const vacante = await Vacante.findByPk(idVacante);
    if (!vacante) {
      return res.status(404).json({
        success: false,
        error: 'Vacante no encontrada'
      });
    }

    // Soft delete - just deactivate
    vacante.activa = false;
    await vacante.save();

    return res.json({
      success: true,
      message: 'Vacante desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting vacante:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * GET /api/vacantes/recomendadas
 * HU-12: Motor de Match - Calcula vacantes según habilidades del aspirante
 */const recomendarVacantes = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;

    const aspirante = await Aspirante.findOne({
      where: { firebase_uid },
      include: [{ model: Habilidad, as: 'habilidades' }]
    });

    // CAMBIO: Si no hay aspirante o no tiene habilidades, devolvemos éxito pero data vacía
    if (!aspirante || !aspirante.habilidades || aspirante.habilidades.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No tienes habilidades registradas aún.'
      });
    }

    const vacantes = await Vacante.findAll({
      where: { activa: true },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Habilidad, as: 'habilidades' }
      ]
    });

    const habilidadesAspiranteIds = aspirante.habilidades.map(h => h.id_habilidad);

    const recomendaciones = vacantes.map(vacante => {
      const habilidadesRequeridasIds = vacante.habilidades.map(h => h.id_habilidad);
      const coincidencias = habilidadesRequeridasIds.filter(id => 
        habilidadesAspiranteIds.includes(id)
      );

      const score = habilidadesRequeridasIds.length > 0 
        ? Math.round((coincidencias.length / habilidadesRequeridasIds.length) * 100) 
        : 0;

      return {
        ...vacante.toJSON(),
        matchScore: score // Asegúrate de que el nombre coincida con el frontend
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      data: recomendaciones
    });

  } catch (error) {
    console.error('Error en Motor de Match:', error);
    return res.status(500).json({ success: false, error: 'Error al procesar recomendaciones' });
  }
};

module.exports = {
  getAllVacantes,
  getVacanteById,
  createVacante,
  updateVacante,
  deleteVacante,
  recomendarVacantes
};
