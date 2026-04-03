const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Experiencia = sequelize.define('Experiencia', {
  id_experiencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_aspirante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'aspirante',
      key: 'id_aspirante'
    }
  },
  cargo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  empresa: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  descripcion_logros: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'experiencia',
  timestamps: false
});

module.exports = Experiencia;
