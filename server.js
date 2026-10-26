const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Cargar el primer archivo local que aporte una clave Gemini (Node 20+).
// Vercel inyecta la variable desde Project Settings y no usa estos archivos.
if (typeof process.loadEnvFile === 'function' && !process.env.GOOGLE_API_KEY?.trim() && !process.env.GEMINI_API_KEY?.trim()) {
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
    } catch (_) {
      // Si falla o no tiene permisos, se prueba el siguiente archivo.
    }
  }
}

const chatHandler = require('./api/chat.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Endpoint API /api/chat
  if (pathname === '/api/chat') {
    let bodyStr = '';
    req.on('data', (chunk) => {
      bodyStr += chunk;
    });
    req.on('end', async () => {
      req.body = bodyStr;

      // Adaptadores compatibles con el runtime de Vercel Functions
      res.status = function (code) {
        res.statusCode = code;
        return res;
      };
      res.json = function (data) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return res;
      };

      try {
        await chatHandler(req, res);
      } catch (err) {
        console.error('Error no capturado en /api/chat:', err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
        }
      }
    });
    return;
  }

  // Servir archivos estáticos
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(path.join(__dirname, filePath));

  // Evitar directory traversal
  if (!safePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Acceso denegado');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Archivo no encontrado');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🎓 Brújula — Tutor de Estudio con IA (Local Dev)`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log('🤖 Modelo configurado: gemini-3.5-flash-lite (Free Tier, si el proyecto es elegible)');
  const keyConfigured = Boolean(process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim());
  console.log(`🔑 Estado de la clave Gemini: ${keyConfigured ? 'Configurada ✅' : 'No configurada ⚠️ (Creá .env.local o backend/.env)'}`);
  console.log(`==================================================\n`);
});
