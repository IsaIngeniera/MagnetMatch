const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Logro = sequelize.define('Logro', {
  id_logro: {
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
  titulo_logro: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  url_credencial: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  verificado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'logro',
  timestamps: false
});

module.exports = Logro;
