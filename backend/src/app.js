const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Cargar variables de entorno desde .env.local o .env si existe (Node 20+)
if (typeof process.loadEnvFile === 'function') {
  try {
    if (fs.existsSync(path.resolve(__dirname, '.env.local'))) {
      process.loadEnvFile(path.resolve(__dirname, '.env.local'));
    } else if (fs.existsSync(path.resolve(__dirname, '.env'))) {
      process.loadEnvFile(path.resolve(__dirname, '.env'));
    }
  } catch (_) {
    // Si falla o no tiene permisos, se continúa con process.env
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
  console.log(`🔑 Estado de GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configurada ✅' : 'No configurada ⚠️ (Creá un archivo .env.local)'}`);
  console.log(`==================================================\n`);
});
