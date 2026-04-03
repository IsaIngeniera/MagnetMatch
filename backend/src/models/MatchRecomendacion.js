const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MatchRecomendacion = sequelize.define('MatchRecomendacion', {
  id_match: {
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
  id_vacante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vacante',
      key: 'id_vacante'
    }
  },
  score_compatibilidad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  estado_postulacion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pendiente',
    validate: {
      isIn: [['pendiente', 'interesado', 'postulado', 'descartado', 'entrevista', 'oferta', 'contratado']]
    }
  },
  fecha_calculo: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'match_recomendacion',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_aspirante', 'id_vacante']
    }
  ]
});

module.exports = MatchRecomendacion;
