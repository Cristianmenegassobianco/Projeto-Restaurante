

export const emitirNFCeTiny = async (payload) => {
  const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
  if (!TINY_API_TOKEN) throw new Error("TINY_API_TOKEN não configurado.");

  const pedidoData = { pedido: payload };

  // 1. Criar o Pedido de Venda no Tiny
  const body = new URLSearchParams({
    token: TINY_API_TOKEN,
    formato: 'json',
    pedido: JSON.stringify(pedidoData)
  });

  const response = await fetch('https://api.tiny.com.br/api2/pedido.incluir.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const json = await response.json();
  if (json.retorno.status === 'Erro') {
    throw new Error(`Erro ao criar Pedido no Tiny: ${JSON.stringify(json.retorno.erros)}`);
  }

  // O Tiny retorna: registros: { registro: { id: "123", numero: "456" } }
  let idPedido;
  if (json.retorno.registros && json.retorno.registros.registro) {
    if (Array.isArray(json.retorno.registros.registro)) {
      idPedido = json.retorno.registros.registro[0].id;
    } else {
      idPedido = json.retorno.registros.registro.id;
    }
  }

  if (!idPedido) {
    throw new Error(`ID do pedido não encontrado na resposta do Tiny: ${JSON.stringify(json)}`);
  }

  // 2. Gerar a NFC-e a partir do Pedido
  const emitBody = new URLSearchParams({
    token: TINY_API_TOKEN,
    formato: 'json',
    id: idPedido,
    modelo: 'NFCe'
  });

  const emitResponse = await fetch('https://api.tiny.com.br/api2/gerar.nota.fiscal.pedido.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: emitBody
  });

  const emitJson = await emitResponse.json();
  if (emitJson.retorno.status === 'Erro') {
    throw new Error(`Erro ao gerar NFC-e no Tiny: ${JSON.stringify(emitJson.retorno.erros)}`);
  }

  // Opcional: Emitir/Transmitir a nota caso necessário. Em SC via PAF-NFCe o fluxo pode ser diferente.
  // Vamos retornar os dados para o frontend.
  let idNotaFiscal;
  if (emitJson.retorno.registros && emitJson.retorno.registros.registro) {
    if (Array.isArray(emitJson.retorno.registros.registro)) {
      idNotaFiscal = emitJson.retorno.registros.registro[0].id;
    } else {
      idNotaFiscal = emitJson.retorno.registros.registro.id;
    }
  }

  return { idPedido, idNotaFiscal, ...emitJson.retorno };
};
