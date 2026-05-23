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

async function seedDefaults() {
  try {
    const bannerCount = await prisma.banner.count();
    if (bannerCount === 0) {
      const defaultBanners = [
        {
          title: "Combo Artesanal",
          subtitle: "Hambúrguer Blend + Fritas por R$ 45,90",
          image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
          badge: "O Mais Pedido 🔥"
        },
        {
          title: "Sucos Naturais",
          subtitle: "Refresque-se com sucos feitos na hora",
          image_url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600",
          badge: "100% Natural 🍊"
        },
        {
          title: "Porção de Batata Rústica",
          subtitle: "Com cheddar cremoso e bacon crocante",
          image_url: "https://images.unsplash.com/photo-1576107223847-c3b889505c21?w=600",
          badge: "Destaque da Casa ⭐"
        }
      ];
      for (const banner of defaultBanners) {
        await prisma.banner.create({ data: banner });
      }
      console.log('Default banners seeded');
    }

    const featuredCount = await prisma.product.count({ where: { is_featured: true } });
    if (featuredCount === 0) {
      const firstProduct = await prisma.product.findFirst();
      if (firstProduct) {
        await prisma.product.update({
          where: { id: firstProduct.id },
          data: { is_featured: true }
        });
        console.log(`Default featured product set: ${firstProduct.name}`);
      }
    }
  } catch (err) {
    console.error('Error seeding defaults:', err);
  }
}
seedDefaults();

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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
  const { session_id, items, total_amount, comanda_number } = req.body;
  
  if (!session_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    const order = await prisma.order.create({
      data: {
        table_session_id: session_id,
        total_amount,
        comanda_number: comanda_number || null,
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

// 7. Products: Create new product
app.post('/api/products', async (req, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const product = await prisma.product.create({
      data: {
        category_id,
        name,
        description,
        price: parseFloat(price),
        image_url,
        is_available: true
      }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// 8. Products: Toggle availability
app.put('/api/products/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updated = await prisma.product.update({
      where: { id },
      data: { is_available: !product.is_available }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle product availability' });
  }
});

// 9. Products: Delete product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
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

// 11. Admin: Get all menu categories and products (including unavailable ones)
app.get('/api/admin/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true
      },
      orderBy: { sort_order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin menu' });
  }
});

// 12. Client: Get orders for a session
app.get('/api/sessions/:session_id/orders', async (req, res) => {
  const { session_id } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: { table_session_id: session_id },
      include: {
        items: { include: { product: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session orders' });
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

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
