const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 

const Mensaje = sequelize.define('Mensaje', {
    id_mensaje: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_receptor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    asunto: DataTypes.STRING,
    contenido: DataTypes.TEXT,
    leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fecha_envio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'mensaje',
    timestamps: false
});

module.exports = Mensaje;