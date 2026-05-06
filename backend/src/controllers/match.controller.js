
const { Op, Sequelize } = require('sequelize'); 
const { Aspirante, Vacante, Empresa, Experiencia, Habilidad, VacanteHabilidad, MatchRecomendacion } = require('../models');
const { 
  calculateMatchScore, 
  generateRecommendations, 
  saveMatch, 
  getSkillMatchDetails,
  WEIGHTS 
} = require('../services/recommendation.service');
const aiService = require('../services/ai.service');

/**
 * GET /api/aspirantes/:id/recomendaciones
 * HU-11: Obtener vacantes recomendadas para un aspirante
 * Soporta /me para el usuario autenticado
 */const getRecomendaciones = async (req, res) => {
  try {
    const idParam = req.params.id;
    let idAspirante;
    let aspirante; // La definimos aquí para usarla en todo el scope

    if (!idParam || idParam === 'me') {
      aspirante = await Aspirante.findOne({ 
        where: { firebase_uid: req.usuario.firebase_uid } 
      });
      
      if (!aspirante) {
        return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
      }
      idAspirante = aspirante.id_aspirante;
    } else {
      idAspirante = parseInt(idParam);
      aspirante = await Aspirante.findByPk(idAspirante);
    }

    if (!idAspirante || isNaN(idAspirante)) {
      return res.status(400).json({ success: false, error: 'ID de aspirante no identificado' });
    }
    
    const { limit = 10, refresh } = req.query;
    const limitNum = parseInt(limit);
    const shouldRefresh = refresh === 'true';

    let rawRecommendations;

    // 1. Intentar buscar en Caché
    const cachedRecs = await MatchRecomendacion.findAll({
      where: { id_aspirante: idAspirante, estado_postulacion: 'pendiente' },
      include: [{
        model: Vacante,
        as: 'vacante',
        where: { activa: true },
        include: [{ model: Empresa, as: 'empresa' }]
      }],
      order: [['score_compatibilidad', 'DESC']],
      limit: limitNum
    });

    if ((aspirante.porcentaje_completitud || 0) < 100) {
      // Si no tiene el 100%, no calculamos ni retornamos matches
      rawRecommendations = [];
    } else if (shouldRefresh || cachedRecs.length === 0) {
      // 2. Generar nuevas si es necesario (y tiene 100%)
      rawRecommendations = await generateRecommendations(idAspirante, limitNum);
    } else {
      // 3. Formatear las de la caché para que tengan la misma estructura
      rawRecommendations = cachedRecs.map(rec => ({
        id_vacante: rec.id_vacante,
        score: parseFloat(rec.score_compatibilidad),
        vacante: rec.vacante
      }));
    }

    // 4. Enriquecer con detalles de habilidades
    const formattedRecommendations = await Promise.all(
      rawRecommendations.map(async (rec) => {
        const habilidades = await getSkillMatchDetails(idAspirante, rec.id_vacante);
        
        // Verificamos si es una instancia de Sequelize o un objeto plano
        const vacanteData = rec.vacante.get ? rec.vacante.get({ plain: true }) : rec.vacante;

        return {
          id_vacante: rec.id_vacante,
          score: rec.score || rec.score_compatibilidad,
          vacante: {
            ...vacanteData,
            empresa_nombre: vacanteData.empresa?.nombre,
            empresa_sector: vacanteData.empresa?.sector,
            habilidades_match: habilidades 
          }
        };
      })
    );

    return res.json({
      success: true,
      data: {
        recomendaciones: formattedRecommendations,
        perfil_completitud: aspirante.porcentaje_completitud || 0, // CORREGIDO
        advertencia: (aspirante.porcentaje_completitud || 0) < 100 
          ? 'Completa tu perfil al 100% para poder postularte a estas vacantes.' 
          : null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
/**
 * GET /api/aspirantes/:id/match/:vacanteId
 * HU-12: Calcular y obtener el score de compatibilidad específico
 */
const getMatchScore = async (req, res) => {
  try {
   const vacanteId = req.params.vacanteId;
   const id = req.params.id || 'me';
    let idAspirante = null;

    // 1. Resolución de Identidad (Corregida)
    if (id === 'me') {
   
      const uidToken = (req.usuario?.firebase_uid || "user_test_123").trim();
      console.log("UID que llega:", uidToken);

      
      const asp = await Aspirante.findOne({ 
        where: { 
          firebase_uid: uidToken 
        },
        logging: console.log // <--- REVISA TU TERMINAL DE VS CODE AL EJECUTAR
      });

      if (!asp) {
       
       {
          return res.status(404).json({ 
            success: false, 
            error: 'Aspirante no encontrado',
            uid_buscado: uidToken 
          });
        }
      } else {
        idAspirante = asp.id_aspirante;
      }
    } else {
      idAspirante = parseInt(id);
    }

    const idVacante = parseInt(vacanteId);

    // 2. Validación de IDs
    if (!idAspirante || isNaN(idAspirante) || isNaN(idVacante)) {
      return res.status(400).json({
        success: false,
        error: 'ID de aspirante o vacante inválido',
        debug: { idAspirante, idVacante }
      });
    }

    // 3. Obtener Aspirante con sus experiencias
    const aspirante = await Aspirante.findByPk(idAspirante, {
      include: [{ model: Experiencia, as: 'experiencias' }]
    });

    if (!aspirante) {
      return res.status(404).json({ success: false, error: 'Aspirante no existe en la DB' });
    }

    // 4. Obtener Vacante
    const vacante = await Vacante.findByPk(idVacante, {
      include: [{ model: Empresa, as: 'empresa' }]
    });

    if (!vacante) {
      return res.status(404).json({ success: false, error: 'Vacante no encontrada' });
    }

    // 5. Cálculos (Lógica de negocio)
    const score = await calculateMatchScore(idAspirante, idVacante);
    const skillDetails = await getSkillMatchDetails(idAspirante, idVacante);

    // Calcular años de experiencia
    let totalExperienciaAnios = 0;
    if (aspirante.experiencias && aspirante.experiencias.length > 0) {
      for (const exp of aspirante.experiencias) {
        const start = new Date(exp.fecha_inicio);
        if (isNaN(start.getTime())) continue;
        const end = exp.fecha_fin ? new Date(exp.fecha_fin) : new Date();
        totalExperienciaAnios += (end - start) / (1000 * 60 * 60 * 24 * 365.25);
      }
    }

    // Guardar el match
    await saveMatch(idAspirante, idVacante, score);

    // 6. Respuesta
    return res.json({
      success: true,
      data: {
        score_total: Math.round(score * 10) / 10,
        vacante: {
          id_vacante: vacante.id_vacante,
          titulo: vacante.titulo,
          empresa_nombre: vacante.empresa?.nombre
        },
        aspirante: {
          id_aspirante: aspirante.id_aspirante,
          nombre_completo: `${aspirante.nombres} ${aspirante.apellidos}`
        }
      }
    });

  } catch (error) {
    console.error('Error detallado en HU-16:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno en el cálculo del match',
      detalles: error.message
    });
  }
};
/**
 * POST /api/aspirantes/:id/match/:vacanteId
 * HU-12: Actualizar estado de postulación
 */const updatePostulacion = async (req, res) => {
  try {
    const { vacanteId } = req.params;
    const { estado_postulacion } = req.body;
    const uidToken = req.usuario?.firebase_uid || "user_test_123";

    // 1. Obtener aspirante completo para validar perfil
    const aspirante = await Aspirante.findOne({ 
      where: { firebase_uid: uidToken },
      // Incluimos experiencias para el cálculo del 100%
      include: [{ model: Experiencia, as: 'experiencias' }] 
    });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    // --- CA HU-16: RESTRICCIÓN DE PERFIL AL 100% ---
    // Definimos campos obligatorios (ajusta según tu tabla)
    const campos = [aspirante.nombres, aspirante.apellidos, aspirante.email, aspirante.telefono, aspirante.expectativa_salarial, aspirante.modalidad_preferida];
    const tieneExperiencia = aspirante.experiencias && aspirante.experiencias.length > 0;
    
    const camposLlenos = campos.filter(c => c && c.toString().trim() !== "").length;
    const totalCampos = campos.length + 1; // +1 por la experiencia
    const porcentaje = Math.round(((camposLlenos + (tieneExperiencia ? 1 : 0)) / totalCampos) * 100);

    // Si el usuario intenta POSTULARSE pero no tiene el 100%, bloqueamos
    if (estado_postulacion === 'postulado' && porcentaje < 100) {
      return res.status(403).json({
        success: false,
        error: `Tu perfil está al ${porcentaje}%. Para aplicar, debes completarlo al 100%.`,
        progreso: porcentaje
      });
    }
    // ----------------------------------------------

    const idVacante = parseInt(vacanteId);
    if (isNaN(idVacante)) return res.status(400).json({ success: false, error: 'ID de vacante inválido' });

    // 2. Buscar o Crear el Match
    const [match, created] = await MatchRecomendacion.findOrCreate({
      where: { id_aspirante: aspirante.id_aspirante, id_vacante: idVacante },
      defaults: {
        estado_postulacion: estado_postulacion || 'interesado',
        score_compatibilidad: 0,
        fecha_calculo: new Date()
      }
    });

    // 3. Si ya existía, actualizamos el estado y la fecha
    if (!created) {
      match.estado_postulacion = estado_postulacion;
      // Guardamos el momento exacto de la postulación para el orden cronológico
      match.changed('updatedAt', true); 
      await match.save();
    }

    return res.json({
      success: true,
      message: estado_postulacion === 'postulado' ? '¡Postulación enviada con éxito!' : 'Estado actualizado',
      data: match
    });

  } catch (error) {
    console.error('Error en updatePostulacion:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};/**
 * GET /api/aspirantes/:id/postulaciones
 * GET /api/aspirantes/me/postulaciones
 */
const getPostulaciones = async (req, res) => {
  try {
    let idAspirante = req.params.id;

    // 1. Identificar si la petición es para el usuario actual ('me')
    if (idAspirante === 'me' || req.route.path.includes('/me/')) {
      // Validar que el token haya pasado correctamente
      if (!req.usuario || !req.usuario.firebase_uid) {
        return res.status(401).json({ success: false, error: 'No autorizado. Token no válido.' });
      }
      
      const aspirante = await Aspirante.findOne({ where: { firebase_uid: req.usuario.firebase_uid } });
      if (!aspirante) {
        return res.status(404).json({ success: false, error: 'Aspirante no encontrado en BD.' });
      }
      idAspirante = aspirante.id_aspirante;
    } else {
      idAspirante = parseInt(idAspirante);
    }

    if (isNaN(idAspirante)) {
      return res.status(400).json({ success: false, error: 'ID de aspirante inválido' });
    }

    // 2. Consulta con filtros y ordenamiento (Segura)
    const postulaciones = await MatchRecomendacion.findAll({
      where: {
        id_aspirante: idAspirante,
        // Agregado 'en_revision' para que coincida con tu frontend
        estado_postulacion: {
          [Op.in]: ['postulado', 'en_revision', 'entrevista', 'oferta', 'contratado', 'descartado']
        }
      },
      include: [
        {
          model: Vacante,
          as: 'vacante', // ⚠️ NOTA: Si te sigue dando error 500, borra esta línea de "as: 'vacante'"
          attributes: ['titulo', 'modalidad'],
          include: [{ 
            model: Empresa, 
            as: 'empresa', // ⚠️ NOTA: Igual aquí, si falla la BD, borra "as: 'empresa'"
            attributes: ['nombre'] 
          }]
        }
      ],
      // Cambiado a fecha_calculo que es tu campo seguro (createdAt puede fallar si lo desactivaste)
      order: [['fecha_calculo', 'DESC']] 
    });

    if (postulaciones.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: "Aún no tienes actividad en tus postulaciones. ¡Aplica a una vacante para comenzar!",
        data: []
      });
    }

    return res.json({
      success: true,
      count: postulaciones.length,
      data: postulaciones
    });

  } catch (error) {
    console.error('❌ Error 500 en getPostulaciones:', error);
    // Retornamos el detalle del error para que si vuelve a fallar, lo veas clarito en Network
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor', 
      detalle: error.message 
    });
  }
};



const getConsejoIA = async (req, res) => {
  try {
    const aspirante = await Aspirante.findOne({ 
      where: { firebase_uid: req.usuario.firebase_uid } 
    });
    
    if (!aspirante) {
      return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
    }
    
    if (aspirante.porcentaje_completitud < 100) {
      return res.status(403).json({ success: false, error: 'Perfil incompleto. Llena tu perfil al 100% para obtener consejos.' });
    }

    // Buscar vacantes recomendadas (cualquier estado, priorizando por score)
    const cachedRecs = await MatchRecomendacion.findAll({
      where: { 
        id_aspirante: aspirante.id_aspirante,
        estado_postulacion: { [require('sequelize').Op.in]: ['pendiente', 'interesado', 'postulado'] }
      },
      include: [{
        model: Vacante,
        as: 'vacante',
        where: { activa: true },
        include: [{ model: Empresa, as: 'empresa' }]
      }],
      order: [['score_compatibilidad', 'DESC']],
      limit: 3
    });

    // Si no hay en cache, generar recomendaciones frescas
    let recsParaConsejo = cachedRecs;
    if (cachedRecs.length === 0) {
      const { generateRecommendations } = require('../services/recommendation.service');
      const fresh = await generateRecommendations(aspirante.id_aspirante, 3);
      recsParaConsejo = fresh.map(r => ({ vacante: r.vacante }));
    }

    if (recsParaConsejo.length === 0) {
      return res.json({ success: true, consejo: "Aún no hay vacantes en el sistema que coincidan con tu perfil. Intenta más tarde." });
    }

    const topVacantes = recsParaConsejo.map(rec => ({
      titulo: rec.vacante.titulo,
      empresa_nombre: rec.vacante.empresa?.nombre,
      modalidad: rec.vacante.modalidad,
      salario_min: rec.vacante.salario_min,
      salario_max: rec.vacante.salario_max,
      habilidades_requeridas: rec.vacante.habilidades_requeridas
    }));

    const consejo = await aiService.getConsejoIA(aspirante, topVacantes);

    return res.json({ success: true, consejo });

  } catch (error) {
    console.error('Error en getConsejoIA:', error);
    return res.status(500).json({ success: false, error: 'Error interno al generar consejo de IA' });
  }
};

module.exports = {
  getRecomendaciones,
  getMatchScore,
  updatePostulacion,
  getPostulaciones,
  getConsejoIA
};
