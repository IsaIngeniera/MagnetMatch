const { Mensaje, Aspirante } = require('../models');
const { Op } = require('sequelize');

// Obtener el historial de mensajes de un usuario
const obtenerMensajes = async (req, res) => {
  try {
    // asumiendo que usamos el id del usuario logueado o el pasado en parametros
    // como este es un sistema genérico entre aspirante-empresa o aspirante-aspirante,
    // usaremos el id_usuario del parámetro
    const { id_usuario } = req.params;

    const mensajes = await Mensaje.findAll({
      where: {
        [Op.or]: [
          { id_receptor: id_usuario },
          { id_emisor: id_usuario }
        ]
      },
      order: [['fecha_envio', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: mensajes
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al obtener los mensajes.',
      error: error.message
    });
  }
};

// Enviar un nuevo mensaje
const enviarMensaje = async (req, res) => {
  try {
    // Si usas el middleware de autenticación, id_emisor se podría sacar de req.usuario.
    // De momento lo permitimos por body para coincidir con la recomendación.
    const { id_receptor, id_emisor, asunto, contenido } = req.body;

    if (!id_receptor || !contenido) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios (receptor o contenido).'
      });
    }

    // Aquí validamos que tengamos id_emisor (si no viene del token)
    let emisorReal = id_emisor;
    if (!emisorReal && req.usuario && req.usuario.firebase_uid) {
      const aspirante = await Aspirante.findOne({ where: { firebase_uid: req.usuario.firebase_uid } });
      if (aspirante) {
        emisorReal = aspirante.id_aspirante;
      }
    }

    if (!emisorReal) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar el emisor del mensaje.'
      });
    }

    const nuevoMensaje = await Mensaje.create({
      id_receptor,
      id_emisor: emisorReal,
      asunto: asunto || 'Sin asunto',
      contenido,
      leido: false,
      fecha_envio: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente.',
      data: nuevoMensaje
    });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el envío del mensaje.',
      error: error.message
    });
  }
};

// Eliminar toda una conversación por asunto
const eliminarConversacion = async (req, res) => {
  try {
    const { asunto } = req.params;
    
    let emisorReal = null;
    if (req.usuario && req.usuario.firebase_uid) {
      const aspirante = await Aspirante.findOne({ where: { firebase_uid: req.usuario.firebase_uid } });
      if (aspirante) {
        emisorReal = aspirante.id_aspirante;
      }
    }

    if (!emisorReal) {
      return res.status(400).json({ success: false, message: 'No se pudo identificar al usuario para la eliminación.' });
    }

    await Mensaje.destroy({
      where: {
        asunto: asunto,
        [Op.or]: [
          { id_emisor: emisorReal },
          { id_receptor: emisorReal }
        ]
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Conversación eliminada correctamente.'
    });

  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la conversación.',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMensajes,
  enviarMensaje,
  eliminarConversacion
};
