import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authenticateBling, emitirNFCeBling, fetchBlingApi } from '../services/blingService.js';

export default function apiRoutes(prisma, io, jwt, JWT_SECRET) {
  const app = Router();

// 1. Healthcheck
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bling OAuth2 Authorize
app.get('/api/bling/authorize', (req, res) => {
  const clientId = process.env.BLING_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('BLING_CLIENT_ID não configurado nas variáveis de ambiente.');
  }
  const state = Math.random().toString(36).substring(7);
  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=${state}`;
  res.redirect(authUrl);
});

// Bling OAuth2 Callback
app.get('/api/bling/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Código de autorização não fornecido.');
  
  try {
    const tokens = await authenticateBling(code);
    res.send(`<h1>Bling Autenticado com Sucesso!</h1><p>Pode fechar esta janela.</p><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
  } catch (error) {
    res.status(500).send(`<h1>Erro ao autenticar no Bling</h1><p>${error.message}</p>`);
  }
});

// 2. Menu (Categories with Products)
app.get('/api/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { is_available: true },
          include: { suggestedProducts: true }
        }
      },
      orderBy: { sort_order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// 3. Mesa/Session Init (Mock for now)
app.post('/api/session/init', async (req, res) => {
  const { table_number } = req.body; // Em um caso real, validaríamos o QR Token
  
  try {
    // Create or find an active session for this table
    let session = await prisma.tableSession.findFirst({
      where: { table_number: Number(table_number), status: 'active' }
    });

    if (!session) {
      session = await prisma.tableSession.create({
        data: {
          table_number: Number(table_number),
          qr_token: `mock-token-${Date.now()}` // Mock token
        }
      });
    }

    // Generate JWT for the device
    const token = jwt.sign({ session_id: session.id, table_number: session.table_number }, JWT_SECRET);

    res.json({ token, table_number: session.table_number, session_id: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to init session' });
  }
});

// Call Waiter Endpoint
app.post('/api/call-waiter', (req, res) => {
  const { table_number } = req.body;
  if (!table_number) {
    return res.status(400).json({ error: 'Número da mesa é obrigatório' });
  }
  
  // Emite evento via socket.io
  if (io) {
    io.emit('waiter_called', { 
      id: Date.now().toString(),
      table: table_number, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      attendedBy: null
    });
  }
  
  res.json({ success: true });
});

// Attend Waiter Call Endpoint
app.post('/api/call-waiter/attend', (req, res) => {
  const { call_id, waiter_name } = req.body;
  if (!call_id || !waiter_name) {
    return res.status(400).json({ error: 'Call ID e Nome do Garçom são obrigatórios' });
  }

  // Emite evento via socket.io
  if (io) {
    io.emit('waiter_call_attended', {
      call_id,
      waiter_name
    });
  }
  
  res.json({ success: true, message: 'Garçom chamado com sucesso!' });
});

// 4. Create Order
app.post('/api/orders', async (req, res) => {
  const { session_id, items, total_amount, comanda_number, waiter_name } = req.body;
  
  if (!session_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    const order = await prisma.order.create({
      data: {
        table_session_id: session_id,
        total_amount,
        comanda_number: comanda_number || null,
        waiter_name: waiter_name || null,
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
            notes: item.notes || ''
          }))
        }
      },
      include: {
        items: {
          include: { product: true }
        },
        table_session: true
      }
    });

    // Notify kitchen via socket
    io.emit('new_order', order);

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 5. Kitchen: Get active orders
app.get('/api/kitchen/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['pending', 'preparing', 'ready'] }
      },
      include: {
        items: { include: { product: true } },
        table_session: true
      },
      orderBy: { created_at: 'asc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kitchen orders' });
  }
});

// 6. Kitchen: Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        table_session: true
      }
    });

    // Notify clients about the status update
    io.emit('order_status_update', order);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 7. Waiter: Get active orders
app.get('/api/waiter/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['paid', 'canceled'] }
      },
      include: {
        items: { include: { product: true } },
        table_session: true
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waiter orders' });
  }
});

// 10. Categories: Get list
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort_order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});



// 10.1 Categories: Create new
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  try {
    const count = await prisma.category.count();
    const category = await prisma.category.create({
      data: {
        name,
        sort_order: count + 1
      }
    });
    res.json(category);
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// 10.1.5 Categories: Update category name
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name }
    });
    res.json(category);
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// 10.2 Categories: Delete category (cascading products and order items)
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Find all products in this category
    const products = await prisma.product.findMany({
      where: { category_id: id }
    });
    
    const productIds = products.map(p => p.id);
    
    // Delete all OrderItems for these products
    await prisma.orderItem.deleteMany({
      where: { product_id: { in: productIds } }
    });
    
    // Delete all products
    await prisma.product.deleteMany({
      where: { category_id: id }
    });
    
    // Delete the category
    await prisma.category.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category', details: error.message });
  }
});

