import './env.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import productsRoutes from './routes/products.js';
import cashRoutes from './routes/cash.js';
import reportsRoutes from './routes/reports.js';
import multer from 'multer';
import fs from 'fs';
import { initCronJobs } from './cronJobs.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  // Se o frontend está acessando de outro domínio/porta, pode ser interessante retornar a URL completa, mas como o Vite faz proxy, `/uploads/...` funciona bem.
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- ROUTES ---

// Admin: Sync DB tables manually
import { exec } from 'child_process';
app.get('/api/admin/sync-db', (req, res) => {
  exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stdout, stderr });
    }
    res.json({ message: 'DB Synced Successfully', stdout });
  });
});

app.use('/api/products', productsRoutes(prisma));
app.use('/api/cash-session', cashRoutes(prisma));
app.use('/api/reports', reportsRoutes(prisma));

import apiRoutes from './routes/api.js';

app.use('/', apiRoutes(prisma, io, jwt, JWT_SECRET));

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
  initCronJobs();
});
