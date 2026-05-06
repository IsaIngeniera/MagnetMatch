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
const profileService = require('./profile.service');

const aiService = require('./ai.service');

const WEIGHTS = {
  habilidades: 0.30,
  experiencia: 0.20,
  texto_ia: 0.30,
  salario: 0.10,
  ubicacion: 0.10
};

const calculateMatchScore = async (idAspirante, idVacante) => {
  const aspirante = await Aspirante.findByPk(idAspirante, {
    include: [{ model: Experiencia, as: 'experiencias' }]
  });
  if (!aspirante) return 0;

  const aspiranteSkills = await AspiranteHabilidad.findAll({ where: { id_aspirante: idAspirante } });
  const vacante = await Vacante.findByPk(idVacante);
  if (!vacante) return 0;

  const vacanteSkills = await VacanteHabilidad.findAll({ where: { id_vacante: idVacante } });

  const skillsScore = calculateSkillsScore(aspiranteSkills, vacanteSkills);
  const experienceScore = calculateExperienceScore(aspirante.experiencias || []);
  const salaryScore = calculateSalaryScore(aspirante.expectativa_salarial, vacante.salario_min, vacante.salario_max);
  const locationScore = calculateLocationScore(aspirante.ubicacion, vacante.modalidad);
  const aiScore = await aiService.getSemanticMatchScore(aspirante.descripcion, vacante.descripcion, aspirante.ubicacion);

  const totalScore =
    skillsScore * WEIGHTS.habilidades +
    experienceScore * WEIGHTS.experiencia +
    aiScore * WEIGHTS.texto_ia +
    salaryScore * WEIGHTS.salario +
    locationScore * WEIGHTS.ubicacion;

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

const calculateLocationScore = (aspiranteUbicacion, vacanteModalidad) => {
  if (!aspiranteUbicacion || !vacanteModalidad) return 50;
  const ubicacion = aspiranteUbicacion.toLowerCase();
  const vacanteMod = vacanteModalidad.toLowerCase();
  
  if (vacanteMod === 'remoto') return 100; // Remoto es 100% compatible con cualquier ubicación
  
  // Si la vacante es presencial o híbrida, la IA ya penalizará si la ubicación no coincide,
  // pero podemos hacer una lógica simple aquí si la modalidad la incluye en el texto:
  if (ubicacion.includes(vacanteMod) || vacanteMod.includes('híbrido')) return 70;
  
  return 30;
};

const generateRecommendations = async (idAspirante, limit = 10) => {
  const vacantes = await Vacante.findAll({
    where: { activa: true },
    include: [{ model: Empresa, as: 'empresa' }]
  });

  if (!vacantes || vacantes.length === 0) {
    console.log("⚠️ No se encontraron vacantes en la base de datos.");
    return [];
  }

  const scoredVacantes = await Promise.all(
    vacantes.map(async (vacante) => {
      const score = await calculateMatchScore(idAspirante, vacante.id_vacante);
      await saveMatch(idAspirante, vacante.id_vacante, score);
      return {
        id_vacante: vacante.id_vacante,
        score,
        score_compatibilidad: Math.round(score * 100),
        vacante: vacante.get({ plain: true })
      };
    })
  );

  const recommendations = scoredVacantes
    .filter(item => item.score >= 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  console.log(`✅ Generadas ${recommendations.length} recomendaciones para el aspirante ${idAspirante}`);
  return recommendations;
};

/**
 * ✅ FIX: saveMatch nunca sobreescribe estado_postulacion si ya tiene un estado real.
 * Solo crea el registro con 'pendiente' si es nuevo.
 * Si ya existe, solo actualiza score y fecha — el estado lo maneja únicamente updatePostulacion.
 */
const saveMatch = async (idAspirante, idVacante, score, esPostulacion = false) => {
  if (esPostulacion) {
    const { porcentaje } = await profileService.calculateProfileCompleteness(idAspirante);
    if (porcentaje < 100) {
      throw new Error('Debes tener tu perfil al 100% para postularte a esta vacante.');
    }
  }

  const [match, created] = await MatchRecomendacion.findOrCreate({
    where: {
      id_aspirante: parseInt(idAspirante),
      id_vacante: parseInt(idVacante)
    },
    defaults: {
      score_compatibilidad: score,
      // 'pendiente' solo se asigna al CREAR el registro por primera vez
      estado_postulacion: esPostulacion ? 'postulado' : 'pendiente',
      fecha_calculo: new Date()
    }
  });

  if (!created) {
    // ✅ NUNCA tocar estado_postulacion aquí — solo actualizar el score
    // Si el usuario ya se postuló (estado = 'postulado'), ese estado se preserva
    match.score_compatibilidad = score;
    match.fecha_calculo = new Date();

    // Solo si es una postulación explícita, actualizar el estado
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