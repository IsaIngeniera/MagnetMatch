const { sequelize } = require('../config/database');

// Import all models
const Aspirante = require('./Aspirante');
const Empresa = require('./Empresa');
const Experiencia = require('./Experiencia');
const Educacion = require('./Educacion');
const Habilidad = require('./Habilidad');
const AspiranteHabilidad = require('./AspiranteHabilidad');
const Logro = require('./Logro');
const Vacante = require('./Vacante');
const VacanteHabilidad = require('./VacanteHabilidad');
const MatchRecomendacion = require('./MatchRecomendacion');
const Mensaje = require('./Mensaje');
// =============================================
// Define Associations
// =============================================

// Aspirante -> Experiencia (1:N)
Aspirante.hasMany(Experiencia, {
  foreignKey: 'id_aspirante',
  as: 'experiencias',
  onDelete: 'CASCADE'
});
Experiencia.belongsTo(Aspirante, {
  foreignKey: 'id_aspirante',
  as: 'aspirante'
});

// Aspirante -> Educacion (1:N)
Aspirante.hasMany(Educacion, {
  foreignKey: 'id_aspirante',
  as: 'educaciones',
  onDelete: 'CASCADE'
});
Educacion.belongsTo(Aspirante, {
  foreignKey: 'id_aspirante',
  as: 'aspirante'
});

// Aspirante -> Logro (1:N)
Aspirante.hasMany(Logro, {
  foreignKey: 'id_aspirante',
  as: 'logros',
  onDelete: 'CASCADE'
});
Logro.belongsTo(Aspirante, {
  foreignKey: 'id_aspirante',
  as: 'aspirante'
});

// Aspirante <-> Habilidad (N:M through AspiranteHabilidad)
Aspirante.belongsToMany(Habilidad, {
  through: AspiranteHabilidad,
  foreignKey: 'id_aspirante',
  otherKey: 'id_habilidad',
  as: 'habilidades'
});
Habilidad.belongsToMany(Aspirante, {
  through: AspiranteHabilidad,
  foreignKey: 'id_habilidad',
  otherKey: 'id_aspirante',
  as: 'aspirantes'
});

// Direct associations for AspiranteHabilidad
AspiranteHabilidad.belongsTo(Aspirante, {
  foreignKey: 'id_aspirante'
});
AspiranteHabilidad.belongsTo(Habilidad, {
  foreignKey: 'id_habilidad'
});

// Empresa -> Vacante (1:N)
Empresa.hasMany(Vacante, {
  foreignKey: 'id_empresa',
  as: 'vacantes',
  onDelete: 'CASCADE'
});
Vacante.belongsTo(Empresa, {
  foreignKey: 'id_empresa',
  as: 'empresa'
});

// Vacante <-> Habilidad (N:M through VacanteHabilidad)
Vacante.belongsToMany(Habilidad, {
  through: VacanteHabilidad,
  foreignKey: 'id_vacante',
  otherKey: 'id_habilidad',
  as: 'habilidades'
});
Habilidad.belongsToMany(Vacante, {
  through: VacanteHabilidad,
  foreignKey: 'id_habilidad',
  otherKey: 'id_vacante',
  as: 'vacantes'
});

// Direct associations for VacanteHabilidad
VacanteHabilidad.belongsTo(Vacante, {
  foreignKey: 'id_vacante'
});
VacanteHabilidad.belongsTo(Habilidad, {
  foreignKey: 'id_habilidad'
});

// MatchRecomendacion associations
Aspirante.hasMany(MatchRecomendacion, {
  foreignKey: 'id_aspirante',
  as: 'matches',
  onDelete: 'CASCADE'
});
MatchRecomendacion.belongsTo(Aspirante, {
  foreignKey: 'id_aspirante',
  as: 'aspirante'
});

Vacante.hasMany(MatchRecomendacion, {
  foreignKey: 'id_vacante',
  as: 'matches',
  onDelete: 'CASCADE'
});
MatchRecomendacion.belongsTo(Vacante, {
  foreignKey: 'id_vacante',
  as: 'vacante'
});

//Mensajes association
Aspirante.hasMany(Mensaje, { foreignKey: 'id_receptor', as: 'mensajes' });
Mensaje.belongsTo(Aspirante, { foreignKey: 'id_receptor', as: 'receptor' });

module.exports = {
  sequelize,
  Aspirante,
  Empresa,
  Experiencia,
  Educacion,
  Habilidad,
  AspiranteHabilidad,
  Logro,
  Vacante,
  VacanteHabilidad,
  MatchRecomendacion,
  Mensaje
};
