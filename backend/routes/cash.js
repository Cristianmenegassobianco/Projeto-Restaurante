import { Router } from 'express';
import { randomUUID } from 'crypto';

export default function cashRoutes(prisma) {
  const router = Router();

  router.get('/current', async (req, res) => {
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

  router.post('/open', async (req, res) => {
    const { opening_value, operator_name } = req.body;
    if (opening_value === undefined || !operator_name) {
      return res.status(400).json({ error: 'Valor de abertura e nome do operador são obrigatórios.' });
    }
    try {
      const activeSession = await prisma.cashSession.findFirst({ where: { status: 'open' } });
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

  router.post('/movement', async (req, res) => {
    const { type, amount, description } = req.body;
    if (!type || amount === undefined) {
      return res.status(400).json({ error: 'Tipo e valor são obrigatórios.' });
    }
    try {
      const activeSession = await prisma.cashSession.findFirst({ where: { status: 'open' } });
      if (!activeSession) {
        return res.status(400).json({ error: 'Não há caixa aberto para registrar movimentação.' });
      }

      const movements = await prisma.cashMovement.findMany({ where: { cash_session_id: activeSession.id } });
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

  router.post('/close', async (req, res) => {
    const { declared_cash, declared_cards } = req.body;
    if (declared_cash === undefined || declared_cards === undefined) {
      return res.status(400).json({ error: 'Valores declarados são obrigatórios.' });
    }
    try {
      const activeSession = await prisma.cashSession.findFirst({ where: { status: 'open' } });
      if (!activeSession) {
        return res.status(400).json({ error: 'Nenhum caixa aberto encontrado.' });
      }

      // 1. Verificar se existem pedidos em aberto (não pagos nem cancelados)
      const openOrdersCount = await prisma.order.count({
        where: {
          status: { notIn: ['paid', 'canceled'] }
        }
      });

      if (openOrdersCount > 0) {
        return res.status(400).json({ 
          error: `Não é possível fechar o caixa. Existem ${openOrdersCount} pedido(s) em aberto no salão. Receba ou cancele todos os pedidos antes de prosseguir.` 
        });
      }

      const movements = await prisma.cashMovement.findMany({ where: { cash_session_id: activeSession.id } });
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

      // 3. Encerrar todas as sessões de mesa ativas para limpar o salão para o dia seguinte
      await prisma.tableSession.updateMany({
        where: { status: 'active' },
        data: { status: 'closed', closed_at: new Date() }
      });

      res.json(closedSession);
    } catch (error) {
      console.error('Error closing cash session:', error);
      res.status(500).json({ error: 'Failed to close cash session' });
    }
  });

  router.get('/history', async (req, res) => {
    try {
      const sessions = await prisma.cashSession.findMany({
        where: { status: 'closed' },
        orderBy: { closed_at: 'desc' }
      });
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cash history' });
    }
  });

  router.get('/movements', async (req, res) => {
    try {
      const activeSession = await prisma.cashSession.findFirst({ where: { status: 'open' } });
      if (!activeSession) return res.json([]);

      const movements = await prisma.cashMovement.findMany({
        where: { cash_session_id: activeSession.id },
        orderBy: { created_at: 'desc' }
      });
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movements' });
    }
  });

  return router;
}
