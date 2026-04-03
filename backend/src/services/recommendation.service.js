const { Op } = require('sequelize');

const { 
  Aspirante, 
  Vacante, 
  Empresa, 
  Habilidad, 
  AspiranteHabilidad, 
  VacanteHabilidad,
  Experiencia,
  MatchRecomendacion 
} = require('../models');
const profileService = require('./profile.service'); // Importamos el service de completitud

// Weight configuration for match scoring
const WEIGHTS = {
  habilidades: 0.40,      // 40% - Skills matching
  experiencia: 0.25,      // 25% - Experience level
  salario: 0.20,          // 20% - Salary compatibility
  modalidad: 0.15         // 15% - Work modality match
};

const calculateMatchScore = async (idAspirante, idVacante) => {
  // 1. Get aspirante data (Agregamos validación de seguridad)
  const aspirante = await Aspirante.findByPk(idAspirante, {
    include: [{ model: Experiencia, as: 'experiencias' }]
  });

  if (!aspirante) return 0;

  // 2. Get aspirante skills
  const aspiranteSkills = await AspiranteHabilidad.findAll({
    where: { id_aspirante: idAspirante }
  });

  // 3. Get vacante data
  const vacante = await Vacante.findByPk(idVacante);
  if (!vacante) return 0;

  const vacanteSkills = await VacanteHabilidad.findAll({
    where: { id_vacante: idVacante }
  });

  // 4. Calculate scores (Mantenemos tu lógica intacta)
  const skillsScore = calculateSkillsScore(aspiranteSkills, vacanteSkills);
  const experienceScore = calculateExperienceScore(aspirante.experiencias || []);
  
  // Agregamos .toString() o parseFloat para evitar errores con tipos de datos de la DB
  const salaryScore = calculateSalaryScore(
    aspirante.expectativa_salarial,
    vacante.salario_min,
    vacante.salario_max
  );

  const modalityScore = calculateModalityScore(
    aspirante.modalidad_preferida,
    vacante.modalidad
  );

  const totalScore = 
    skillsScore * WEIGHTS.habilidades +
    experienceScore * WEIGHTS.experiencia +
    salaryScore * WEIGHTS.salario +
    modalityScore * WEIGHTS.modalidad;

  return Math.round(totalScore * 100) / 100;
};



const calculateSkillsScore = (aspiranteSkills, vacanteSkills) => {
  if (vacanteSkills.length === 0) return 50;
  const aspiranteSkillIds = new Set(aspiranteSkills.map(s => s.id_habilidad));
  const requiredSkills = vacanteSkills.filter(s => s.es_obligatoria);
  const optionalSkills = vacanteSkills.filter(s => !s.es_obligatoria);
  let requiredMatched = 0;
  let optionalMatched = 0;

  for (const skill of requiredSkills) {
    if (aspiranteSkillIds.has(skill.id_habilidad)) requiredMatched++;
  }
  for (const skill of optionalSkills) {
    if (aspiranteSkillIds.has(skill.id_habilidad)) optionalMatched++;
  }

  if (requiredSkills.length > 0 && requiredMatched === 0) return 20;

  const requiredScore = requiredSkills.length > 0 ? (requiredMatched / requiredSkills.length) * 70 : 35;
  const optionalScore = optionalSkills.length > 0 ? (optionalMatched / optionalSkills.length) * 30 : 15;
  return requiredScore + optionalScore;
};

const calculateExperienceScore = (experiencias) => {
  if (!experiencias || experiencias.length === 0) return 30;
  let totalYears = 0;
  for (const exp of experiencias) {
    const start = new Date(exp.fecha_inicio);
    const end = exp.fecha_fin ? new Date(exp.fecha_fin) : new Date();
    totalYears += (end - start) / (1000 * 60 * 60 * 24 * 365);
  }
  if (totalYears >= 5) return 100;
  if (totalYears >= 3) return 80;
  if (totalYears >= 1) return 60;
  return 30;
};

const calculateSalaryScore = (expectativa, salarioMin, salarioMax) => {
  if (!expectativa || (!salarioMin && !salarioMax)) return 50;
  const expNum = parseFloat(expectativa);
  const minNum = parseFloat(salarioMin || 0);
  const maxNum = parseFloat(salarioMax || 999999999);
  if (expNum >= minNum && expNum <= maxNum) return 100;
  return expNum < minNum ? 80 : 40;
};

const calculateModalityScore = (preferencia, vacanteModalidad) => {
  if (!preferencia || !vacanteModalidad) return 50;
  const pref = preferencia.toLowerCase();
  const vac = vacanteModalidad.toLowerCase();
  if (pref === vac) return 100;
  if (pref === 'híbrido' || vac === 'híbrido') return 70;
  return 30;
};

const generateRecommendations = async (idAspirante, limit = 10) => {
  // MODIFICACIÓN: Agregamos validación de existencia de vacantes
  const vacantes = await Vacante.findAll({
    where: { activa: true },
    include: [{ model: Empresa, as: 'empresa' }]
  });

  if (!vacantes || vacantes.length === 0) return [];

  const scoredVacantes = await Promise.all(
    vacantes.map(async (vacante) => {
      const score = await calculateMatchScore(idAspirante, vacante.id_vacante);
      return {
        id_vacante: vacante.id_vacante,
        score,
        vacante
      };
    })
  );

  return scoredVacantes
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
const saveMatch = async (idAspirante, idVacante, score, esPostulacion = false) => {
  
  // 1. Si el usuario intenta POSTULARSE (clic en el botón de aplicar)
  if (esPostulacion) {
    const { porcentaje } = await profileService.calculateProfileCompleteness(idAspirante);
    if (porcentaje < 100) {
      throw new Error('Debes tener tu perfil al 100% para postularte a esta vacante.');
    }
  }

  // 2. Buscar o crear el registro
  const [match, created] = await MatchRecomendacion.findOrCreate({
    where: { 
      id_aspirante: parseInt(idAspirante), 
      id_vacante: parseInt(idVacante) 
    },
    defaults: {
      score_compatibilidad: score,
      // Si es postulación, entra como 'postulado', si no, como 'pendiente'
      estado_postulacion: esPostulacion ? 'postulado' : 'pendiente',
      fecha_calculo: new Date()
    }
  });

  // 3. Si ya existía (ej. era una recomendación y ahora se postula)
  if (!created) {
    match.score_compatibilidad = score;
    match.fecha_calculo = new Date();
    
    // Si el usuario se está postulando ahora, actualizamos el estado
    if (esPostulacion) {
      match.estado_postulacion = 'postulado';
    }
    
    await match.save();
  }
  
  return match;
};

const getSkillMatchDetails = async (idAspirante, idVacante) => {
  const vacanteSkills = await VacanteHabilidad.findAll({
    where: { id_vacante: idVacante },
    include: [{ model: Habilidad }]
  });

  const aspiranteSkills = await AspiranteHabilidad.findAll({
    where: { id_aspirante: idAspirante }
  });

  const aspiranteSkillsMap = new Map(aspiranteSkills.map(s => [s.id_habilidad, s]));

  return vacanteSkills.map(vs => {
    const aspiranteSkill = aspiranteSkillsMap.get(vs.id_habilidad);
    return {
      id_habilidad: vs.id_habilidad,
      es_obligatoria: vs.es_obligatoria,
      nombre: vs.Habilidad?.nombre || 'Habilidad',
      tiene_habilidad: !!aspiranteSkill
    };
  });
};

module.exports = {
  calculateMatchScore,
  generateRecommendations,
  saveMatch,
  getSkillMatchDetails,
  WEIGHTS
};