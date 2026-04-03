const { 
  Aspirante, 
  Experiencia, 
  Educacion, 
  Habilidad, 
  AspiranteHabilidad, 
  Logro, 
  Mensaje 
} = require('../models');
const { updateProfileCompleteness } = require('../services/profile.service');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

/**
 * POST /api/aspirantes
 * HU-01: Registro de nuevo aspirante (Sincronizado con Firebase)
 */
const createAspirante = async (req, res) => {
  try {
    const { 
      nombres, 
      apellidos, 
      email, 
      password, 
      telefono, 
      firebase_uid,
      expectativa_salarial,
      modalidad_preferida 
    } = req.body;

    // 1. Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email y contraseña son obligatorios' 
      });
    }

    // 2. Verificar si el email ya existe en Postgres
    const existe = await Aspirante.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ 
        success: false, 
        error: 'El correo electrónico ya está registrado en la base de datos' 
      });
    }

    // 3. Seguridad: Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Crear registro en la tabla 'aspirante'
    const nuevoAspirante = await Aspirante.create({
      nombres,
      apellidos,
      email, // Coincide con tu modelo y DB
      password: hashedPassword,
      telefono: telefono || null,
      expectativa_salarial: expectativa_salarial || null,
      modalidad_preferida: modalidad_preferida || 'remoto',
      firebase_uid: firebase_uid,
      fecha_registro: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Perfil de aspirante creado exitosamente',
      data: {
        id: nuevoAspirante.id_aspirante,
        email: nuevoAspirante.email
      }
    });

  } catch (error) {
    console.error('Error en createAspirante:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al crear el perfil',
      detalles: error.message
    });
  }
};

/**
 * GET /api/aspirantes/perfil
 * HU-04: Ver perfil completo
 */
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

    if (!aspirante) {
      return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
    }

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

/**
 * GET /api/aspirantes/completitud
 */
const getCompletitud = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ 
      where: { firebase_uid },
      include: [{ model: Experiencia, as: 'experiencias' }] 
    });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    const porcentaje = aspirante.getProgreso(); 

    return res.json({
      success: true,
      data: {
        porcentaje_total: porcentaje,
        mensaje: porcentaje < 100 ? `Perfil al ${porcentaje}%` : "¡Perfil al 100%!",
        recomendaciones: {
          experiencia: (aspirante.experiencias?.length > 0) ? "✅ Experiencia cargada" : "💡 Agrega experiencia",
          bio: aspirante.descripcion ? "✅ Descripción completa" : "💡 Agrega una descripción"
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/aspirantes/perfil
 */
const updateAspirante = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });

    const camposPermitidos = ['nombres', 'apellidos', 'telefono', 'expectativa_salarial', 'modalidad_preferida', 'descripcion', 'foto_url'];
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

/**
 * DELETE /api/aspirantes/perfil
 */
const deleteAspirante = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    await Aspirante.destroy({ where: { firebase_uid } });
    return res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al eliminar' });
  }
};

/**
 * GET /api/aspirantes/mensajes
 */
const getMensajes = async (req, res) => {
  try {
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) return res.status(404).json({ success: false, error: 'No encontrado' });

    const mensajes = await Mensaje.findAll({
      where: { id_receptor: aspirante.id_aspirante },
      order: [['fecha_envio', 'DESC']]
    });

    return res.json({ success: true, data: mensajes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/aspirantes/mensajes/:id_mensaje/leido
 */
const marcarMensajeLeido = async (req, res) => {
  try {
    const { id_mensaje } = req.params;
    const id_aspirante = req.usuario.id_aspirante;

    const mensaje = await Mensaje.findOne({ 
      where: { id_mensaje, id_receptor: id_aspirante } 
    });

    if (!mensaje) return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });

    mensaje.leido = true;
    await mensaje.save();

    res.json({ success: true, message: 'Mensaje marcado como leído' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Añadir al final de aspirante.controller.js
const getAllAspirantes = async (req, res) => {
  try {
    const aspirantes = await Aspirante.findAll();
    res.json({ success: true, data: aspirantes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
/**
 * POST /api/aspirantes/me/upload-cv
 * HU-05: Subir hoja de vida en PDF
 */
const uploadCV = async (req, res) => {
  try {
    // 1. Verificar si multer subió el archivo
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se recibió ningún archivo. Asegúrate de enviarlo como "cv" en el form-data.' 
      });
    }

    // 2. Obtener el aspirante desde el token (verificarToken)
    const firebase_uid = req.usuario.firebase_uid;
    const aspirante = await Aspirante.findOne({ where: { firebase_uid } });

    if (!aspirante) {
      return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
    }

    // 3. Generar la URL o ruta del archivo
    // 'req.file.filename' es el nombre que multer le dio al archivo en la carpeta uploads
    const urlArchivo = `/uploads/cvs/${req.file.filename}`;

    // 4. Actualizar el campo cv_url en la base de datos
    await aspirante.update({ cv_url: urlArchivo });

    // 5. Opcional: Actualizar el progreso del perfil automáticamente
    await updateProfileCompleteness(aspirante.id_aspirante);

    return res.json({
      success: true,
      message: '¡CV subido y guardado con éxito!',
      data: {
        nombre_archivo: req.file.originalname,
        ruta: urlArchivo
      }
    });
  } catch (error) {
    console.error('Error en uploadCV:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};




module.exports = {
  createAspirante,
  getAspiranteById,
  updateAspirante,
  getCompletitud,
  deleteAspirante,
  getMensajes,
  marcarMensajeLeido,
  uploadCV,
  getAllAspirantes
};