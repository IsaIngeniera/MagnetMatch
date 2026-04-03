const { Aspirante, Experiencia, Educacion, AspiranteHabilidad, Logro } = require('../models');

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
      { model: Logro, as: 'logros' }
    ]
  });

  if (!aspirante) {
    return { porcentaje: 0, detalles: {} };
  }

  const habilidades = await AspiranteHabilidad.count({
    where: { id_aspirante: idAspirante }
  });

  // Weights for each section
  const WEIGHTS = {
    datos_basicos: 20,    // nombres, apellidos, telefono, expectativa_salarial, modalidad_preferida
    experiencia: 25,       // At least 1 experience
    educacion: 25,         // At least 1 education
    habilidades: 20,       // At least 3 skills
    logros: 10             // At least 1 achievement
  };

  const detalles = {
    datos_basicos: !!(
      aspirante.nombres &&
      aspirante.apellidos &&
      aspirante.telefono &&
      aspirante.expectativa_salarial &&
      aspirante.modalidad_preferida
    ),
    experiencia: aspirante.experiencias && aspirante.experiencias.length > 0,
    educacion: aspirante.educaciones && aspirante.educaciones.length > 0,
    habilidades: habilidades >= 3,
    logros: aspirante.logros && aspirante.logros.length > 0
  };

  let porcentaje = 0;
  if (detalles.datos_basicos) porcentaje += WEIGHTS.datos_basicos;
  if (detalles.experiencia) porcentaje += WEIGHTS.experiencia;
  if (detalles.educacion) porcentaje += WEIGHTS.educacion;
  if (detalles.habilidades) porcentaje += WEIGHTS.habilidades;
  if (detalles.logros) porcentaje += WEIGHTS.logros;

  return { porcentaje, detalles };
};

/**
 * Update profile completeness in database
 * @param {number} idAspirante 
 * @returns {Promise<number>} new percentage
 */
const updateProfileCompleteness = async (idAspirante) => {
  const { porcentaje } = await calculateProfileCompleteness(idAspirante);
  
  await Aspirante.update(
    { porcentaje_completitud: porcentaje },
    { where: { id_aspirante: idAspirante } }
  );

  return porcentaje;
};

/**
 * Get profile recommendations based on completeness
 * @param {object} completeness 
 * @returns {string[]}
 */
const getRecommendations = (completeness) => {
  const recommendations = [];

  if (!completeness.detalles.datos_basicos) {
    recommendations.push(
      'Completa tus datos básicos: teléfono, expectativa salarial y modalidad preferida (+20%)'
    );
  }

  if (!completeness.detalles.experiencia) {
    recommendations.push('Agrega al menos una experiencia laboral (+25%)');
  }

  if (!completeness.detalles.educacion) {
    recommendations.push('Agrega al menos un registro de educación (+25%)');
  }

  if (!completeness.detalles.habilidades) {
    recommendations.push('Agrega al menos 3 habilidades a tu perfil (+20%)');
  }

  if (!completeness.detalles.logros) {
    recommendations.push('Agrega al menos un logro o certificación (+10%)');
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
