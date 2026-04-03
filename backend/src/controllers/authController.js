const { Aspirante } = require('../models'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase'); 
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { nombres, apellidos, email, password, firebase_uid } = req.body;

    // Validación rápida para evitar esperas innecesarias
    if (!email || !password || !firebase_uid) {
      return res.status(400).json({ success: false, mensaje: 'Faltan datos obligatorios' });
    }

    const existe = await Aspirante.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ success: false, mensaje: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoAspirante = await Aspirante.create({
      ...req.body,
      password: hashedPassword,
      fecha_registro: new Date()
    });

    // Siempre retornar una respuesta
    return res.status(201).json({ 
      success: true,
      mensaje: '¡Aspirante registrado con éxito!', 
      candidato: nuevoAspirante 
    });

  } catch (error) {
    console.error('Error en el registro:', error);
    // Si hay error, hay que avisar al frontend para que deje de cargar
    return res.status(500).json({ success: false, mensaje: 'Error interno', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({ success: false, error: 'Email o Token requerido' });
    }

    let usuario;

    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      usuario = await Aspirante.findOne({ where: { firebase_uid: decodedToken.uid } });
    } else {
      usuario = await Aspirante.findOne({ where: { email } });
      if (usuario && password) {
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) usuario = null;
      }
    }

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    return res.json({
      success: true,
      usuario: { id: usuario.id_aspirante, nombre: usuario.nombres, email: usuario.email }
    });

  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

module.exports = { register, login };