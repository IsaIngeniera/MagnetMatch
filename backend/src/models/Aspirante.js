const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Aspirante = sequelize.define('Aspirante', {
  id_aspirante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firebase_uid: {
    type: DataTypes.STRING(128),
    allowNull: true,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  expectativa_salarial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  modalidad_preferida: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: { isIn: [['remoto', 'híbrido', 'presencial']] }
  },
  porcentaje_completitud: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cv_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // ✅ HU-Actualizar Perfil: nuevos campos (migración ya existe en la BD)
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ubicacion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'aspirante',
  timestamps: false,
  freezeTableName: true
});

module.exports = Aspirante;