# MagnetMatch

Portal web inteligente que conecta candidatos con vacantes laborales mediante un motor de recomendación con inteligencia artificial que calcula compatibilidad en tiempo real.

---

## Descripción del Proyecto

MagnetMatch resuelve el problema del abandono en formularios de registro largos y repetitivos. El sistema guía al candidato paso a paso, guarda su perfil en una base de datos relacional y utiliza un **motor de recomendación ponderado + Inteligencia Artificial (Groq)** para mostrarle las vacantes que mejor se ajustan a su perfil.

**Flujo principal:**

```
Registro > Login > Completar Perfil (100%) > Vacantes Recomendadas > Postularse > Consejo IA
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js |
| Base de datos | PostgreSQL + Sequelize ORM |
| Autenticación | Firebase Authentication + JWT |
| Inteligencia Artificial | Groq API (Llama 3.3-70b / 3.1-8b) |
| Subida de archivos | Multer |
| Comunicación | Axios + CORS |

---

## Estructura del Proyecto

```
MagnetMatch/
├── .gitignore
├── README.md
├── DOCUMENTACION_TECNICA.md
│
├── backend/
│   ├── src/
│   │   ├── config/                   Conexión a BD y Firebase
│   │   ├── controllers/             Lógica de negocio (9 controllers)
│   │   ├── middleware/              Autenticación y subida de archivos
│   │   ├── models/                  12 modelos Sequelize
│   │   ├── routes/                  Endpoints de la API
│   │   ├── services/                IA (Groq), Recomendación, Perfil
│   │   ├── scripts/                 Seeds y sincronización de BD
│   │   └── server.js
│   ├── .env                         [No se sube a GitHub]
│   └── serviceAccountKey.json       [No se sube a GitHub]
│
└── frontend/
    ├── app/
    │   ├── page.tsx                  Landing page
    │   ├── login/                    Inicio de sesión
    │   ├── register/                 Registro de usuario
    │   └── vacantes/
    │       ├── layout.tsx            Sidebar con navegación
    │       ├── inicio/               Dashboard y recomendaciones
    │       ├── perfil/               Gestión completa del perfil
    │       ├── postulaciones/        Historial de postulaciones
    │       └── mensajes/             Bandeja de mensajes
    ├── lib/                          Config Firebase y API URL
    ├── complements/                  Componente Logo
    └── public/                       Logos, iconos e imágenes
```

Ver [DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md) para la descripción detallada de cada archivo.

---

## Motor de Recomendación

El score de compatibilidad se calcula con una **fórmula ponderada de 5 dimensiones**:

```
Score = (Habilidades x 30%) + (IA Semántica x 30%) + (Experiencia x 20%) + (Salario x 10%) + (Ubicación x 10%)
```

| Dimensión | Peso | Descripción |
|---|---|---|
| Habilidades | 30% | Coincidencia de habilidades obligatorias y opcionales |
| IA Semántica | 30% | Groq analiza la descripción del candidato vs. la vacante |
| Experiencia | 20% | Años totales de experiencia laboral registrada |
| Salario | 10% | Expectativa salarial dentro del rango ofrecido |
| Ubicación | 10% | Compatibilidad de modalidad (remoto/híbrido/presencial) |

Ver la fórmula detallada con ejemplos numéricos en [DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md).

---

## Inteligencia Artificial (Groq)

MagnetMatch integra la API de Groq para dos funciones:

1. **Score Semántico** — Modelo `llama-3.1-8b-instant` (10 tokens max): compara perfiles a nivel de texto y devuelve un puntaje numérico de compatibilidad.

2. **Consejo de IA** — Modelo `llama-3.3-70b-versatile` (350 tokens max): analiza el perfil del candidato y sus top 3 vacantes para generar consejos personalizados en dos secciones: mejorar el perfil y destacar en las vacantes.

---

## Guía de Instalación y Ejecución

### Requisitos previos

- **Node.js** v18 o superior — [Descargar](https://nodejs.org/)
- **PostgreSQL** instalado y corriendo — [Descargar](https://www.postgresql.org/download/)
- **pgAdmin 4** (opcional, para gestión visual) — [Descargar](https://www.pgadmin.org/)
- **API Key de Groq** (gratis) — [Obtener en console.groq.com](https://console.groq.com)

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/IsaO22/MagnetMatch.git
cd MagnetMatch
```

