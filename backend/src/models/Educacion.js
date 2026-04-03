const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Educacion = sequelize.define('Educacion', {
  id_educacion: {
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
  institucion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['en_curso', 'completado', 'abandonado']]
    }
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'educacion',
  timestamps: false
});

module.exports = Educacion;
