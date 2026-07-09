import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, '../bling_tokens.json');

const BLING_CLIENT_ID = process.env.BLING_CLIENT_ID;
const BLING_CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
const BLING_OAUTH_URL = 'https://www.bling.com.br/Api/v3';
const BLING_API_URL = 'https://api.bling.com.br/Api/v3';

// Carrega os tokens do arquivo JSON local (para persistência simples)
export const getBlingTokens = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  }
  return null;
};

export const saveBlingTokens = (tokens) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
};

// Autentica via Authorization Code (Callback)
export const authenticateBling = async (code) => {
  const basicAuth = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${BLING_OAUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '1.0',
      'Authorization': `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter token do Bling: ${errorText}`);
  }

  const data = await response.json();
  saveBlingTokens(data);
  return data;
};

// Renova o token de acesso
export const refreshTokenBling = async () => {
  const tokens = getBlingTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('Não há refresh_token salvo. É necessário autenticar novamente.');
  }

  const basicAuth = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${BLING_OAUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '1.0',
      'Authorization': `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao renovar token do Bling: ${errorText}`);
  }

  const data = await response.json();
  saveBlingTokens(data);
  return data.access_token;
};

// Função genérica para requisições na API V3 com auto-refresh
export const fetchBlingApi = async (endpoint, options = {}) => {
  let tokens = getBlingTokens();
  if (!tokens) throw new Error('Bling não autenticado.');

  let url = `${BLING_API_URL}${endpoint}`;
  
  let fetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  let response = await fetch(url, fetchOptions);

  // Se o token estiver expirado (401), renova e tenta de novo
  if (response.status === 401) {
    console.log('[Bling] Token expirado, renovando...');
    const newAccessToken = await refreshTokenBling();
    fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
    response = await fetch(url, fetchOptions);
  }

  return response;
};

// Emitir NFC-e via Pedido de Venda -> Gerar Nota
export const emitirNFCeBling = async (payload) => {
  // 1. Criar NFC-e no Bling
  // A API V3 possui a rota POST /nfces
  const response = await fetchBlingApi('/nfces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro na API Bling ao criar NFC-e: ${errorData}`);
  }

  const data = await response.json();
  return data.data; // Retorna os dados da nota criada (id, numero, linkDanfe, etc.)
};
