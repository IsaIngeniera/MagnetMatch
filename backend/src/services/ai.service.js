const OpenAI = require('openai');

/**
 * Crea el cliente de Groq usando el SDK de OpenAI
 * con la base URL de Groq.
 */
const getClient = () => {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

const getSemanticMatchScore = async (aspiranteDesc, vacanteDesc, ubicacion) => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY no configurada. Saltando análisis de IA.");
    return 50;
  }

  if (!aspiranteDesc || !vacanteDesc) {
    return 50;
  }

  try {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 10,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Solo devuelve UN NÚMERO ENTERO del 0 al 100. Sin texto adicional, sin explicaciones, sin símbolos.'
        },
        {
          role: 'user',
          content: `Evalúa la compatibilidad entre este candidato y la vacante.

Candidato:
Ubicación: ${ubicacion || 'No especificada'}
Descripción: ${aspiranteDesc}

Vacante:
${vacanteDesc}`
        }
      ]
    });

    const scoreStr = response.choices[0].message.content.replace(/[^0-9]/g, '');
    const score = parseInt(scoreStr, 10);

    if (isNaN(score)) {
      return 50;
    }

    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Error llamando a Groq API:', error.message);
    return 50;
  }
};

const getConsejoIA = async (perfil, topVacantes) => {
  if (!process.env.GROQ_API_KEY) {
    return "La Inteligencia Artificial no está configurada (Falta GROQ_API_KEY en .env).";
  }

  if (!topVacantes || topVacantes.length === 0) {
    return "No hay vacantes suficientes para darte un consejo.";
  }

  try {
    const client = getClient();

    let vacantesTexto = topVacantes.map((v, i) =>
      `Opción ${i + 1}: ${v.titulo} en ${v.empresa_nombre || 'Empresa'} - Modalidad: ${v.modalidad} - Salario: ${v.salario_min || 0} a ${v.salario_max || 'No definido'} - Habilidades requeridas: ${v.habilidades_requeridas}`
    ).join('\n\n');

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 350,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Eres un sistema automatizado que SOLO devuelve código HTML. NO saludes. NO uses markdown. NO uses bloques de código. Solo HTML puro.'
        },
        {
          role: 'user',
          content: `Candidato:
Descripción: ${perfil.descripcion || 'No especificada'}
Ubicación: ${perfil.ubicacion || 'No especificada'}
Salario Esperado: ${perfil.expectativa_salarial || 'No especificado'}
Modalidad: ${perfil.modalidad_preferida || 'No especificada'}

Top 3 Vacantes:
${vacantesTexto}

DEVUELVE ÚNICAMENTE HTML con este formato:

<h3>🚀 Cómo mejorar tu perfil en la plataforma</h3>
<p>[Consejos concretos sobre qué agregar o cambiar en su perfil para ser mejor prospecto]</p>

<h3>🎯 Cómo destacarte en las vacantes</h3>
<p>[Cómo destacarse en las vacantes que hacen más match, qué resaltar en entrevistas]</p>`
        }
      ]
    });

    let text = response.choices[0].message.content.trim();
    // Limpiar posibles bloques markdown que envuelvan el HTML
    text = text.replace(/```html\n?/gi, '').replace(/```\n?/g, '');
    return text;
  } catch (error) {
    console.error('Error generando consejo de Groq:', error.message);
    return `<p><strong>Error de IA:</strong> ${error.message}</p><p>Verifica que tu GROQ_API_KEY sea válida.</p>`;
  }
};

module.exports = {
  getSemanticMatchScore,
  getConsejoIA
};
