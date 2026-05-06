# 🚀 TaskFlow — Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking progress with **role-based access control** (Admin/Member).

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (**Admin** & **Member**)
- Secure password hashing with bcrypt
- Profile update & password change endpoints

### Project Management
- Create, update, and delete projects (Admin only)
- Add/remove team members to projects
- Color-coded project cards with task statistics
- Search and filter projects by status

### Task Management
- Create, assign, and track tasks within projects
- Three-column Kanban board (To Do → In Progress → Done)
- Priority levels (Low, Medium, High)
- Due date tracking with overdue detection
- Members can update status of their assigned tasks
- Search, sort, and filter tasks with pagination
- Assignee validation against project membership

### Dashboard
- Overview statistics (projects, tasks, completion rate)
- Task distribution breakdown by status and priority
- Per-project completion statistics
- Recent tasks feed
- Overdue tasks alert table

### Team Management
- View all team members (Admin only)
- Search users by name or email
- Update user roles (Admin only)
- Delete users with automatic task cleanup (Admin only)

### Security & Production Features
- **Helmet** — Security headers
- **Rate Limiting** — API (100 req/15min) & Auth (20 req/15min)
- **Morgan** — HTTP request logging
- **Global Error Handler** — Structured error responses
- **Graceful Shutdown** — Clean SIGTERM handling
- **Input Validation** — Express Validator on all endpoints
- **Pagination** — All list endpoints support `page` & `limit`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT, Express Validator |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Security** | Helmet, Rate Limiting, bcrypt, CORS |
| **Logging** | Morgan (dev + combined modes) |
| **Styling** | Vanilla CSS (Dark theme, Glassmorphism) |
| **Deployment** | Railway |

---

## 📁 Project Structure

```
team-task-manager/
├── client/                  # React Frontend (Vite)
│   ├── src/
│   │   ├── components/      # Layout, Sidebar, ProtectedRoute
│   │   ├── context/         # AuthContext (JWT auth state)
│   │   ├── pages/           # Dashboard, Projects, ProjectDetail, Team, Login, Register
│   │   ├── services/        # Axios API service
│   │   ├── App.jsx          # Root component with routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Design system & global styles
│   └── vite.config.js       # Vite config with API proxy
├── server/                  # Express Backend
│   ├── config/              # Database connection
│   ├── middleware/           # Auth, RBAC, Error Handler, Rate Limiter
│   ├── models/              # Mongoose models (User, Project, Task)
│   ├── routes/              # API routes (auth, projects, tasks, users, dashboard)
│   ├── index.js             # Server entry point
│   └── seed.js              # Demo data seeder
├── package.json             # Root scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB Atlas** account (free tier) — [Create one here](https://www.mongodb.com/atlas)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/team-task-manager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 4. Seed demo data (optional)
```bash
npm run seed
```

This creates demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskmanager.com | admin123 |
| Member | priya@taskmanager.com | member123 |
| Member | rahul@taskmanager.com | member123 |
| Member | ananya@taskmanager.com | member123 |

### 5. Run in development mode
Open two terminals:

**Terminal 1 — Backend:**
```bash
npm run dev:server
```

**Terminal 2 — Frontend:**
```bash
npm run dev:client
```

Frontend runs at `http://localhost:5173` with API proxy to backend at `http://localhost:5000`.

---

## 🌐 Deployment (Railway)

### 1. Build frontend
```bash
npm run build:client
```
This outputs the React build to `server/public/`.

### 2. Deploy to Railway
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Set environment variables in Railway dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a secure secret key
   - `NODE_ENV` — `production`
5. Set the **Start Command** to: `cd server && npm start`
6. Generate a public domain from Settings → Networking

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login & get token | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile (name/email) | Private |
| PUT | `/api/auth/password` | Change password | Private |

### Projects
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects` | List projects (paginated, searchable) | Private |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/:id` | Get project | Private |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project + tasks | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

**Query Parameters** for `GET /api/projects`:
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 50)
- `status` — Filter by status (active/completed/archived)
- `search` — Search by project name

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tasks` | List tasks (paginated, filterable) | Private |
| POST | `/api/tasks` | Create task | Admin |
| GET | `/api/tasks/:id` | Get task by ID | Private |
| PUT | `/api/tasks/:id` | Update task | Admin/Assignee |
| PATCH | `/api/tasks/:id/status` | Update status | Admin/Assignee |
| DELETE | `/api/tasks/:id` | Delete task | Admin |

**Query Parameters** for `GET /api/tasks`:
- `page`, `limit` — Pagination
- `project` — Filter by project ID
- `status` — Filter by status (todo/in-progress/done)
- `assignee` — Filter by assignee ID
- `priority` — Filter by priority (low/medium/high)
- `search` — Search by task title
- `sortBy` — Sort field (title/status/priority/dueDate/createdAt)
- `order` — Sort order (asc/desc)

### Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats` | Get dashboard stats | Private |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List all users (paginated) | Admin |
| GET | `/api/users/search?q=` | Search users | Private |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id/role` | Update user role | Admin |
| DELETE | `/api/users/:id` | Delete user + cleanup | Admin |

### Health Check
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/health` | Server health & uptime | Public |

---

## 🔐 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| View Dashboard | ✅ | ✅ |
| Create Projects | ✅ | ❌ |
| Delete Projects | ✅ | ❌ |
| Add/Remove Members | ✅ | ❌ |
| Create Tasks | ✅ | ❌ |
| Edit Tasks | ✅ | ❌ |
| Update Task Status | ✅ | ✅ (assigned only) |
| Delete Tasks | ✅ | ❌ |
| View Team | ✅ | ❌ |
| Manage Users | ✅ | ❌ |
| Update Profile | ✅ | ✅ |
| Change Password | ✅ | ✅ |

---

## 🔒 Security Features

- **Helmet** — Sets various HTTP security headers
- **Rate Limiting** — Prevents brute force attacks (100 API / 20 Auth per 15 min)
- **JWT Authentication** — Stateless token-based auth with 7-day expiry
- **Password Hashing** — bcrypt with salt rounds of 12
- **Input Validation** — Express Validator on all mutation endpoints
- **CORS** — Configured for specific origins
- **Global Error Handler** — Structured error responses with stack traces in dev

---

## 📝 License

MIT License — feel free to use this project for learning and assignments.
