# Documentación Técnica — MagnetMatch

## 1. Lógica del Match: Cómo se calcula la compatibilidad

El motor de recomendación de MagnetMatch utiliza un **sistema de puntuación ponderada** que evalúa 5 dimensiones de compatibilidad entre un candidato y una vacante. Cada dimensión genera un puntaje de 0 a 100 que se multiplica por su peso relativo.

### Fórmula del Score Final

```
Score = (Habilidades x 0.30) + (Experiencia x 0.20) + (IA Semántica x 0.30) + (Salario x 0.10) + (Ubicación x 0.10)
```

### Detalle de cada dimensión

#### 1.1 Habilidades (30%)

Se comparan las habilidades del candidato contra las requeridas por la vacante. Las habilidades se clasifican en **obligatorias** (peso 70%) y **opcionales** (peso 30%).

| Condición | Puntaje |
|---|---|
| No tiene ninguna habilidad obligatoria | 20 |
| Tiene todas las obligatorias + todas las opcionales | 100 |
| Fórmula general | `(obligatorias_match / total_obligatorias) x 70 + (opcionales_match / total_opcionales) x 30` |

#### 1.2 Experiencia laboral (20%)

Se suman todos los años de experiencia laboral registrados en el perfil del candidato.

| Años de experiencia | Puntaje |
|---|---|
| 0 (sin experiencia) | 30 |
| 1 a 2 años | 60 |
| 3 a 4 años | 80 |
| 5 o más años | 100 |

#### 1.3 Análisis Semántico por IA (30%)

Se envía la descripción del candidato y la descripción de la vacante a la API de **Groq** (modelo `llama-3.1-8b-instant`). La IA evalúa la compatibilidad a nivel de texto libre y retorna un número entero del 0 al 100.

Si la API de IA no está configurada, se asigna un puntaje neutral de 50.

#### 1.4 Salario (10%)

Se compara la expectativa salarial del candidato con el rango ofrecido por la vacante.

| Condición | Puntaje |
|---|---|
| Expectativa dentro del rango [min, max] | 100 |
| Expectativa menor al mínimo | 80 |
| Expectativa mayor al máximo | 40 |
| Sin datos disponibles | 50 |

#### 1.5 Ubicación / Modalidad (10%)

Se evalúa la compatibilidad entre la ubicación del candidato y la modalidad de trabajo de la vacante.

| Condición | Puntaje |
|---|---|
| Vacante remota | 100 (compatible con cualquier ubicación) |
| Vacante híbrida | 70 |
| Ubicación no coincide con presencial | 30 |
| Sin datos disponibles | 50 |

### Ejemplo de cálculo

```
Candidato: 3 años de experiencia, 4 de 5 habilidades obligatorias,
           salario dentro del rango, vacante remota, IA evalúa 75.

Habilidades:  (4/5 x 70) + (0/2 x 30) = 56.0
Experiencia:  80
IA Semántica: 75
Salario:      100
Ubicación:    100

Score = (56 x 0.30) + (80 x 0.20) + (75 x 0.30) + (100 x 0.10) + (100 x 0.10)
      = 16.8 + 16.0 + 22.5 + 10.0 + 10.0
      = 75.3%
```

---

## 2. Tecnologías Utilizadas

### Backend

| Tecnología | Propósito |
|---|---|
| Node.js | Runtime de JavaScript del lado del servidor |
| Express.js | Framework HTTP para la API REST |
| Sequelize | ORM para interactuar con PostgreSQL |
| PostgreSQL | Base de datos relacional principal |
| Firebase Admin | Autenticación de usuarios (verificación de tokens) |
| Multer | Middleware para subir archivos (hojas de vida) |
| Groq API | Inteligencia artificial para análisis semántico y consejos |
| OpenAI SDK | Cliente HTTP para conectar con la API de Groq |
| JWT (jsonwebtoken) | Tokens de autenticación |
| bcryptjs | Hash de contraseñas |
| dotenv | Gestión de variables de entorno |
| morgan | Logger de peticiones HTTP |
| cors | Middleware para Cross-Origin Resource Sharing |
| nodemon | Reinicio automático del servidor en desarrollo |

### Frontend

| Tecnología | Propósito |
|---|---|
| Next.js 15 | Framework React con App Router (SSR/CSR) |
| TypeScript | Tipado estático para JavaScript |
| React 19 | Librería de interfaz de usuario con componentes funcionales |
| Tailwind CSS | Framework de utilidades CSS |
| Axios | Cliente HTTP para consumir la API |
| Firebase Client | Autenticación del lado del cliente |
| Lucide React | Iconos SVG como componentes React |

