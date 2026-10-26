const fs = require('fs');
const path = require('path');

if (!process.env.GOOGLE_API_KEY?.trim() && !process.env.GEMINI_API_KEY?.trim() && typeof process.loadEnvFile === 'function') {
  const envFiles = [
    path.resolve(__dirname, '.env.local'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, 'backend/.env'),
  ];

  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) continue;
    try {
      process.loadEnvFile(envFile);
      if (process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()) break;
    } catch {
      // Se prueba el siguiente archivo local.
    }
  }
}

const apiKey = process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error('Falta GOOGLE_API_KEY o GEMINI_API_KEY. Configurala en .env.local, .env o backend/.env antes de probar la conexión.');
  process.exit(1);
}

async function verifyKey() {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respondé únicamente con la palabra FUNCIONA.' }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`Gemini respondió HTTP ${response.status}: ${payload?.error?.message || 'sin detalle'}`);
      process.exitCode = 1;
      return;
    }

    const reply = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    console.log(reply ? `Conexión correcta. Respuesta del modelo: ${reply}` : 'Gemini respondió sin texto.');
  } catch (error) {
    console.error(`No se pudo conectar con Gemini: ${error?.message || 'error de red'}`);
    process.exitCode = 1;
  }
}

verifyKey();
