const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Add imports
code = code.replace(/import \{ randomUUID \} from 'crypto';/, "import { randomUUID } from 'crypto';\nimport productsRoutes from './routes/products.js';\nimport cashRoutes from './routes/cash.js';");

// Mount routers around line 75
code = code.replace(/\/\/ --- ROUTES ---/, "// --- ROUTES ---\napp.use('/api/products', productsRoutes(prisma));\napp.use('/api/cash-session', cashRoutes(prisma));");

// Remove products routes (7, 8, 8.1, 9)
code = code.replace(/\/\/ 7\. Products: Create new product[\s\S]*?\/\/ 10\. Categories: Get list/, '// 10. Categories: Get list');

// Remove products toggle featured (16)
code = code.replace(/\/\/ 16\. Products: Toggle featured status[\s\S]*?\/\/ 17\. Comandas: Consultar status/, '// 17. Comandas: Consultar status');

// Remove cash session routes (19 + rest)
code = code.replace(/\/\/ ==========================================\s*\/\/ ======= ROTAS DE CAIXA \(PDV\) ==========\s*\/\/ ==========================================[\s\S]*?const PORT/g, 'const PORT');

fs.writeFileSync('server.js', code);
console.log('Refactor complete.');
