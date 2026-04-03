const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cvs/'); // La carpeta que creaste
  },
  filename: (req, file, cb) => {
    // Nombre único: cv-ID-fecha.pdf
    const userId = req.usuario?.id_aspirante || 'unknown';
    cb(null, `cv-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtros de validación (Criterios de Aceptación)
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: El archivo debe ser un PDF válido.'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB (HU-5)
  fileFilter: fileFilter
});

module.exports = upload;