### Infraestructura

| Tecnología | Propósito |
|---|---|
| Git / GitHub | Control de versiones y repositorio remoto |
| pgAdmin 4 | Gestión visual de la base de datos |

---

## 3. Arquitectura y Lógica del Sistema

### Flujo del Usuario

```
1. El usuario accede a la landing page
2. Se registra con correo y contraseña (Firebase Authentication)
3. Inicia sesión y recibe un token JWT
4. Accede al dashboard de inicio
5. Si su perfil no está al 100%, gestiona su perfil:
   - Datos básicos (nombre, teléfono, salario, modalidad, ubicación, descripción)
   - Habilidades (con nivel y años de experiencia)
   - Experiencia laboral
   - Educación
   - Logros y certificaciones
   - Hoja de vida (PDF)
6. Con perfil al 100%, ve las vacantes recomendadas ordenadas por match
7. Puede pedir un consejo de IA personalizado
8. Se postula a las vacantes de su interés
9. Consulta el historial de postulaciones y mensajes
```

### Módulos del Sistema

#### Autenticación
- Registro con email y contraseña a través de Firebase Authentication.
- El login genera un token JWT que se almacena en `localStorage`.
- Todas las rutas protegidas validan el token mediante `authMiddleware`.

#### Perfil del Aspirante
- Gestión completa de datos personales, descripción profesional, ubicación y modalidad preferida.
- Subida de hoja de vida en PDF mediante Multer.
- Gestión de habilidades con catálogo, nivel de dominio y años de experiencia.
- Registro de experiencia laboral con timeline visual.
- Registro de educación y logros/certificaciones.
- Cálculo automático del porcentaje de completitud.
- Restricción: el perfil debe estar al 100% para postularse a vacantes.

#### Motor de Recomendación
- Para cada vacante activa, calcula un score de compatibilidad (0-100%) usando la fórmula ponderada de 5 dimensiones.
- Los scores se almacenan en la tabla `MatchRecomendacion` como caché.
- Las vacantes se presentan ordenadas de mayor a menor compatibilidad.
- El usuario puede descartar vacantes que no le interesan.

#### Inteligencia Artificial (Groq)
El sistema consume la API de Groq con dos funciones diferenciadas:

**Score Semántico** (modelo `llama-3.1-8b-instant`, 10 tokens max): recibe la descripción del candidato y de la vacante, y retorna un número del 0 al 100 que representa la compatibilidad textual.

**Consejo de IA** (modelo `llama-3.3-70b-versatile`, 350 tokens max): analiza el perfil completo del candidato y sus top 3 vacantes recomendadas para generar dos secciones de consejos:
- Cómo mejorar el perfil en la plataforma
- Cómo destacarse en las vacantes con mayor match

#### Postulaciones
- El candidato puede aplicar a vacantes (requiere perfil completo al 100%).
- Puede marcar vacantes como "No me interesa" para ocultarlas.
- El historial muestra estados progresivos: pendiente, postulado, en revisión, entrevista, oferta, contratado o descartado.

#### Mensajes
- Sistema de notificaciones internas.
- El usuario puede enviar y recibir mensajes.
- Los mensajes se marcan como leídos.

### Base de Datos — Modelo Relacional

```
ASPIRANTE (1) ---- (N) EXPERIENCIA
ASPIRANTE (1) ---- (N) EDUCACION
ASPIRANTE (1) ---- (N) LOGRO
ASPIRANTE (1) ---- (N) ASPIRANTE_HABILIDAD (N) ---- (1) HABILIDAD
ASPIRANTE (1) ---- (N) MATCH_RECOMENDACION (N) ---- (1) VACANTE
ASPIRANTE (1) ---- (N) MENSAJE

EMPRESA   (1) ---- (N) VACANTE
VACANTE   (1) ---- (N) VACANTE_HABILIDAD   (N) ---- (1) HABILIDAD
```

### Gestión de la Base de Datos

Las tablas se crean automáticamente al iniciar el backend por primera vez gracias a `Sequelize.sync()`. No es necesario ejecutar migraciones SQL manuales.

Para poblar la base de datos con datos de prueba (empresas, vacantes, habilidades), ejecutar:

```bash
node src/scripts/seedDatabase.js
```

Este script limpia las tablas de vacantes y las recrea con datos frescos. Es seguro ejecutarlo múltiples veces.

---

Documento generado para el proyecto MagnetMatch — Ingeniería de Software, Universidad EAFIT, 2026.
