const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vacante = sequelize.define('Vacante', {
  id_vacante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'empresa', key: 'id_empresa' }
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  salario_min: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  salario_max: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  modalidad: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: { isIn: [['remoto', 'híbrido', 'presencial']] }
  },
  fecha_publicacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  // ✅ HU-10: porcentaje mínimo requerido (migración ya existe en la BD)
  porcentaje_minimo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  }
}, {
  tableName: 'vacante',
  timestamps: false
});

module.exports = Vacante;