// 11. Admin: Get all menu categories and products (including unavailable ones)
app.get('/api/admin/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: { suggestedProducts: true }
        }
      },
      orderBy: { sort_order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin menu' });
  }
});


// 13. Banners: Get list
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// 14. Banners: Create new
app.post('/api/banners', async (req, res) => {
  const { title, subtitle, image_url, badge } = req.body;
  if (!image_url || !title) {
    return res.status(400).json({ error: 'Title and image_url are required' });
  }
  try {
    const banner = await prisma.banner.create({
      data: { title, subtitle, image_url, badge }
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

// 15. Banners: Delete
app.delete('/api/banners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// 15.1 Banners: Update
app.put('/api/banners/:id', async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, image_url, badge } = req.body;
  if (!image_url || !title) {
    return res.status(400).json({ error: 'Title and image_url are required' });
  }
  try {
    const banner = await prisma.banner.update({
      where: { id },
      data: { title, subtitle, image_url, badge }
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// 16. Products: Toggle featured status
app.put('/api/products/:id/featured', async (req, res) => {
  const { id } = req.params;
  const { is_featured } = req.body;
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: { is_featured: !!is_featured }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product featured status' });
  }
});

// 17. Products: Get featured ones
app.get('/api/products/featured', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_featured: true, is_available: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// 18. Comandas: Get unpaid orders by comanda number
app.get('/api/comandas/:number/orders', async (req, res) => {
  const { number } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: {
        comanda_number: number,
        status: { notIn: ['paid', 'canceled'] }
      },
      include: {
        items: { include: { product: true } },
        table_session: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comanda orders' });
  }
});

// 19. Comandas: Pay all unpaid orders for a comanda
app.post('/api/comandas/:number/pay', async (req, res) => {
  const { number } = req.params;
  const { payment_method = 'dinheiro', create_nfce = false } = req.body;

  try {
    // 1. Check if there is an active cash session
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' }
    });
    if (!activeSession) {
      return res.status(400).json({ error: 'Não há caixa aberto. Abra o caixa para registrar pagamentos.' });
    }

    // 2. Fetch all unpaid orders for the comanda
    const ordersToPay = await prisma.order.findMany({
      where: {
        comanda_number: number,
        status: { notIn: ['paid', 'canceled'] }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (ordersToPay.length === 0) {
      return res.status(400).json({ error: 'Nenhum pedido pendente encontrado para esta comanda.' });
    }

    const totalAmount = ordersToPay.reduce((acc, order) => acc + order.total_amount, 0);

    // 3. Emit NFC-e asynchronously if requested
    if (create_nfce) {
      // Fire and forget so we don't block the UI
      processBlingNfce(ordersToPay, payment_method)
        .then(async (blingResult) => {
          await prisma.order.updateMany({
            where: { comanda_number: number, status: 'paid' },
            data: {
              nfce_access_key: blingResult.nfce_access_key
            }
          });
          // Emitting event if clients are listening for async NFC-e updates
          if (io) io.emit('nfce_generated', { comanda_number: number, nfce_access_key: blingResult.nfce_access_key, caminho_danfe: blingResult.linkDanfe });
        })
        .catch(err => {
          console.error("Failed to emit NFC-e during payment async:", err);
          if (io) io.emit('nfce_failed', { comanda_number: number, error: err.message });
        });
    }

    // 4. Update the orders in database
    const updated = await prisma.order.updateMany({
      where: {
        comanda_number: number,
        status: { notIn: ['paid', 'canceled'] }
      },
      data: {
        status: 'paid',
        payment_method,
        nfce_emitted: create_nfce,
        nfce_access_key: null
      }
    });

    // 5. Create the automatic Cash Movement (venda)
    await prisma.cashMovement.create({
      data: {
        id: randomUUID(),
        cash_session_id: activeSession.id,
        type: 'venda',
        method: payment_method,
        amount: totalAmount,
        description: `Pagamento Comanda ${number}`
      }
    });

    // Update expected cash if paid in cash
    if (payment_method === 'dinheiro') {
      await prisma.cashSession.update({
        where: { id: activeSession.id },
        data: { expected_cash: activeSession.expected_cash + totalAmount }
      });
    }

    // 6. Notify clients via Socket
    for (const order of ordersToPay) {
      io.emit('order_status_update', {
        ...order,
        status: 'paid',
        payment_method,
        nfce_emitted: create_nfce,
        nfce_access_key: null
      });
    }

    res.json({
      success: true,
      count: updated.count,
      total_amount: totalAmount,
      payment_method,
      nfce_emitted: create_nfce
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao processar pagamento da comanda.' });
  }
});

async function processBlingNfce(orders, payment_method) {
  // Aggregate items
  const allItems = orders.flatMap(o => o.items);
  const groupedItemsMap = {};
  for (const item of allItems) {
    const pid = item.product.id;
    if (!groupedItemsMap[pid]) {
      groupedItemsMap[pid] = { ...item };
    } else {
      groupedItemsMap[pid].quantity += item.quantity;
    }
  }
  const mergedItems = Object.values(groupedItemsMap);

  let totalAmount = 0;
  
  // 1. Obter os IDs internos do Bling usando os códigos SKU (para evitar tentar recadastrar os produtos)
  const codigos = mergedItems.map(item => item.product.id.slice(0, 8));
  let blingProductsMap = {};
  
  try {
    const queryCodigos = codigos.map(c => `codigo[]=${c}`).join('&');
    if (queryCodigos) {
      const response = await fetchBlingApi(`/produtos?${queryCodigos}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach(p => {
            blingProductsMap[p.codigo] = p.id;
          });
        }
      }
    }
  } catch (err) {
    console.warn("Aviso: Falha ao buscar IDs dos produtos no Bling:", err.message);
  }

  const nfeItens = mergedItems.map((item) => {
    totalAmount += item.quantity * item.unit_price;
    const sku = item.product.id.slice(0, 8);
    
    let itemPayload = {
      quantidade: item.quantity,
      valor: item.unit_price,
      descricao: item.product.name // fallback description
    };
    
    // Se achamos o ID do produto no Bling, nós vinculamos. Se não, tentamos apenas enviar o código.
    if (blingProductsMap[sku]) {
      itemPayload.produto = { id: blingProductsMap[sku] };
    } else {
      itemPayload.codigo = sku;
    }
    
    return itemPayload;
  });

  let formaPagamentoBling = 10490350; // Dinheiro default
  if (payment_method === 'pix') formaPagamentoBling = 10490356;

  const today = new Date().toISOString().split('T')[0];
  
  const payloadBling = {
    data: today,
    dataPrevista: today,
    dataSaida: today,
    contato: {
      id: 18252857321,
      nome: "Consumidor Final"
    },
    itens: nfeItens,
    parcelas: [
      {
        dataVencimento: today,
        formaPagamento: {
          id: formaPagamentoBling
        },
        valor: totalAmount
      }
    ]
  };

  console.log("=== PAYLOAD BLING NFC-e PRONTO PARA ENVIO ===");
  console.log(JSON.stringify(payloadBling, null, 2));
  
  const blingResponse = await emitirNFCeBling(payloadBling);
  return {
    nfce_access_key: blingResponse.numero || `bling-${Date.now()}`,
    linkDanfe: blingResponse.linkDanfe || null,
    payloadBling,
    blingResponse
  };
}

// 19.1 Emit NFC-e after payment
app.post('/api/comandas/:number/emit-nfce', async (req, res) => {
  const { number } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: {
        comanda_number: number,
        status: 'paid'
      },
      include: {
        items: { include: { product: true } }
      }
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Nenhum pedido pago encontrado para esta comanda.' });
    }

    const payment_method = req.body?.payment_method || 'dinheiro';
    
    let result;
    try {
      result = await processBlingNfce(orders, payment_method);
    } catch (apiError) {
      console.error("Bling API Error:", apiError);
      return res.status(400).json({ error: apiError.message });
    }

    await prisma.order.updateMany({
      where: {
        comanda_number: number,
        status: 'paid'
      },
      data: {
        nfce_emitted: true,
        nfce_access_key: result.nfce_access_key
      }
    });

    res.json({ 
      success: true, 
      nfce_access_key: result.nfce_access_key,
      caminho_danfe: result.linkDanfe,
      payload_gerado: result.payloadBling,
      bling_response: result.blingResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao emitir NFC-e.' });
  }
});

// --- CASH REGISTER (CAIXA) ENDPOINTS ---

// Get current active cash session
app.get('/api/cash-session/current', async (req, res) => {
  try {
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' },
      include: { CashMovement: true }
    });
    res.json(activeSession);
  } catch (error) {
    console.error('Error fetching active cash session:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// Open new cash session
app.post('/api/cash-session/open', async (req, res) => {
  const { opening_value, operator_name } = req.body;
  if (opening_value === undefined || !operator_name) {
    return res.status(400).json({ error: 'Valor de abertura e nome do operador são obrigatórios.' });
  }

  try {
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' }
    });
    if (activeSession) {
      return res.status(400).json({ error: 'Já existe um caixa aberto.' });
    }

    const session = await prisma.cashSession.create({
      data: {
        id: randomUUID(),
        status: 'open',
        opening_value: parseFloat(opening_value),
        operator_name,
        expected_cash: parseFloat(opening_value)
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Error opening cash session:', error);
    res.status(500).json({ error: 'Failed to open cash session' });
  }
});

// Add manual cash movement (suprimento/sangria)
app.post('/api/cash-session/movement', async (req, res) => {
  const { type, amount, description } = req.body;
  if (!type || amount === undefined) {
    return res.status(400).json({ error: 'Tipo e valor são obrigatórios.' });
  }

  try {
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' }
    });
    if (!activeSession) {
      return res.status(400).json({ error: 'Não há caixa aberto para registrar movimentação.' });
    }

    // Recalculate cash available in drawer from movements to make sure calculation matches
    const movements = await prisma.cashMovement.findMany({
      where: { cash_session_id: activeSession.id }
    });

    let currentCash = activeSession.opening_value;
    for (const m of movements) {
      if (m.type === 'suprimento' || (m.type === 'venda' && m.method === 'dinheiro')) {
        currentCash += m.amount;
      } else if (m.type === 'sangria') {
        currentCash -= m.amount;
      }
    }

    if (type === 'sangria' && currentCash < parseFloat(amount)) {
      return res.status(400).json({ error: 'Saldo em dinheiro físico insuficiente para sangria.' });
    }

    const movement = await prisma.cashMovement.create({
      data: {
        id: randomUUID(),
        cash_session_id: activeSession.id,
        type,
        amount: parseFloat(amount),
        description: description || '',
        method: 'dinheiro'
      }
    });

    // Update expected cash
    const nextExpectedCash = type === 'suprimento' ? currentCash + parseFloat(amount) : currentCash - parseFloat(amount);
    await prisma.cashSession.update({
      where: { id: activeSession.id },
      data: { expected_cash: nextExpectedCash }
    });

    res.json(movement);
  } catch (error) {
    console.error('Error registering cash movement:', error);
    res.status(500).json({ error: 'Failed to register cash movement' });
  }
});

// Close cash session (Blind close)
app.post('/api/cash-session/close', async (req, res) => {
  const { declared_cash, declared_cards } = req.body;
  if (declared_cash === undefined || declared_cards === undefined) {
    return res.status(400).json({ error: 'Valores declarados de dinheiro e cartões são obrigatórios.' });
  }

  try {
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' }
    });
    if (!activeSession) {
      return res.status(400).json({ error: 'Nenhum caixa aberto encontrado para fechar.' });
    }

    const movements = await prisma.cashMovement.findMany({
      where: { cash_session_id: activeSession.id }
    });

    let calculatedCash = activeSession.opening_value;
    for (const m of movements) {
      if (m.type === 'suprimento' || (m.type === 'venda' && m.method === 'dinheiro')) {
        calculatedCash += m.amount;
      } else if (m.type === 'sangria') {
        calculatedCash -= m.amount;
      }
    }

    const difference = parseFloat(declared_cash) - calculatedCash;

    const closedSession = await prisma.cashSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'closed',
        closed_at: new Date(),
        declared_cash: parseFloat(declared_cash),
        declared_cards: parseFloat(declared_cards),
        expected_cash: calculatedCash,
        difference_cash: difference
      }
    });

    res.json(closedSession);
  } catch (error) {
    console.error('Error closing cash session:', error);
    res.status(500).json({ error: 'Failed to close cash session' });
  }
});


// Get movements for current active session
app.get('/api/cash-session/movements', async (req, res) => {
  try {
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: 'open' }
    });
    if (!activeSession) {
      return res.json([]);
    }
    const movements = await prisma.cashMovement.findMany({
      where: { cash_session_id: activeSession.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    console.error('Error fetching cash movements:', error);
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});


app.get('/api/seed-products', async (req, res) => {
  try {
    let category = await prisma.category.findFirst({
      where: { name: 'Entradas & Porções' }
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Entradas & Porções', sort_order: 1 }
      });
    }

    const products = [
      {
        name: 'TÁBUA DE FRIOS',
        description: 'Copa, queijo colonial, salame italiano, pão caseiro e doce de frutas.',
        price: 60,
        sizes: JSON.stringify([
          { name: 'Inteira (Serve 04 pessoas)', price: 60 },
          { name: 'Meia Porção (Serve 02 pessoas)', price: 40 }
        ]),
        ncm: '2106.90.90', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'NHOQUE FRITO',
        description: '300g de nhoque de batata. Acompanhamento maionese caseira.',
        price: 35,
        ncm: '1902.30.00', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'ARANCINI',
        description: '06 und. de bolinho pomodoro recheado com queijo.',
        price: 42,
        ncm: '2106.90.90', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'BRUSCHETTA DE TOMATE CONFIT',
        description: '04 und. - Pão, tomate confit, manjericão, queijo e molho pesto.',
        price: 36,
        ncm: '1905.90.90', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'PASTEL DE COSTELA',
        description: '06 und. de pastel frito recheado de carne de costela com queijo. Acompanhamento maionese caseira.',
        price: 40,
        ncm: '1905.90.90', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'PASTEL DE RAGU DE LINGUIÇA',
        description: '06 und de pastel recheado com linguiça. Acompanhamento maionese caseira.',
        price: 36,
        ncm: '1905.90.90', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'STEAK COM FRITAS',
        description: '400g de carne tipo Entrecôte e 300 g de batata frita. Acompanhamento maionese caseira.',
        price: 85,
        ncm: '1602.50.00', cfop: '5101', csosn: '102', origem_mercadoria: '0', category_id: category.id
      }
    ];

    for (const p of products) {
      const exists = await prisma.product.findFirst({ where: { name: p.name } });
      if (!exists) {
        await prisma.product.create({ data: p });
      }
    }
    res.json({ success: true, message: 'Produtos cadastrados com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar produtos' });
  }
});

app.get('/api/seed-wines', async (req, res) => {
  try {
    let category = await prisma.category.findFirst({
      where: { name: 'Vinhos' }
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Vinhos', sort_order: 2 }
      });
    }

    const wines = [
      {
        name: 'Altezza Cabernet Sauvignon (Reserva)',
        description: 'Frutas negras maduras, madeira marcante, notas adocicadas de baunilha, chocolate, tabaco e defumado.',
        price: 89,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Bianco Merlot',
        description: 'Notas de frutas vermelhas frescas, como amora, ameixa e cereja negra. Leve floral e figo maduro com a evolução.',
        price: 45,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Bianco Malbec',
        description: 'Coloração rubi e corpo médio, acidez equilibrada, aromas de frutas frescas como ameixa, cereja e amora.',
        price: 45,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Bianco Moscatel Espumante',
        description: 'Grande intensidade e fineza com destaque para aromas florais e frutados. Leve e fresco.',
        price: 45,
        ncm: '2204.10.10', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Fiorella Rosé Demi-Sec',
        description: 'Elaborado com uvas Goethe e Moscato. Aromas que lembram frutas cítricas, pêssego, maçã e flores brancas.',
        price: 45,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Famíglia Bianco Goethe',
        description: 'Aromas frutados de pêssego, melão amarelo e maçã com frescor vibrante, típico da uva Goethe.',
        price: 38,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Bianco Estações Pinot Noir',
        description: 'Vinho tinto fino seco, elegante e leve, expressando as características marcantes da casta Pinot Noir.',
        price: 45,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Fiorella Branco Demi-Sec',
        description: 'Vinho branco levemente adocicado, refrescante, trazendo as notas frutadas e florais marcantes da uva Goethe.',
        price: 45,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Bianco Brut Chardonnay',
        description: 'Aromas que remetem a pêssego, pera e maçã verde, com toques florais. Paladar fresco e cremoso.',
        price: 50,
        ncm: '2204.10.10', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      },
      {
        name: 'Altezza Rosé',
        description: 'Aromas elegantes de pitanga, toranja e morango. Sabores que remetem à romã e sutil tutti-frutti.',
        price: 49,
        ncm: '2204.21.00', cfop: '5102', csosn: '102', origem_mercadoria: '0', category_id: category.id
      }
    ];

    for (const p of wines) {
      const exists = await prisma.product.findFirst({ where: { name: p.name } });
      if (!exists) {
        await prisma.product.create({ data: p });
      }
    }
    res.json({ success: true, message: 'Vinhos cadastrados com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar vinhos' });
  }
});

  return app;
}
