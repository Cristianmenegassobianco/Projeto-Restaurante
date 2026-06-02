/**
 * Módulo de Integração com a API Focus NFe para emissão de NFC-e
 */

// A URL base da API (Homologação ou Produção)
// Para produção use: https://api.focusnfe.com.br
const FOCUS_API_URL = process.env.FOCUS_NFE_ENV === 'production' 
  ? 'https://api.focusnfe.com.br' 
  : 'https://homologacao.focusnfe.com.br';

const getHeaders = () => {
  const token = process.env.FOCUS_NFE_TOKEN;
  if (!token) {
    throw new Error('Token da Focus NFe não configurado. Verifique a variável FOCUS_NFE_TOKEN no .env');
  }

  // Focus NFe usa Basic Auth com o token como username e senha em branco.
  // Criamos o base64 de "token:"
  const basicAuth = Buffer.from(`${token}:`).toString('base64');

  return {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Trata as respostas de erro da Focus NFe
 */
const handleFocusError = async (response) => {
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { mensagem: 'Não foi possível decodificar a resposta da API em JSON.' };
  }

  const status = response.status;
  
  if (status === 401) {
    throw new Error('Erro 401: Não autorizado. Verifique seu FOCUS_NFE_TOKEN.');
  }

  if (status === 400 || status === 422) {
    // Erros de validação (ex: rejeição da SEFAZ, campos faltantes)
    // A Focus NFe costuma retornar os detalhes dos erros da SEFAZ dentro de um array ou objeto
    const mensagensSefaz = errorData.erros || errorData.mensagem || JSON.stringify(errorData);
    throw new Error(`Falha de Validação Sefaz/Fiscal (${status}): ${JSON.stringify(mensagensSefaz)}`);
  }

  throw new Error(`Erro inesperado da Focus NFe (${status}): ${JSON.stringify(errorData)}`);
};

/**
 * Emite uma NFC-e enviando o payload para a Focus NFe
 * 
 * @param {String} referencia Um ID único para esta nota (ex: "PEDIDO-123")
 * @param {Object} dadosVenda O payload no formato exigido pela documentação da Focus NFe
 * @returns {Object} Resposta da API (status, cnpj, referencia, etc)
 */
export const emitirNFCe = async (referencia, dadosVenda) => {
  if (!referencia) {
    throw new Error('A referência da nota (ID único) é obrigatória para evitar duplicações.');
  }

  // A referência (ref) é passada na Query String na V2 da Focus
  const url = `${FOCUS_API_URL}/v2/nfce?ref=${encodeURIComponent(referencia)}`;

  try {
    // Utilizando o 'fetch' nativo do Node.js (Node >= 18)
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dadosVenda)
    });

    if (!response.ok) {
      await handleFocusError(response);
    }

    const data = await response.json();
    return data; // Normalmente retorna { status: 'processando', cnpj: '...', ... }
  } catch (error) {
    console.error(`[Focus NFe] Falha ao emitir NFC-e (Ref: ${referencia}):`, error.message);
    throw error;
  }
};

/**
 * Consulta o status de uma NFC-e previamente enviada
 * 
 * @param {String} referencia O mesmo ID único usado na emissão (ex: "PEDIDO-123")
 * @returns {Object} Resposta da API com o status (autorizado, rejeitado, processando), XML, PDF, etc.
 */
export const consultarNFCe = async (referencia) => {
  if (!referencia) {
    throw new Error('A referência da nota (ID único) é obrigatória para a consulta.');
  }

  const url = `${FOCUS_API_URL}/v2/nfce/${encodeURIComponent(referencia)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`NFC-e não encontrada para a referência informada: ${referencia}`);
      }
      await handleFocusError(response);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error(`[Focus NFe] Falha ao consultar NFC-e (Ref: ${referencia}):`, error.message);
    throw error;
  }
};
