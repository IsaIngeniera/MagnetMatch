const { Pool } = require('pg');
//EXPORTA A PG QUE CONECTA CON LA BD
require('dotenv').config();

const pool = new Pool({
    //SON LOS DATOS DE LA CONEXION DEL DB QUE TENEMOS EN ENV
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;