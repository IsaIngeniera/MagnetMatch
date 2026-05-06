const { 
  Aspirante, Experiencia, Educacion, Habilidad,
  AspiranteHabilidad, Logro, Mensaje 
} = require('../models');
const { 
  updateProfileCompleteness,
  calculateProfileCompleteness,
  getRecommendations
} = require('../services/profile.service');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const createAspirante = async (req, res) => {
  try {
    const { 
      nombres, apellidos, email, password, telefono,
      firebase_uid 
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son obligatorios' });
    }

    const existe = await Aspirante.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ success: false, error: 'El correo electrónico ya está registrado en la base de datos' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoAspirante = await Aspirante.create({
      nombres, apellidos, email,
      password: hashedPassword,
      telefono: telefono || null,
      firebase_uid,
      fecha_registro: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Perfil de aspirante creado exitosamente',
      data: { id: nuevoAspirante.id_aspirante, email: nuevoAspirante.email }
    });
  } catch (error) {
    console.error('Error en createAspirante:', error);
    return res.status(500).json({ success: false, error: 'Error interno al crear el perfil', detalles: error.message });
  }
};

const getAspiranteById = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;

    const aspirante = await Aspirante.findOne({
      where: { firebase_uid },
      include: [
        { model: Experiencia, as: 'experiencias' },
        { model: Educacion, as: 'educaciones' },
        { model: Logro, as: 'logros' }
      ]
    });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    const habilidades = await AspiranteHabilidad.findAll({
      where: { id_aspirante: aspirante.id_aspirante },
      include: [{ model: Habilidad }],
      order: [['anios_experiencia', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        ...aspirante.toJSON(),
        habilidades: habilidades.map(h => ({
          id_habilidad: h.id_habilidad,
          nivel: h.nivel,
          anios_experiencia: h.anios_experiencia,
          nombre: h.Habilidad.nombre,
          categoria: h.Habilidad.categoria
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getCompletitud = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    const completeness = await calculateProfileCompleteness(aspirante.id_aspirante);

    await Aspirante.update(
      { porcentaje_completitud: completeness.porcentaje },
      { where: { id_aspirante: aspirante.id_aspirante } }
    );

    return res.json({
      success: true,
      data: {
        porcentaje_total: completeness.porcentaje,
        detalles: completeness.detalles,
        recomendaciones: getRecommendations(completeness),
        mensaje: completeness.porcentaje < 100
          ? `Perfil al ${completeness.porcentaje}%`
          : '¡Perfil al 100%!'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateAspirante = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    // ✅ HU-Actualizar Perfil: se agregaron 'descripcion' y 'ubicacion'
    const camposPermitidos = [
      'nombres', 'apellidos', 'telefono',
      'expectativa_salarial', 'modalidad_preferida',
      'descripcion', 'ubicacion',
      'foto_url', 'cv_url'
    ];
    const datosAActualizar = {};
    Object.keys(req.body).forEach(key => {
      if (camposPermitidos.includes(key)) datosAActualizar[key] = req.body[key];
    });

    await aspirante.update(datosAActualizar);
    await updateProfileCompleteness(aspirante.id_aspirante);

    const actualizado = await Aspirante.findByPk(aspirante.id_aspirante);
    return res.json({ success: true, data: actualizado });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteAspirante = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    await Aspirante.destroy({ where: { firebase_uid } });
    return res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al eliminar' });
  }
};

const getMensajes = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'No encontrado' });

    const mensajes = await Mensaje.findAll({
      where: {
        [Op.or]: [
          { id_receptor: aspirante.id_aspirante },
          { id_emisor: aspirante.id_aspirante }
        ]
      },
      order: [['fecha_envio', 'DESC']]
    });

    return res.json({ success: true, data: mensajes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const marcarMensajeLeido = async (req, res) => {
  try {
    const { id_mensaje } = req.params;
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    const mensaje = await Mensaje.findOne({ where: { id_mensaje, id_receptor: aspirante.id_aspirante } });

    if (!mensaje) {
      const enviadoPorMi = await Mensaje.findOne({ where: { id_mensaje, id_emisor: aspirante.id_aspirante } });
      if (enviadoPorMi) {
        return res.json({ success: true, message: 'El mensaje fue enviado por el usuario, no se requiere marcar como leído.' });
      }
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }

    mensaje.leido = true;
    await mensaje.save();
    res.json({ success: true, message: 'Mensaje marcado como leído' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllAspirantes = async (req, res) => {
  try {
    const aspirantes = await Aspirante.findAll();
    res.json({ success: true, data: aspirantes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo.' });
    }

    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    const urlArchivo = `/uploads/cvs/${req.file.filename}`;
    await aspirante.update({ cv_url: urlArchivo });
    await updateProfileCompleteness(aspirante.id_aspirante);

    return res.json({
      success: true,
      message: '¡CV subido y guardado con éxito!',
      data: { nombre_archivo: req.file.originalname, ruta: urlArchivo }
    });
  } catch (error) {
    console.error('Error en uploadCV:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAspirante, getAspiranteById, updateAspirante,
  getCompletitud, deleteAspirante, getMensajes,
  marcarMensajeLeido, uploadCV, getAllAspirantes
};