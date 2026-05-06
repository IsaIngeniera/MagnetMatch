const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensaje.controller');
const { verificarToken } = require('../middleware/authMiddleware');

// Puedes añadir verificarToken si todas estas rutas deben estar protegidas
router.use(verificarToken);

// Obtener historial de mensajes de un usuario
router.get('/:id_usuario', mensajeController.obtenerMensajes);

// Enviar un mensaje nuevo
router.post('/', mensajeController.enviarMensaje);

// Eliminar una conversación completa (por asunto)
router.delete('/conversacion/:asunto', mensajeController.eliminarConversacion);

module.exports = router;
