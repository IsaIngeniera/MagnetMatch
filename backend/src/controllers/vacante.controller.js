const { Op } = require('sequelize');
const { Vacante, Empresa, Habilidad, MatchRecomendacion, VacanteHabilidad, Aspirante } = require('../models');

/**
 * GET /api/vacantes
 */
const getAllVacantes = async (req, res) => {
  try {
    const { modalidad, salario_min, salario_max, search, empresa, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = { activa: true };
    if (modalidad) whereClause.modalidad = modalidad;
    if (salario_min) whereClause.salario_max = { [Op.gte]: parseFloat(salario_min) };
    if (salario_max) whereClause.salario_min = { [Op.lte]: parseFloat(salario_max) };
    if (search) {
      whereClause[Op.or] = [
        { titulo: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (empresa) whereClause.id_empresa = parseInt(empresa);

    const { count, rows: vacantes } = await Vacante.findAndCountAll({
      where: whereClause,
      include: [{ model: Empresa, as: 'empresa' }],
      order: [['fecha_publicacion', 'DESC']],
      limit: limitNum,
      offset
    });

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
      pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching vacantes:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/vacantes/:id
 */
const getVacanteById = async (req, res) => {
  try {
    const idVacante = parseInt(req.params.id);
    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const vacante = await Vacante.findByPk(idVacante, {
      include: [{ model: Empresa, as: 'empresa' }]
    });
    if (!vacante) return res.status(404).json({ success: false, error: 'Vacante no encontrada' });

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
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/vacantes
 */
const createVacante = async (req, res) => {
  try {
    const { id_empresa, titulo, descripcion, salario_min, salario_max, modalidad, habilidades } = req.body;
    if (!id_empresa || !titulo) return res.status(400).json({ success: false, error: 'id_empresa y titulo son requeridos' });

    const empresa = await Empresa.findByPk(id_empresa);
    if (!empresa) return res.status(404).json({ success: false, error: 'Empresa no encontrada' });

    const vacante = await Vacante.create({
      id_empresa, titulo,
      descripcion: descripcion || null,
      salario_min: salario_min || null,
      salario_max: salario_max || null,
      modalidad: modalidad || null,
      activa: true
    });

    if (habilidades && Array.isArray(habilidades)) {
      for (const hab of habilidades) {
        await VacanteHabilidad.create({
          id_vacante: vacante.id_vacante,
          id_habilidad: hab.id_habilidad,
          es_obligatoria: hab.es_obligatoria || false
        });
      }
    }

    return res.status(201).json({ success: true, data: vacante, message: 'Vacante creada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/vacantes/:id
 */
const updateVacante = async (req, res) => {
  try {
    const idVacante = parseInt(req.params.id);
    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const vacante = await Vacante.findByPk(idVacante);
    if (!vacante) return res.status(404).json({ success: false, error: 'Vacante no encontrada' });

    const { titulo, descripcion, salario_min, salario_max, modalidad, activa } = req.body;
    if (titulo !== undefined) vacante.titulo = titulo;
    if (descripcion !== undefined) vacante.descripcion = descripcion;
    if (salario_min !== undefined) vacante.salario_min = salario_min;
    if (salario_max !== undefined) vacante.salario_max = salario_max;
    if (modalidad !== undefined) vacante.modalidad = modalidad;
    if (activa !== undefined) vacante.activa = activa;
    await vacante.save();

    return res.json({ success: true, data: vacante, message: 'Vacante actualizada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/vacantes/:id
 */
const deleteVacante = async (req, res) => {
  try {
    const idVacante = parseInt(req.params.id);
    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const vacante = await Vacante.findByPk(idVacante);
    if (!vacante) return res.status(404).json({ success: false, error: 'Vacante no encontrada' });

    vacante.activa = false;
    await vacante.save();

    return res.json({ success: true, message: 'Vacante desactivada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/vacantes/recomendadas
 */
const recomendarVacantes = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;

    const aspirante = await Aspirante.findOne({
      where: { firebase_uid },
      include: [{ model: Habilidad, as: 'habilidades' }]
    });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    if (!aspirante.habilidades || aspirante.habilidades.length === 0) {
      return res.json({ success: true, data: [], message: 'No tienes habilidades registradas aún.' });
    }

    // ✅ FIX DUPLICADOS: Separar la query de habilidades del findAll de vacantes
    // El include N:M en el mismo findAll genera JOINs que duplican filas
    const vacantes = await Vacante.findAll({
      where: { activa: true },
      include: [{ model: Empresa, as: 'empresa' }] // Solo empresa, no habilidades
    });

    const habilidadesAspiranteIds = aspirante.habilidades.map(h => h.id_habilidad);

    const recomendaciones = await Promise.all(vacantes.map(async (vacante) => {
      // Traer habilidades de la vacante por separado (evita el JOIN duplicador)
      const habilidadesVacante = await VacanteHabilidad.findAll({
        where: { id_vacante: vacante.id_vacante },
        include: [{ model: Habilidad }]
      });

      const habilidadesRequeridasIds = habilidadesVacante.map(h => h.id_habilidad);

      let score = 0;
      if (habilidadesRequeridasIds.length > 0) {
        const coincidencias = habilidadesRequeridasIds.filter(id =>
          habilidadesAspiranteIds.includes(id)
        );
        score = Math.round((coincidencias.length / habilidadesRequeridasIds.length) * 100);
      } else {
        score = 50;
      }

      // ✅ FIX POSTULACIONES: Usar findOrCreate en lugar de upsert
      // upsert sobreescribe TODOS los campos incluyendo estado_postulacion,
      // lo que resetea las postulaciones del usuario a 'pendiente' en cada carga.
      if (score > 10) {
        const [match, created] = await MatchRecomendacion.findOrCreate({
          where: {
            id_aspirante: aspirante.id_aspirante,
            id_vacante: vacante.id_vacante
          },
          defaults: {
            score_compatibilidad: score,
            estado_postulacion: 'pendiente', // Solo aplica al CREAR, no al actualizar
            fecha_calculo: new Date()
          }
        });

        // Si ya existía, solo actualizar el score — NUNCA tocar estado_postulacion
        if (!created) {
          await match.update({ score_compatibilidad: score });
        }
      }

      return {
        ...vacante.toJSON(),
        matchScore: score,
        habilidades: habilidadesVacante.map(h => ({
          id_habilidad: h.id_habilidad,
          nombre: h.Habilidad?.nombre || ''
        }))
      };
    }));

    // ✅ FIX DUPLICADOS: Deduplicar por id_vacante como segunda capa de seguridad
    const seen = new Set();
    const deduplicadas = recomendaciones.filter(v => {
      if (seen.has(v.id_vacante)) return false;
      seen.add(v.id_vacante);
      return true;
    });

    deduplicadas.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ success: true, data: deduplicadas });

  } catch (error) {
    console.error('Error en recomendarVacantes:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor al generar recomendaciones' });
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