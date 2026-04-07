# 🧲 MagnetMatch MVP

Portal web que mejora la experiencia de registro de candidatos y los conecta con vacantes laborales mediante un motor de recomendación basado en habilidades.

---

## 📌 Descripción del Proyecto

MagnetMatch resuelve el problema del abandono en formularios de registro largos y repetitivos. El sistema guía al candidato paso a paso, guarda su perfil en una base de datos y utiliza un motor de recomendación para mostrarle las vacantes que mejor se ajustan a sus habilidades.

**Flujo principal:**

```
Registro → Login → Dashboard de vacantes recomendadas
```

---

## 🛠️ Tecnologías Usadas

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js + TypeScript |
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
│   │   │   ├── database.js                    # Conexión a PostgreSQL (Sequelize)
│   │   │   └── firebase.js                    # Configuración de Firebase Storage
│   │   │
│   │   ├── controllers/
│   │   │   ├── aspirante.controller.js        # CRUD del perfil del aspirante
│   │   │   ├── authController.js              # Registro y login
│   │   │   ├── educacion.controller.js        # Gestión de educación
│   │   │   ├── experiencia.controller.js      # Gestión de experiencia laboral
│   │   │   ├── habilidad.controller.js        # Gestión de habilidades
│   │   │   ├── logro.controller.js            # Gestión de logros
│   │   │   ├── match.controller.js            # Motor de recomendación / match
│   │   │   └── vacante.controller.js          # Gestión de vacantes
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js              # Verificación de JWT
│   │   │   └── uploadMiddleware.js            # Manejo de subida de archivos
│   │   │
│   │   ├── models/
│   │   │   ├── Aspirante.js                   # Modelo del candidato
│   │   │   ├── AspiranteHabilidad.js          # Relación aspirante ↔ habilidad
│   │   │   ├── Educacion.js                   # Modelo de educación
│   │   │   ├── Empresa.js                     # Modelo de empresa
│   │   │   ├── Experiencia.js                 # Modelo de experiencia laboral
│   │   │   ├── Habilidad.js                   # Modelo de habilidades
│   │   │   ├── Logro.js                       # Modelo de logros
│   │   │   ├── MatchRecomendacion.js          # Modelo del match candidato-vacante
│   │   │   ├── Mensaje.js                     # Modelo de mensajes
│   │   │   ├── Vacante.js                     # Modelo de vacante
│   │   │   ├── VacanteHabilidad.js            # Relación vacante ↔ habilidad
│   │   │   └── index.js                       # Asociaciones entre modelos
│   │   │
│   │   ├── routes/
│   │   │   ├── aspirante.routes.js            # Rutas del aspirante
│   │   │   ├── authRoutes.js                  # Rutas de autenticación
│   │   │   ├── habilidad.routes.js            # Rutas de habilidades
│   │   │   ├── vacante.routes.js              # Rutas de vacantes
│   │   │   └── index.js                       # Enrutador principal
│   │   │
│   │   ├── scripts/
│   │   │   ├── seedDatabase.js                # Poblar BD con datos de prueba
│   │   │   └── syncDatabase.js                # Sincronizar modelos con PostgreSQL
│   │   │
│   │   └── services/
│   │       ├── profile.service.js             # Lógica de completitud del perfil
│   │       └── recommendation.service.js      # Algoritmo de recomendación
│   │
│   ├── uploads/                               # Archivos subidos (CVs, imágenes)
│   ├── .env                                   # Variables de entorno (no subir a GitHub)
│   ├── server.js                              # Servidor principal
│   ├── serviceAccountKey.json                 # Credenciales Firebase (no subir a GitHub)
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                           # Página de bienvenida
│   │   ├── login/
│   │   │   └── page.tsx                       # Página de login
│   │   ├── register/
│   │   │   └── page.tsx                       # Página de registro
│   │   └── vacantes/
│   │       ├── layout.tsx                     # Layout con sidebar + header bar
│   │       ├── inicio/
│   │       │   └── page.tsx                   # Dashboard con vacantes recomendadas
│   │       ├── postulaciones/
│   │       │   └── page.tsx                   # Tablero Kanban de postulaciones
│   │       ├── perfil/
│   │       │   └── page.tsx                   # Perfil del candidato
│   │       └── mensajes/
│   │           └── page.tsx                   # Bandeja de mensajes
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Pasos de Ejecución

### Requisitos previos

- Node.js instalado
- PostgreSQL instalado y corriendo
- pgAdmin 4 (opcional, para gestión visual de la BD)

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/magneto-mvp.git
cd magneto-mvp
```

---

### Paso 2 — Configurar la base de datos

Abre pgAdmin (o psql) y ejecuta:

```sql
CREATE DATABASE magneto_db;

```

---

### Paso 3 — Configurar y correr el Backend

```bash
cd backend
npm install
```

Crea el archivo `.env` en la raíz de `/backend` con las siguientes variables:

```env
PORT=4000
JWT_SECRET=magnetSecrtK
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=magneto_db
```

Inicia el servidor:

```bash
node index.js
```

> ✅ El backend quedará corriendo en **http://localhost:4000**

---

### Paso 4 — Configurar y correr el Frontend

Abre una **nueva terminal** y ejecuta:

```bash
cd frontend
npm install
npm run dev
```

> ✅ El frontend quedará corriendo en **http://localhost:3000**

---

### Paso 5 — Abrir la aplicación

Abre tu navegador y entra a:

```
http://localhost:3000
```

Desde ahí puedes registrarte, iniciar sesión y explorar el dashboard de vacantes recomendadas.

---

## 🔗 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar candidato |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/aspirantes/perfil/me` | Perfil del candidato autenticado |
| GET | `/api/aspirantes/me/postulaciones` | Postulaciones del candidato |
| GET | `/api/aspirantes/me/mensajes` | Mensajes del candidato |

---

## 👥 Autores

- Wendy Atehortua
- Isabella Ocampo
- Isabella Cadavid
- Maria Laura Tafur

Proyecto desarrollado para la materia **Ingeniería de Software** — EAFIT · 2026
