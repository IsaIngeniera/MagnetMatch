#  MagnetMatch MVP

Portal web que mejora la experiencia de registro de candidatos y los conecta con vacantes laborales mediante un motor de recomendación basado en habilidades.

---

##  Descripción del Proyecto

MagnetMatch resuelve el problema del abandono en formularios de registro largos y repetitivos. El sistema guía al candidato paso a paso, guarda su perfil en una base de datos y utiliza un motor de recomendación para mostrarle las vacantes que mejor se ajustan a sus habilidades.

**Flujo principal:**
```
Registro → Login → Dashboard de vacantes recomendadas
```

---

## Tecnologías Usadas

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js  + TypeScript |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Autenticación | JWT + bcryptjs |
| Comunicación | Axios + CORS |
| Gestor de BD | pgAdmin 4 |

---

## 📁 Estructura de Carpetas

```
MVP/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Conexión a PostgreSQL
│   │   ├── controllers/
│   │   │   ├── authController.js  # Lógica de registro y login
│   │   │   └── vacantesController.js # Lógica de vacantes y recomendación
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # Verificación de JWT
│   │   └── routes/
│   │       ├── authRoutes.js      # Rutas de autenticación
│   │       └── vacantesRoutes.js  # Rutas de vacantes
│   ├── .env                       # Variables de entorno (no subir a GitHub)
│   ├── index.js                   # Servidor principal
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Página de bienvenida
│   │   ├── login/
│   │   │   └── page.tsx           # Página de login
│   │   ├── register/
│   │   │   └── page.tsx           # Página de registro
│   │   └── vacantes/
│   │       └── page.tsx           # Dashboard de vacantes
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Cómo Instalar y Correr el Proyecto

### Requisitos previos
- Node.js instalado
- PostgreSQL instalado y corriendo
- pgAdmin 4 (opcional)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/magneto-mvp.git
cd magneto-mvp
```

### 2. Configurar la base de datos
Abre pgAdmin y ejecuta:
```sql
CREATE DATABASE magneto_db;

CREATE TABLE candidatos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  habilidades TEXT
);

CREATE TABLE vacantes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(100),
  descripcion TEXT,
  habilidades_requeridas TEXT
);
```

### 3. Configurar el Backend
```bash
cd backend
npm install
```

Crea el archivo `.env` con:
```
PORT=4000
JWT_SECRET=magnetSecrtK
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=magneto_db
```

Corre el servidor:
```bash
node index.js
```
El backend corre en **http://localhost:4000**

### 4. Configurar el Frontend
```bash
cd frontend
npm install
npm run dev
```
El frontend corre en **http://localhost:3000**

---

## 🔗 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar candidato |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/vacantes` | Obtener todas las vacantes |
| GET | `/api/vacantes/recomendadas` | Vacantes recomendadas (requiere JWT) |

---

## 👥 Autores

- Wendy Atehortua
- Isabella Ocampo
- Isabella Cadavid
- Maria Laura Tafur
  
Proyecto desarrollado para la materia **Ingeniería de Software** — EAFIT · 2026
