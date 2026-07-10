import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BLING_CLIENT_ID = process.env.BLING_CLIENT_ID;
const BLING_CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
const BLING_OAUTH_URL = 'https://www.bling.com.br/Api/v3';
const BLING_API_URL = 'https://api.bling.com.br/Api/v3';

// Carrega os tokens do banco de dados para persistência garantida no Railway
export const getBlingTokens = async () => {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'bling_tokens' } });
  if (config && config.value) {
    return JSON.parse(config.value);
  }
  return null;
};

export const saveBlingTokens = async (tokens) => {
  await prisma.systemConfig.upsert({
    where: { key: 'bling_tokens' },
    update: { value: JSON.stringify(tokens) },
    create: { key: 'bling_tokens', value: JSON.stringify(tokens) }
  });
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
  await saveBlingTokens(data);
  return data;
};

// Renova o token de acesso
export const refreshTokenBling = async () => {
  const tokens = await getBlingTokens();
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
  await saveBlingTokens(data);
  return data.access_token;
};

// Função genérica para requisições na API V3 com auto-refresh
export const fetchBlingApi = async (endpoint, options = {}) => {
  let tokens = await getBlingTokens();
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
  // 1. Criar o Pedido de Venda no Bling
  const responseVenda = await fetchBlingApi('/pedidos/vendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!responseVenda.ok) {
    const errorData = await responseVenda.text();
    throw new Error(`Erro ao criar Pedido de Venda no Bling: ${errorData}`);
  }

  const vendaData = await responseVenda.json();
  const idVenda = vendaData.data.id;

  // 2. Gerar a NFC-e a partir do Pedido
  const responseNfce = await fetchBlingApi(`/pedidos/vendas/${idVenda}/gerar-nfce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!responseNfce.ok) {
    const errorData = await responseNfce.text();
    throw new Error(`Erro ao gerar NFC-e do Pedido ${idVenda}: ${errorData}`);
  }

  const nfceData = await responseNfce.json();
  return nfceData.data;
};
