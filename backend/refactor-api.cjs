const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// The routes start at // 1. Healthcheck (around line 80) and end at // --- SOCKET.IO ---
const routeRegex = /\/\/ 1\. Healthcheck[\s\S]*?\/\/ --- SOCKET\.IO ---/;
const match = code.match(routeRegex);

if (!match) {
  console.log("Could not find the routes block.");
  process.exit(1);
}

const routesCode = match[0];

const apiJsContent = `import { Router } from 'express';
import { randomUUID } from 'crypto';

export default function apiRoutes(prisma, io, jwt, JWT_SECRET) {
  const app = Router();

${routesCode.replace('// --- SOCKET.IO ---', '')}

  return app;
}
`;

fs.writeFileSync('routes/api.js', apiJsContent);

// Remove the extracted routes from server.js
let newServerJs = code.replace(routeRegex, `import apiRoutes from './routes/api.js';

app.use('/', apiRoutes(prisma, io, jwt, JWT_SECRET));

// --- SOCKET.IO ---`);

fs.writeFileSync('server.js', newServerJs);
console.log('Refactored to api.js');
