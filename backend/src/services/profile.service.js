const { Aspirante, Experiencia, Educacion, AspiranteHabilidad, Logro, Habilidad } = require('../models');

/**
 * Calculate profile completeness percentage
 * @param {number} idAspirante 
 * @returns {Promise<{porcentaje: number, detalles: object}>}
 */
const calculateProfileCompleteness = async (idAspirante) => {
  const aspirante = await Aspirante.findByPk(idAspirante, {
    include: [
      { model: Experiencia, as: 'experiencias' },
      { model: Educacion, as: 'educaciones' },
      { model: Logro, as: 'logros' },
      {
        model: Habilidad,
        as: 'habilidades',
        through: { attributes: ['nivel', 'anios_experiencia'] }
      }
    ]
  });

  if (!aspirante) {
    return { porcentaje: 0, detalles: {} };
  }

  // Pesos de cada sección (suman 100)
  const WEIGHTS = {
    datos_basicos: 20,
    experiencia: 20,
    educacion: 20,
    habilidades: 20,
    logros: 10,
    cv: 10
  };

  const detalles = {
    // Datos básicos: deben estar todos completos
    datos_basicos: !!(
      aspirante.nombres &&
      aspirante.apellidos &&
      aspirante.telefono &&
      aspirante.expectativa_salarial &&
      aspirante.modalidad_preferida
    ),
    // Al menos 1 experiencia
    experiencia: !!(aspirante.experiencias && aspirante.experiencias.length > 0),
    // Al menos 1 educación
    educacion: !!(aspirante.educaciones && aspirante.educaciones.length > 0),
    // Al menos 3 habilidades con nivel y años de experiencia completados
    habilidades: (aspirante.habilidades || []).filter(h => {
      const data = h.AspiranteHabilidad;
      return data &&
             data.nivel !== null &&
             data.nivel !== '' &&
             data.anios_experiencia !== null;
    }).length >= 3,
    // Al menos 1 logro
    logros: !!(aspirante.logros && aspirante.logros.length > 0),
    // CV subido
    cv: !!aspirante.cv_url
  };

  // Sumar solo las secciones completadas
  let porcentaje = 0;
  if (detalles.datos_basicos) porcentaje += WEIGHTS.datos_basicos;
  if (detalles.experiencia)   porcentaje += WEIGHTS.experiencia;
  if (detalles.educacion)     porcentaje += WEIGHTS.educacion;
  if (detalles.habilidades)   porcentaje += WEIGHTS.habilidades;
  if (detalles.logros)        porcentaje += WEIGHTS.logros;
  if (detalles.cv)            porcentaje += WEIGHTS.cv;

  return { porcentaje, detalles };
};

/**
 * Update profile completeness in database
 * @param {number} idAspirante 
 * @returns {Promise<{porcentaje: number, detalles: object}>}
 */
const updateProfileCompleteness = async (idAspirante) => {
  // ✅ FIX: detalles ahora sí está en scope
  const { porcentaje, detalles } = await calculateProfileCompleteness(idAspirante);

  await Aspirante.update(
    { porcentaje_completitud: porcentaje },
    { where: { id_aspirante: idAspirante } }
  );

  console.log(`[Completitud] Aspirante ${idAspirante}: ${porcentaje}%`, detalles);
  return { porcentaje, detalles };
};

/**
 * Get profile recommendations based on completeness
 * @param {object} completeness 
 * @returns {string[]}
 */
const getRecommendations = (completeness) => {
  const recommendations = [];

  if (!completeness.detalles.datos_basicos) {
    recommendations.push('Completa tus datos básicos: teléfono, expectativa salarial y modalidad preferida (+20%)');
  }
  if (!completeness.detalles.experiencia) {
    recommendations.push('Agrega al menos una experiencia laboral (+25%)');
  }
  if (!completeness.detalles.educacion) {
    recommendations.push('Agrega al menos un registro de educación (+25%)');
  }
  if (!completeness.detalles.habilidades) {
    recommendations.push('Agrega al menos 3 habilidades con nivel y años de experiencia (+20%)');
  }
  if (!completeness.detalles.logros) {
    recommendations.push('Agrega al menos un logro o certificación (+10%)');
  }
  if (!completeness.detalles.cv) {
    recommendations.push('Sube tu Hoja de Vida (CV) en formato PDF en la sección de Perfil (+10%)');
  }

  if (recommendations.length === 0) {
    recommendations.push('¡Tu perfil está completo! Estás listo para recibir recomendaciones de empleo.');
  }

  return recommendations;
};

module.exports = {
  calculateProfileCompleteness,
  updateProfileCompleteness,
  getRecommendations
};