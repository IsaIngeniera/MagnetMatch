const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AspiranteHabilidad = sequelize.define('AspiranteHabilidad', {
  id_aspirante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'aspirante',
      key: 'id_aspirante'
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
  nivel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['básico', 'intermedio', 'avanzado', 'experto']]
    }
  },
  anios_experiencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'aspirante_habilidad',
  timestamps: false
});

module.exports = AspiranteHabilidad;
