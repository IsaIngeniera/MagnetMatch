const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VacanteHabilidad = sequelize.define('VacanteHabilidad', {
  id_vacante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'vacante',
      key: 'id_vacante'
    }
  },
  id_habilidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'habilidad',
      key: 'id_habilidad'
    }
  },
  es_obligatoria: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'vacante_habilidad',
  timestamps: false
});

module.exports = VacanteHabilidad;
