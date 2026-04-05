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

// Multer Config - Memory Storage for DB-backed images
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadDir));

// Setup initial data if it doesn't exist
const setupInitialData = async () => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('luxury123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          name: 'James Royale',
          role: 'ADMIN'
        }
      });
      console.log('✅ Default admin created: admin / luxury123');
    }

    const settingsCount = await prisma.settings.count();
    if (settingsCount === 0) {
      await prisma.settings.create({
        data: {
          hotelName: 'NORA LUXE',
          currency: 'USD',
          supportEmail: 'concierge@nora-resort.com'
        }
      });
      console.log('✅ Default settings created');
    }
  } catch (err) {
    console.error('❌ CRITICAL ERROR initializing database:', err.message);
  }
};
setupInitialData();

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, _JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

// Routes
// 0. Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, _JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 0.5. Staff/Users
app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({ 
    select: { id: true, username: true, name: true, role: true, assignedTables: true, createdAt: true } 
  });
  res.json(users);
});

app.post('/api/users', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, name, role, assignedTables } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        username, 
        password: hashedPassword, 
        name, 
        role: role || 'WAITER',
        assignedTables: assignedTables || ''
      },
      select: { id: true, username: true, name: true, role: true, assignedTables: true }
    });
    res.json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', authMiddleware, async (req, res) => {
  // Allow if ADMIN or if the user is updating themselves
  if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, role, password, assignedTables } = req.body;
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    
    // Only ADMIN can change roles and assignments
    if (req.user?.role === 'ADMIN') {
      if (role !== undefined) updateData.role = role;
      if (assignedTables !== undefined) updateData.assignedTables = assignedTables;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, assignedTables: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  const { mealType } = req.query;
  
  try {
    const finalWhere = {};
    if (mealType && mealType !== 'ALL') {
      finalWhere.OR = [
        { mealType: mealType },
        { mealType: 'ALL' }
      ];
    }
    const categories = await prisma.category.findMany({
      where: finalWhere,
      orderBy: { order: 'asc' },
      include: { items: true },
    });
    res.json(categories);
  } catch (dbErr) {
    // Fallback if mealType column doesn't exist
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { items: true },
    });
    res.json(categories);
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { name, order, mealType } = req.body;
  try {
    const data = { name, order: order || 0 };
    // Only attempt to set mealType if it's provided, and we'll try to save it
    // If the database isn't migrated, Prisma might throw an error here
    try {
      const category = await prisma.category.create({
        data: { ...data, mealType: mealType || 'ALL' }
      });
      return res.json(category);
    } catch (dbErr) {
      // Fallback if mealType column doesn't exist yet
      if (dbErr.code === 'P2002' || dbErr.message.includes('mealType')) {
        const category = await prisma.category.create({ data });
        return res.json(category);
      }
      throw dbErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/categories/:id', authMiddleware, async (req, res) => {
  const { name, order, mealType } = req.body;
  try {
    const data = {};
    if (name) data.name = name;
    if (order !== undefined) data.order = parseInt(order);
    
    try {
      if (mealType) data.mealType = mealType;
      const category = await prisma.category.update({
        where: { id: req.params.id },
        data
      });
      return res.json(category);
    } catch (dbErr) {
      if (dbErr.code === 'P2002' || dbErr.message.includes('mealType') || dbErr.message.includes('Unknown arg')) {
        delete data.mealType;
        const category = await prisma.category.update({
          where: { id: req.params.id },
          data
        });
        return res.json(category);
      }
      throw dbErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete all items in this category first to avoid foreign key constraints
    await prisma.menuItem.deleteMany({
      where: { categoryId: id }
    });
    
    // 2. Delete the category itself
    await prisma.category.delete({
      where: { id: id }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Menu Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
    });
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', authMiddleware, async (req, res) => {
  const { name, description, price, costPrice, image, categoryId, ingredients } = req.body;
  
  if (!name || !categoryId || price === undefined) {
    return res.status(400).json({ error: 'Name, Price and Category are required' });
  }

  const priceVal = parseFloat(price);
  if (isNaN(priceVal)) return res.status(400).json({ error: 'Invalid price' });

  try {
    const data = {
      name,
      description,
      price: priceVal,
      image,
      categoryId,
      ingredients,
      inStock: true
    };
    
    try {
      if (costPrice !== undefined) {
        const costVal = parseFloat(costPrice);
        if (!isNaN(costVal)) data.costPrice = costVal;
      }
      const item = await prisma.menuItem.create({ data });
      return res.json(item);
    } catch (dbErr) {
      console.warn('❌ Item creation DB error:', dbErr.message);
      if (dbErr.message.includes('costPrice')) {
        delete data.costPrice;
        const item = await prisma.menuItem.create({ data });
        return res.json(item);
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('❌ CRITICAL ERROR creating item:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/items/:id', authMiddleware, async (req, res) => {
  const { name, description, price, costPrice, image, categoryId, inStock, ingredients } = req.body;
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      const priceVal = parseFloat(price);
      if (!isNaN(priceVal)) updateData.price = priceVal;
    }
    if (costPrice !== undefined) {
      const costVal = parseFloat(costPrice);
      if (!isNaN(costVal)) updateData.costPrice = costVal;
    }
    if (image !== undefined) updateData.image = image;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (inStock !== undefined) updateData.inStock = inStock;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(item);
  } catch (err) {
    console.error(`❌ ERROR updating item ${req.params.id}:`, err);
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
  try {
    let where = {};
    
    // Filter by assigned tables if the user is a WAITER
    if (req.user?.role === 'WAITER') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user?.assignedTables) {
        const tableIds = user.assignedTables.split(',').map(s => s.trim()).filter(Boolean);
        console.log('DEBUG [Orders]: Waiter assigned tables:', tableIds);
        where.sourceType = 'Table';
        where.sourceId = { in: tableIds };
      } else {
        console.log('DEBUG [Orders]: Waiter has no assigned tables');
        where.sourceId = 'NONE-ASSIGNED'; 
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { menuItem: true } } },
    });
    res.json(orders);
  } catch (err) {
    console.error('CRITICAL ERROR [GET /api/orders]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { sourceType, sourceId, mealType, items, totalPrice, notes, customerPhone, paymentMethod } = req.body;
  
  try {
    // 1. Prepare base data
    const baseItemData = items.map(item => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      priceAtOrder: item.price !== undefined ? item.price : (item.priceAtOrder || 0),
      customizations: typeof item.customizations === 'string' ? item.customizations : JSON.stringify(item.customizations || {}),
    }));

    const orderData = {
      sourceType,
      sourceId,
      mealType,
      paymentMethod: paymentMethod || 'CASH',
      totalPrice,
      status: 'PENDING',
      notes: notes || '',
      customerPhone: customerPhone || ''
    };

    // 2. Fetch cost prices for items
    let costMap = {};
    try {
      const dbItems = await prisma.menuItem.findMany({
        where: { id: { in: items.map(i => i.menuItemId) } }
      });
      dbItems.forEach(mi => costMap[mi.id] = mi.costPrice || 0);
    } catch (e) {
      console.warn('Could not fetch cost prices, defaulting to 0');
    }

    let order;
    try {
      // Level 1: Try with everything including costPriceAtOrder
      order = await prisma.order.create({
        data: { 
          ...orderData, 
          items: { 
            create: baseItemData.map((bid, idx) => ({
              ...bid,
              costPriceAtOrder: costMap[items[idx].menuItemId] || 0
            }))
          } 
        },
        include: { items: { include: { menuItem: true } } },
      });
    } catch (err1) {
      console.warn('Order creation fallback level 1:', err1.message);
      try {
        // Level 2: Fallback without costPriceAtOrder
        order = await prisma.order.create({
          data: { ...orderData, items: { create: baseItemData } },
          include: { items: { include: { menuItem: true } } },
        });
      } catch (err2) {
        console.warn('Order creation fallback level 2:', err2.message);
        // Level 3: Deep fallback without paymentMethod and costPriceAtOrder
        const safeOrderData = { ...orderData };
        delete safeOrderData.paymentMethod;
        order = await prisma.order.create({
          data: { ...safeOrderData, items: { create: baseItemData } },
          include: { items: { include: { menuItem: true } } },
        });
      }
    }

    io.emit('new_order', order);
    return res.status(201).json(order);
  } catch (err) {
    console.error('CRITICAL ORDER ERROR:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.patch('/api/orders/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;
  
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: { include: { menuItem: true } } },
  });

  io.emit('order_updated', order);
  
  // If food is ready, send a specific notification
  if (status === 'READY') {
    io.emit('food_ready', {
      orderId: order.id,
      tableId: order.sourceId,
      message: `Food is ready for Table ${order.sourceId}`
    });
  }
  
  res.json(order);
});

// 4. Tables / Sources
app.get('/api/sources', authMiddleware, async (req, res) => {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { identifier: 'asc' }
    });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sources', authMiddleware, adminOnly, async (req, res) => {
  const { type, identifier } = req.body;
  try {
    const source = await prisma.source.create({
      data: { type, identifier }
    });
    res.json(source);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/sources/:id', authMiddleware, adminOnly, async (req, res) => {
  const { type, identifier } = req.body;
  try {
    const source = await prisma.source.update({
      where: { id: req.params.id },
      data: { type, identifier }
    });
    res.json(source);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.source.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 8. Uploads (Database-backed Base64) - Multiple support
app.post('/api/upload', authMiddleware, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  
  try {
    const urls = req.files.map(file => {
      const base64Image = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64Image}`;
    });
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process images' });
  }
});

// 9. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/settings', authMiddleware, async (req, res) => {
  const { hotelName, currency, supportEmail } = req.body;
  try {
    const settings = await prisma.settings.findFirst();
    let updated;
    if (!settings) {
      updated = await prisma.settings.create({ data: { hotelName, currency, supportEmail } });
    } else {
      updated = await prisma.settings.update({
        where: { id: settings.id },
        data: { hotelName, currency, supportEmail }
      });
    }
    io.emit('settings_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ UNHANDLED SERVER ERROR:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

server.listen(PORT, () => {
  console.log(`Luxury Menu API running on port ${PORT}`);
});
