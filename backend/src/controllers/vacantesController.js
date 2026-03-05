const pool = require('../config/db');

const obtenerVacantes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vacantes');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recomendarVacantes = async (req, res) => {
  const { habilidades } = req.usuario;

  try {
    const result = await pool.query('SELECT * FROM vacantes');
    const vacantes = result.rows;

    const recomendadas = vacantes.filter(vacante =>
      habilidades.split(',').some(habilidad =>
        vacante.habilidades_requeridas.toLowerCase().includes(habilidad.trim().toLowerCase())
      )
    );

    res.json({ recomendadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { obtenerVacantes, recomendarVacantes };