---

### Paso 2 — Crear la base de datos

Abrir **pgAdmin** o la terminal de PostgreSQL y ejecutar:

```sql
CREATE DATABASE magneto_db;
```

> **Nota:** No es necesario crear tablas manualmente. Sequelize las crea automáticamente al iniciar el backend por primera vez.

---

### Paso 3 — Configurar el Backend

```bash
cd backend
npm install
```

Crear el archivo `backend/.env` con el siguiente contenido (ajustar la contraseña de PostgreSQL):

```env
PORT=4000
JWT_SECRET=magnetSecrtK
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_postgres
DB_NAME=magneto_db
GROQ_API_KEY=tu_api_key_de_groq
```

Iniciar el servidor:

```bash
npm run dev
```

> El backend quedará corriendo en **http://localhost:4000**.
> Las tablas de la base de datos se crean automáticamente en este paso.

---

### Paso 4 — Poblar la base de datos con datos de prueba

Con el backend corriendo, abrir **otra terminal** y ejecutar:

```bash
cd backend
node src/scripts/seedDatabase.js
```

Esto crea automáticamente:
- 7 empresas con sus datos
- 11 vacantes en distintas áreas (tecnología, marketing, finanzas, ventas, servicio al cliente)
- Catálogo completo de habilidades
- Relaciones vacante-habilidad

---

### Paso 5 — Configurar y correr el Frontend

Abrir **otra terminal** y ejecutar:

```bash
cd frontend
npm install
npm run dev
```

> El frontend quedará corriendo en **http://localhost:3000**.

---

### Paso 6 — Usar la aplicación

1. Abrir el navegador en `http://localhost:3000`
2. Registrarse con un correo y contraseña
3. Iniciar sesión
4. Completar el perfil al 100% (datos, habilidades, experiencia, educación)
5. Ver las vacantes recomendadas ordenadas por porcentaje de match
6. Pedir un consejo de IA y postularse a las vacantes

---

## Resumen: Pasos rápidos para ejecutar

```bash
# 1. Clonar
git clone https://github.com/IsaO22/MagnetMatch.git
cd MagnetMatch

# 2. Backend
cd backend
npm install
# Crear archivo .env (ver arriba)
npm run dev

# 3. Seed (en otra terminal)
cd backend
node src/scripts/seedDatabase.js

# 4. Frontend (en otra terminal)
cd frontend
npm install
npm run dev

# 5. Abrir http://localhost:3000
```

---

## Endpoints Principales de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar candidato |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/aspirantes/perfil/me` | Perfil del candidato autenticado |
| PUT | `/api/aspirantes/perfil/me` | Actualizar perfil |
| POST | `/api/aspirantes/me/upload-cv` | Subir hoja de vida (PDF) |
| GET | `/api/aspirantes/recomendaciones/me` | Vacantes recomendadas |
| GET | `/api/aspirantes/recomendaciones/me/consejo-ia` | Consejo de IA personalizado |
| POST | `/api/aspirantes/me/match/:vacanteId` | Postularse a una vacante |
| GET | `/api/aspirantes/me/postulaciones` | Historial de postulaciones |
| GET | `/api/aspirantes/me/mensajes` | Mensajes del sistema |

---

## Funcionalidades Implementadas

- Registro e inicio de sesión con Firebase Authentication
- Perfil completo: datos básicos, descripción, ubicación, modalidad y salario
- Gestión de habilidades con nivel y años de experiencia
- Gestión de experiencia laboral, educación y logros
- Subida de hoja de vida (CV) en PDF
- Cálculo automático de porcentaje de completitud del perfil
- Motor de recomendación ponderado con 5 dimensiones
- Análisis semántico con IA (Groq) para score de compatibilidad
- Consejo de IA personalizado (mejorar perfil + destacar en vacantes)
- Postulación a vacantes (requiere perfil al 100%)
- Historial de postulaciones con estados
- Sistema de mensajes y notificaciones
- Sidebar con información de contacto de asesor
- Interfaz responsive con diseño profesional

---

## Autoras

- Wendy Atehortua
- Isabella Ocampo
- Isabella Cadavid
- Maria Laura Tafur

Proyecto desarrollado para la materia **Ingeniería de Software** — Universidad EAFIT, 2026
