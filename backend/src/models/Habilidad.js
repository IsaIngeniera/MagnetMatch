const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Habilidad = sequelize.define('Habilidad', {
  id_habilidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'habilidad',
  timestamps: false
});

module.exports = Habilidad;
