const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const vacantesRoutes = require('./src/routes/vacantesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use('/api/auth', authRoutes);
app.use('/api/vacantes', vacantesRoutes);

app.get('/', (req, res) => {
  res.send('API Magneto funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});