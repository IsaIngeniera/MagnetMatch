const { Op } = require('sequelize');
const { Vacante, Empresa, Habilidad, MatchRecomendacion, VacanteHabilidad, Aspirante } = require('../models');

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

const createVacante = async (req, res) => {
  try {
    const { id_empresa, titulo, descripcion, salario_min, salario_max, modalidad, habilidades, porcentaje_minimo } = req.body;
    if (!id_empresa || !titulo) return res.status(400).json({ success: false, error: 'id_empresa y titulo son requeridos' });

    const empresa = await Empresa.findByPk(id_empresa);
    if (!empresa) return res.status(404).json({ success: false, error: 'Empresa no encontrada' });

    const vacante = await Vacante.create({
      id_empresa, titulo,
      descripcion: descripcion || null,
      salario_min: salario_min || null,
      salario_max: salario_max || null,
      modalidad: modalidad || null,
      porcentaje_minimo: porcentaje_minimo != null ? parseInt(porcentaje_minimo) : 0,
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

const updateVacante = async (req, res) => {
  try {
    const idVacante = parseInt(req.params.id);
    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const vacante = await Vacante.findByPk(idVacante);
    if (!vacante) return res.status(404).json({ success: false, error: 'Vacante no encontrada' });

    const { titulo, descripcion, salario_min, salario_max, modalidad, activa, porcentaje_minimo } = req.body;
    if (titulo !== undefined) vacante.titulo = titulo;
    if (descripcion !== undefined) vacante.descripcion = descripcion;
    if (salario_min !== undefined) vacante.salario_min = salario_min;
    if (salario_max !== undefined) vacante.salario_max = salario_max;
    if (modalidad !== undefined) vacante.modalidad = modalidad;
    if (activa !== undefined) vacante.activa = activa;
    if (porcentaje_minimo !== undefined) vacante.porcentaje_minimo = parseInt(porcentaje_minimo);
    await vacante.save();

    return res.json({ success: true, data: vacante, message: 'Vacante actualizada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

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
 * POST /api/vacantes/:id/aplicar
 * ✅ HU-10: Validar perfil 100% Y match score > 0 Y match >= porcentaje_minimo
 */
const aplicarVacante = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const idVacante = parseInt(req.params.id);

    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID de vacante inválido' });

    const [aspirante, vacante] = await Promise.all([
      Aspirante.findOne({ where: { firebase_uid } }),
      Vacante.findByPk(idVacante)
    ]);

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
    if (!vacante)   return res.status(404).json({ success: false, error: 'Vacante no encontrada' });

    const porcentajeMinimo = vacante.porcentaje_minimo || 0;
    const porcentajeAspirante = aspirante.porcentaje_completitud || 0;

    // ✅ Validación 1: perfil al 100%
    if (porcentajeAspirante < 100) {
      return res.status(403).json({
        success: false,
        error: `Tu perfil está al ${porcentajeAspirante}%. Necesitas el 100% para aplicar.`,
        codigo: 'PERFIL_INCOMPLETO'
      });
    }

    // ✅ Validación 2: buscar el match score guardado para esta vacante
    const matchGuardado = await MatchRecomendacion.findOne({
      where: { id_aspirante: aspirante.id_aspirante, id_vacante: idVacante }
    });

    const matchScore = matchGuardado ? parseFloat(matchGuardado.score_compatibilidad) : 0;

    // ✅ Validación 3: bloquear si match es 0
    if (matchScore === 0) {
      return res.status(403).json({
        success: false,
        error: 'Tu compatibilidad con esta vacante es del 0%. No cumples los requisitos mínimos de habilidades.',
        codigo: 'MATCH_CERO'
      });
    }

    // ✅ Validación 4: bloquear si match < porcentaje_minimo configurado
    if (porcentajeMinimo > 0 && matchScore < porcentajeMinimo) {
      return res.status(403).json({
        success: false,
        error: `Tu compatibilidad (${matchScore}%) no alcanza el mínimo requerido por la empresa (${porcentajeMinimo}%).`,
        codigo: 'MATCH_INSUFICIENTE'
      });
    }

    // ✅ Crear o actualizar la postulación
    const [match, created] = await MatchRecomendacion.findOrCreate({
      where: { id_aspirante: aspirante.id_aspirante, id_vacante: idVacante },
      defaults: {
        score_compatibilidad: matchScore,
        estado_postulacion: 'postulado',
        fecha_calculo: new Date()
      }
    });

    if (!created) {
      await match.update({ estado_postulacion: 'postulado' });
    }

    return res.json({
      success: true,
      message: '¡Postulación enviada con éxito!',
      data: match
    });
  } catch (error) {
    console.error('Error en aplicarVacante:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

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

    const vacantes = await Vacante.findAll({
      where: { activa: true },
      include: [{ model: Empresa, as: 'empresa' }]
    });

    const habilidadesAspiranteIds = aspirante.habilidades.map(h => h.id_habilidad);

    const recomendaciones = await Promise.all(vacantes.map(async (vacante) => {
      const habilidadesVacante = await VacanteHabilidad.findAll({
        where: { id_vacante: vacante.id_vacante },
        include: [{ model: Habilidad }]
      });

      const habilidadesRequeridasIds = habilidadesVacante.map(h => h.id_habilidad);

      let score = 0;
      if (habilidadesRequeridasIds.length > 0) {
        const coincidencias = habilidadesRequeridasIds.filter(id => habilidadesAspiranteIds.includes(id));
        score = Math.round((coincidencias.length / habilidadesRequeridasIds.length) * 100);
      } else {
        score = 50;
      }

      if (score > 0) {
        const [match, created] = await MatchRecomendacion.findOrCreate({
          where: { id_aspirante: aspirante.id_aspirante, id_vacante: vacante.id_vacante },
          defaults: { score_compatibilidad: score, estado_postulacion: 'pendiente', fecha_calculo: new Date() }
        });
        if (!created) await match.update({ score_compatibilidad: score });
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
  recomendarVacantes,
  aplicarVacante
};