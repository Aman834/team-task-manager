require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS Configuration ──────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || true
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Serve Static Files ──────────────────────────────────────────
const fs = require('fs');
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(path.join(publicPath, 'index.html'))) {
  app.use(express.static(publicPath));
  // Catch-all: serve index.html for any non-API route (SPA support)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// ─── Global Error Handler (must be LAST middleware) ──────────────
app.use(errorHandler);

// ─── Auto-Seed for In-Memory DB ─────────────────────────────────
async function seedDemoData() {
  const User = require('./models/User');
  const Project = require('./models/Project');
  const Task = require('./models/Task');

  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Already seeded

  console.log('🌱 Seeding demo data into in-memory database...');

  // Create users
  const admin = await User.create({
    name: 'Aman Gupta',
    email: 'admin@taskmanager.com',
    password: 'admin123',
    role: 'admin',
  });

  const member1 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@taskmanager.com',
    password: 'member123',
    role: 'member',
  });

  const member2 = await User.create({
    name: 'Rahul Singh',
    email: 'rahul@taskmanager.com',
    password: 'member123',
    role: 'member',
  });

  const member3 = await User.create({
    name: 'Ananya Patel',
    email: 'ananya@taskmanager.com',
    password: 'member123',
    role: 'member',
  });

  // Create projects
  const project1 = await Project.create({
    name: 'E-Commerce Platform',
    description: 'Build a modern e-commerce platform with payment integration and inventory management',
    owner: admin._id,
    members: [admin._id, member1._id, member2._id],
    status: 'active',
    color: '#6366f1',
  });

  const project2 = await Project.create({
    name: 'Mobile App Redesign',
    description: 'Redesign the mobile application UI/UX for better user engagement',
    owner: admin._id,
    members: [admin._id, member1._id, member3._id],
    status: 'active',
    color: '#f59e0b',
  });

  const project3 = await Project.create({
    name: 'API Documentation',
    description: 'Create comprehensive API documentation for all microservices',
    owner: admin._id,
    members: [admin._id, member2._id, member3._id],
    status: 'active',
    color: '#10b981',
  });

  // Create tasks
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  await Task.insertMany([
    { title: 'Set up project scaffolding', description: 'Initialize Next.js project with TypeScript and configure build tools', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
    { title: 'Design database schema', description: 'Create ERD and define MongoDB schemas for products, users, orders', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
    { title: 'Implement user authentication', description: 'Build login/signup flow with JWT and OAuth', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
    { title: 'Build product listing page', description: 'Create product grid with filters, search, and pagination', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'in-progress', priority: 'medium', dueDate: fiveDaysFromNow },
    { title: 'Shopping cart functionality', description: 'Implement add/remove/update cart with persistent storage', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'todo', priority: 'high', dueDate: sevenDaysFromNow },
    { title: 'Payment integration (Stripe)', description: 'Integrate Stripe checkout and handle webhooks', project: project1._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'high', dueDate: tenDaysFromNow },
    { title: 'Order management dashboard', description: 'Admin panel for viewing and managing customer orders', project: project1._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: tenDaysFromNow },
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'in-progress', priority: 'medium', dueDate: twoDaysAgo },
    { title: 'User research & interviews', description: 'Conduct user interviews and analyze pain points', project: project2._id, assignee: member1._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
    { title: 'Create wireframes', description: 'Design low-fidelity wireframes for all major screens', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
    { title: 'Design system & components', description: 'Build a comprehensive design system with reusable components', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
    { title: 'High-fidelity mockups', description: 'Create pixel-perfect mockups for all screens in Figma', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: fiveDaysFromNow },
    { title: 'Prototype & user testing', description: 'Build interactive prototype and conduct usability testing', project: project2._id, assignee: member1._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: sevenDaysFromNow },
    { title: 'Developer handoff', description: 'Prepare design specs and assets for the development team', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'low', dueDate: tenDaysFromNow },
    { title: 'Audit existing endpoints', description: 'List all API endpoints and their current documentation status', project: project3._id, assignee: member2._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
    { title: 'Set up documentation framework', description: 'Configure Swagger/OpenAPI for auto-generated docs', project: project3._id, assignee: member3._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
    { title: 'Document auth endpoints', description: 'Write comprehensive docs for authentication API', project: project3._id, assignee: member2._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: fiveDaysFromNow },
    { title: 'Document CRUD endpoints', description: 'Write docs for all CRUD operations across services', project: project3._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: sevenDaysFromNow },
    { title: 'Add code examples', description: 'Include request/response examples in multiple languages', project: project3._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'low', dueDate: tenDaysFromNow },
  ]);

  console.log('✅ Demo data seeded successfully!');
  console.log('   Admin:  admin@taskmanager.com / admin123');
  console.log('   Member: priya@taskmanager.com / member123');
}

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedDemoData();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
}

startServer();

module.exports = app;
