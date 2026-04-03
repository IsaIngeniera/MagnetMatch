const express = require('express');
const router = express.Router();
// Importamos el controlador que tiene la lógica nueva de email/password
const aspiranteController = require('../controllers/aspirante.controller');
// Importamos el login (y cualquier otra cosa de auth que no sea el registro)
const { login } = require('../controllers/authController');
const admin = require('../config/firebase'); 
const { Aspirante } = require('../models'); 

// El registro ahora lo maneja el controlador de aspirante
router.post('/register', aspiranteController.createAspirante);

// El login sigue en su controlador original
router.post('/login', login);
// RUTA DE GOOGLE MODIFICADA
router.post('/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    let usuario = await Aspirante.findOne({ where: { firebase_uid: uid } });

    if (!usuario) {
      // Separar nombre y apellido para cumplir con NOT NULL
      const nombreCompleto = name ? name.split(' ') : ['Usuario', 'Google'];
      const nombre = nombreCompleto[0];
      const apellido = nombreCompleto.slice(1).join(' ') || 'Pendiente';

      usuario = await Aspirante.create({
        firebase_uid: uid,
        email: email,
        nombres: nombre,
        apellidos: apellido,
        password: 'GOOGLE_AUTH_USER',
        porcentaje_completitud: 10,
        fecha_registro: new Date(),
        telefono: '00000000', // Valor por defecto
        modalidad_preferida: 'remoto',
        expectativa_salarial: 0
      });
    }

    res.json({ 
      message: "Login exitoso", 
      token, 
      usuario 
    });
  } catch (error) {
    console.error("Error en Google Login:", error);
    res.status(401).json({ error: "Token inválido o error de DB" });
  }
});

module.exports = router;