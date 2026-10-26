const MODEL = 'gemini-3.5-flash-lite';

const SYSTEM_INSTRUCTION = `Eres Brújula, un tutor de estudio paciente y cercano para estudiantes de secundaria y primeros años de formación.

OBJETIVO: ayudar a comprender ideas, resumir temas, practicar conceptos y organizar sesiones de estudio. Prioriza el aprendizaje y el razonamiento del estudiante.

CONTEXTO: esta es una demostración educativa general, con foco ilustrativo en Introducción a la Inteligencia Artificial. No tienes acceso al programa, apuntes ni materiales de una clase real, salvo el texto que la persona comparta en esta conversación. Puedes responder preguntas generales de otras materias, pero pide el tema o nivel cuando sean necesarios.

ESTILO: responde en español claro, amable y directo. Usa palabras sencillas, ejemplos concretos y párrafos breves. Adapta el nivel a lo que indique la persona.

REGLAS: no inventes datos, citas, requisitos de cursos ni contenido de materiales que no recibiste. Si no estás seguro, dilo y sugiere cómo verificarlo con una fuente o docente. Si falta contexto, haz una pregunta breve. Para ejercicios, guía con pasos y explica el razonamiento; evita limitarte a entregar respuestas sin ayudar a comprender. No afirmes que sustituyes a docentes ni que puedes garantizar calificaciones.

FORMATO: responde primero a la duda principal; cuando ayude, organiza la respuesta como explicación breve, ejemplo y una pregunta o práctica para comprobar comprensión. Si la persona pide otro formato, síguelo. Mantén la respuesta concisa.`;

function respond(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

function explainGeminiFailure(status) {
  if (status === 400) return 'Gemini rechazó el formato de la solicitud. Probá reformular la pregunta.';
  if (status === 401) return 'Google rechazó la clave (401). Vercel debe tener la misma clave Auth válida que probaste; los archivos .env locales no se cargan en Vercel. Revisa GOOGLE_API_KEY o GEMINI_API_KEY y redepliega.';
  if (status === 402) return 'El proyecto requiere facturación activa. Esta demo usa Gemini 3.5 Flash-Lite con Free Tier; no habilites facturación si quieres mantenerla gratis.';
  if (status === 403) return 'Google denegó el acceso de este proyecto (403). El estado Restricted / Free tier unavailable bloquea también a los modelos Gemini más livianos. Hace falta una clave de un proyecto elegible para Free Tier.';
  if (status === 404) return 'Google no encontró el modelo Gemini solicitado. Revisá que el modelo esté disponible en AI Studio.';
  if (status === 429) return 'Se alcanzó el límite gratuito de Gemini. Esperá a que se restablezca la cuota y probá de nuevo.';
  if (status >= 500) return `Gemini está temporalmente no disponible (${status}). Probá de nuevo más tarde.`;
  return `Gemini respondió con un error HTTP ${status}.`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { error: 'Este endpoint solo acepta preguntas del tutor.' });
  }

  // Keep the same precedence used by Google's GenAI SDK when both names exist.
  const apiKey = process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return respond(res, 503, {
      error: 'Falta configurar GOOGLE_API_KEY o GEMINI_API_KEY en Vercel. Agrega como secreto una clave perteneciente a un proyecto habilitado para Free Tier.',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return respond(res, 400, { error: 'No pude leer el mensaje. Probá enviarlo de nuevo.' });
    }
  }

  const receivedMessages = Array.isArray(body?.messages) ? body.messages : [];
  if (!receivedMessages.length || receivedMessages.length > 12) {
    return respond(res, 400, { error: 'La conversación no tiene un formato válido. Empezá una pregunta nueva.' });
  }

  const contents = receivedMessages.map((message) => {
    const role = message?.role === 'assistant' ? 'model' : message?.role === 'user' ? 'user' : null;
    const text = typeof message?.text === 'string' ? message.text.trim() : '';
    const maxLength = role === 'user' ? 1200 : 6000;
    if (!role || !text || text.length > maxLength) return null;
    return { role, parts: [{ text }] };
  });

  if (contents.some((message) => !message) || contents[contents.length - 1]?.role !== 'user') {
    return respond(res, 400, { error: 'Revisá el mensaje e intentá enviarlo otra vez.' });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: { maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(25000),
      },
    );

    if (!geminiResponse.ok) {
      const errorPayload = await geminiResponse.json().catch(() => ({}));
      const providerCode = errorPayload?.error?.status || errorPayload?.error?.code || null;
      console.error('Gemini API request rejected', {
        httpStatus: geminiResponse.status,
        providerCode,
        model: MODEL,
      });
      return respond(res, 502, {
        error: explainGeminiFailure(geminiResponse.status),
        providerCode,
      });
    }

    const result = await geminiResponse.json();
    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!reply) return respond(res, 502, { error: 'No llegó una respuesta. Probá reformular la pregunta.' });
    return respond(res, 200, { reply });
  } catch (error) {
    console.error('Gemini API connection failed', { name: error?.name || 'Error' });
    return respond(res, 502, { error: 'No pude conectar con Gemini. Probá de nuevo en unos segundos.' });
  }
};
