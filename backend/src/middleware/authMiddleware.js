const admin = require('../config/firebase');

const verificarToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó un token válido' });
  }

  // LIMPIEZA DE TOKEN: Quitamos comillas extras que puedan venir del localStorage
  const token = authHeader.split(' ')[1].replace(/"/g, '');

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Sesión expirada o token vacío' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.usuario = {
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
      rol: 'aspirante' 
    };

    console.log(`[AUTH] Usuario verificado: ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error('❌ Error de Firebase al verificar token:', error.message);
    res.status(403).json({ error: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
  }
};

module.exports = { verificarToken };