require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const connectDB = require('./config/db');

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('Cleared existing data');

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

    console.log('Created users');

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

    console.log('Created projects');

    // Create tasks
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const tasks = [
      // E-Commerce Platform tasks
      { title: 'Set up project scaffolding', description: 'Initialize Next.js project with TypeScript and configure build tools', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
      { title: 'Design database schema', description: 'Create ERD and define MongoDB schemas for products, users, orders', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
      { title: 'Implement user authentication', description: 'Build login/signup flow with JWT and OAuth (Google)', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
      { title: 'Build product listing page', description: 'Create product grid with filters, search, and pagination', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'in-progress', priority: 'medium', dueDate: fiveDaysFromNow },
      { title: 'Shopping cart functionality', description: 'Implement add/remove/update cart with persistent storage', project: project1._id, assignee: member1._id, createdBy: admin._id, status: 'todo', priority: 'high', dueDate: sevenDaysFromNow },
      { title: 'Payment integration (Stripe)', description: 'Integrate Stripe checkout and handle webhooks for order processing', project: project1._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'high', dueDate: tenDaysFromNow },
      { title: 'Order management dashboard', description: 'Admin panel for viewing and managing customer orders', project: project1._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: tenDaysFromNow },
      // Overdue task
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', project: project1._id, assignee: member2._id, createdBy: admin._id, status: 'in-progress', priority: 'medium', dueDate: twoDaysAgo },

      // Mobile App Redesign tasks
      { title: 'User research & interviews', description: 'Conduct user interviews and analyze pain points in current app', project: project2._id, assignee: member1._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
      { title: 'Create wireframes', description: 'Design low-fidelity wireframes for all major screens', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
      { title: 'Design system & components', description: 'Build a comprehensive design system with reusable components', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
      { title: 'High-fidelity mockups', description: 'Create pixel-perfect mockups for all screens in Figma', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: fiveDaysFromNow },
      { title: 'Prototype & user testing', description: 'Build interactive prototype and conduct usability testing', project: project2._id, assignee: member1._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: sevenDaysFromNow },
      { title: 'Developer handoff', description: 'Prepare design specs and assets for the development team', project: project2._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'low', dueDate: tenDaysFromNow },

      // API Documentation tasks
      { title: 'Audit existing endpoints', description: 'List all API endpoints and their current documentation status', project: project3._id, assignee: member2._id, createdBy: admin._id, status: 'done', priority: 'high', dueDate: twoDaysAgo },
      { title: 'Set up documentation framework', description: 'Configure Swagger/OpenAPI for auto-generated docs', project: project3._id, assignee: member3._id, createdBy: admin._id, status: 'in-progress', priority: 'high', dueDate: threeDaysFromNow },
      { title: 'Document auth endpoints', description: 'Write comprehensive docs for authentication API', project: project3._id, assignee: member2._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: fiveDaysFromNow },
      { title: 'Document CRUD endpoints', description: 'Write docs for all CRUD operations across services', project: project3._id, assignee: member3._id, createdBy: admin._id, status: 'todo', priority: 'medium', dueDate: sevenDaysFromNow },
      { title: 'Add code examples', description: 'Include request/response examples in multiple languages', project: project3._id, assignee: null, createdBy: admin._id, status: 'todo', priority: 'low', dueDate: tenDaysFromNow },
    ];

    await Task.insertMany(tasks);
    console.log(`Created ${tasks.length} tasks`);

    console.log('\n--- Seed Complete ---');
    console.log('\nDemo Accounts:');
    console.log('  Admin:  admin@taskmanager.com / admin123');
    console.log('  Member: priya@taskmanager.com / member123');
    console.log('  Member: rahul@taskmanager.com / member123');
    console.log('  Member: ananya@taskmanager.com / member123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
