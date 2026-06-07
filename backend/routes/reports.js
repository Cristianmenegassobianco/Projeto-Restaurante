import express from 'express';

export default function(prisma) {
  const router = express.Router();

  const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
  const getEndOfDay = (date) => new Date(date.setHours(23, 59, 59, 999));
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).setHours(0,0,0,0);
  };
  const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

  router.get('/dashboard', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const now = new Date();

      const queryStart = startDate ? new Date(startDate + 'T00:00:00') : getStartOfDay(new Date(now));
      
      // Se tiver endDate, pegamos o final do dia da data escolhida.
      let queryEnd = getEndOfDay(new Date(now));
      if (endDate) {
         const eDate = new Date(endDate + 'T00:00:00');
         queryEnd = getEndOfDay(eDate);
      }

      // 1. Vendas no período (Orders with status 'paid')
      const orders = await prisma.order.findMany({
        where: {
          created_at: { gte: queryStart, lte: queryEnd },
          status: 'paid'
        },
        orderBy: { created_at: 'desc' }
      });
      const totalSalesAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);

      // 2. Valores recebidos (movimentações de caixa, inclui cartões se registrados como venda)
      const movements = await prisma.cashMovement.findMany({
        where: { created_at: { gte: queryStart, lte: queryEnd } },
        orderBy: { created_at: 'desc' }
      });
      
      const totalMovementsIn = movements.filter(m => m.type === 'suprimento' || m.type === 'venda').reduce((s, m) => s + m.amount, 0);
      const totalMovementsOut = movements.filter(m => m.type === 'sangria').reduce((s, m) => s + m.amount, 0);

      // 3. Aberturas de caixa do mês, semana e dia (Totais)
      const todayStart = getStartOfDay(new Date());
      const weekStart = new Date(getStartOfWeek(new Date()));
      const monthStart = getStartOfMonth(new Date());

      const sessionsSinceMonth = await prisma.cashSession.findMany({
        where: { opened_at: { gte: monthStart } }
      });

      const cashOpenings = {
        today: sessionsSinceMonth.filter(s => s.opened_at >= todayStart).reduce((sum, s) => sum + s.opening_value, 0),
        week: sessionsSinceMonth.filter(s => s.opened_at >= weekStart).reduce((sum, s) => sum + s.opening_value, 0),
        month: sessionsSinceMonth.reduce((sum, s) => sum + s.opening_value, 0),
      };

      // Sessoes de caixa específicas do período
      const sessionsInInterval = await prisma.cashSession.findMany({
        where: { opened_at: { gte: queryStart, lte: queryEnd } },
        orderBy: { opened_at: 'desc' }
      });

      res.json({
        interval: { start: queryStart, end: queryEnd },
        sales: { list: orders, total: totalSalesAmount },
        movements: { list: movements, totalIn: totalMovementsIn, totalOut: totalMovementsOut },
        cashSessions: sessionsInInterval,
        cashOpenings // { today, week, month }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  });

  return router;
}
