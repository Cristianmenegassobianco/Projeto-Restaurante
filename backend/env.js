import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const result = dotenv.config({ path: path.join(__dirname, '.env') });
if (result.error) {
  console.error('[ENV] Erro ao carregar .env:', result.error);
} else {
  console.log('[ENV] Token carregado com sucesso:', process.env.FOCUS_NFE_TOKEN ? 'SIM' : 'NAO');
}
