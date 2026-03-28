require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set in .env. Using an insecure fallback. Set a strong secret before deploying.');
}
const _JWT_SECRET = JWT_SECRET || 'insecure-fallback-change-me';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Setup initial admin if it doesn't exist
const setupAdmin = async () => {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('luxury123', 10);
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'James Royale'
      }
    });
    console.log('Default admin created: admin / luxury123');
  }
};
setupAdmin();

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, _JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
// 0. Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, username: admin.username }, _JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { id: admin.id, username: admin.username, name: admin.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Categories
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { items: true },
  });
  res.json(categories);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { name, order } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, order: order || 0 }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/categories/:id', authMiddleware, async (req, res) => {
  const { name, order } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, order }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Menu Items
app.get('/api/items', async (req, res) => {
  const items = await prisma.menuItem.findMany({
    include: { category: true },
  });
  res.json(items);
});

app.post('/api/items', authMiddleware, async (req, res) => {
  const { name, description, price, image, categoryId, ingredients } = req.body;
  try {
    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        categoryId,
        ingredients
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/items/:id', authMiddleware, async (req, res) => {
  const { name, description, price, image, categoryId, inStock, ingredients } = req.body;
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { 
        name, 
        description, 
        price: price !== undefined ? parseFloat(price) : undefined, 
        image, 
        categoryId,
        ingredients
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { menuItem: true } } },
  });
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { sourceType, sourceId, items, totalPrice, notes } = req.body;
  const order = await prisma.order.create({
    data: {
      sourceType,
      sourceId,
      totalPrice,
      status: 'PENDING',
      notes,
      items: {
        create: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtOrder: item.price !== undefined ? item.price : (item.priceAtOrder || 0),
          customizations: JSON.stringify(item.customizations),
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  io.emit('new_order', order);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { menuItem: true } } },
  });

  io.emit('order_updated', order);
  res.json(order);
});


// 8. Uploads
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const host = req.headers.host || `localhost:${process.env.PORT || 3001}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const url = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ url });
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Luxury Menu API running on port ${PORT}`);
});
