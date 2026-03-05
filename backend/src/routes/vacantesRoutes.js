const express = require('express');
const router = express.Router();
const { obtenerVacantes, recomendarVacantes } = require('../controllers/vacantesController');
const verificarToken = require('../middleware/authMiddleware');

router.get('/', obtenerVacantes);
router.get('/recomendadas', verificarToken, recomendarVacantes);

module.exports = router;