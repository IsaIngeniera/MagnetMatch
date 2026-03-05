const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  const { nombre, email, password, habilidades } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO candidatos (nombre, email, password, habilidades) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, hashedPassword, habilidades]
    );
    res.json({ mensaje: 'Candidato registrado!', candidato: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM candidatos WHERE email = $1', [email]);
    const candidato = result.rows[0];

    if (!candidato) return res.status(404).json({ error: 'Candidato no encontrado' });

    const passwordValida = await bcrypt.compare(password, candidato.password);
    if (!passwordValida) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
  { id: candidato.id, email: candidato.email, habilidades: candidato.habilidades },
  process.env.JWT_SECRET
);
res.json({ mensaje: 'Login exitoso!', token });
} catch (error) {
res.status(500).json({ error: error.message });
}
};

module.exports = { register, login };