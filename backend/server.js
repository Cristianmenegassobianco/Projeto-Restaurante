import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const prisma = new PrismaClient();
const JWT_SECRET = 'super-secret-restaurant-key-for-dev'; // Em prod, usar .env

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 2. Menu (Categories with Products)
app.get('/api/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { is_available: true }
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

// 4. Create Order
app.post('/api/orders', async (req, res) => {
  const { session_id, items, total_amount } = req.body;
  
  if (!session_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    const order = await prisma.order.create({
      data: {
        table_session_id: session_id,
        total_amount,
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
        status: { in: ['pending', 'preparing'] }
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

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
