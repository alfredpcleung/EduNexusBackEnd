# EduNexus Backend

A secure Node.js/Express backend for the EduNexus educational platform with JWT authentication, course catalog, course reviews, projects, feedback, and user management.

**Status:** ✅ Production Ready - All 265 Tests Passing  
**Backend URL:** https://edunexusbackend-mi24.onrender.com  
**Last Updated:** December 13, 2025

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [docs/api.md](docs/api.md) | Full API reference with endpoints, auth, and request/response examples |
| [docs/design.md](docs/design.md) | Backend architecture, data models, and design decisions |
| [docs/project_requirements.md](docs/project_requirements.md) | Project requirements and feature specifications |
| [EduNexusDocs](https://github.com/alfredpcleung/EduNexusDocs) | Central documentation repository (source of truth) |

---

## ⚡ Quick Start

### Prerequisites

- Node.js v24.11.1+ installed
- MongoDB Atlas account with database
- Git installed

### 1. Clone & Install

```bash
git clone https://github.com/alfredpcleung/EduNexusBackEnd.git
cd EduNexusBackEnd
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# MongoDB Atlas Connection String
ATLAS_DB=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Server Port
PORT=3000

# JWT Secret (use a strong random string in production)
JWT_SECRET=dev_local_secret_key_change_in_production
```

> **Getting MongoDB credentials:** See [docs/api.md](docs/api.md#getting-mongodb-atlas-credentials) for detailed instructions.

### 3. Run the Server

```bash
npm start
```

**Expected output:**
```
[dotenv@17.2.3] injecting env (3) from .env
✅ JWT_SECRET is loaded successfully
Server is running at http://localhost:3000/
====> Connected to MongoDb.
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/auth.crud.test.js
npm test -- __tests__/course.controller.test.js
npm test -- __tests__/review.controller.test.js

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage
```

**Test Coverage:** 265 tests across 9 suites

| Suite | Tests |
|-------|-------|
| Authentication | 27 |
| Courses | 33 |
| Reviews | 29 |
| Projects | 45 |
| Feedback | 40 |
| Dashboard | 17 |
| GPA Service | 35 |
| Integration | 16 |
| Auth CRUD | 23 |

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v24.11.1+ |
| Framework | Express.js v5.1.0 |
| Database | MongoDB Atlas (Mongoose v8.19.0) |
| Authentication | JWT (jsonwebtoken v9.0.2) |
| Password Security | Bcrypt v3.1.x |
| Testing | Jest v29.7.0 + Supertest v6.3.3 |
| Deployment | Render.com |

---

## 📁 Project Structure

```
EduNexusBackEnd/
├── App/
│   ├── Controllers/     # Request handlers
│   ├── Models/          # Mongoose schemas
│   ├── Routers/         # Express routes
│   ├── Services/        # Business logic
│   ├── Middleware/      # Custom middleware
│   ├── Constants/       # Static values
│   └── Utils/           # Helper functions
├── Config/
│   └── db.js            # MongoDB connection
├── __tests__/           # Jest test suites
├── docs/                # Documentation
├── Server.js            # App entry point
└── package.json
```

---

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user

### Users
- `GET /api/users` - List all users
- `GET /api/users/:uid` - Get user by UID
- `PUT /api/users/:uid` - Update user (auth required)
- `DELETE /api/users/:uid` - Delete user (auth required)

### Courses
- `GET /api/courses` - List all courses (public)
- `POST /api/courses` - Create course (auth required)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course (auth required)
- `DELETE /api/courses/:id` - Delete course (auth required)

### Reviews
- `GET /api/reviews?courseId=:id` - List reviews for course
- `POST /api/reviews` - Create review (auth + eligibility)
- `PUT /api/reviews/:id` - Update review (author only)
- `DELETE /api/reviews/:id` - Delete review (author only)

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project (auth required)
- `PUT /api/projects/:projectId` - Update (owner only)
- `DELETE /api/projects/:projectId` - Delete (owner only)

### Feedback
- `GET /api/feedback?projectId=:id` - List feedback for project
- `POST /api/feedback` - Create feedback (auth required)
- `PUT /api/feedback/:feedbackId` - Update (author only)
- `DELETE /api/feedback/:feedbackId` - Delete (author only)

### Dashboard
- `GET /api/dashboard/me` - Get user dashboard (auth required)

> **Full API documentation:** See [docs/api.md](docs/api.md)

---

## 🚀 Production Deployment (Render)

1. Push code to GitHub
2. Connect Render to your GitHub repository
3. Set environment variables in Render dashboard:
   - `ATLAS_DB` - Production MongoDB connection string
   - `JWT_SECRET` - Strong random string (min 32 chars)
4. Deploy

> **Detailed instructions:** See [docs/api.md](docs/api.md#production-deployment)

---

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| `secretOrPrivateKey must have a value` | Ensure `.env` file exists with `JWT_SECRET` |
| `bad auth : authentication failed` | Check MongoDB Atlas credentials and IP whitelist |
| `No token provided` | Include `Authorization: Bearer <token>` header |
| Course not in dashboard | Verify course `owner` matches user `uid` |

> **Full troubleshooting:** See [docs/api.md](docs/api.md#troubleshooting)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Commit with clear messages
5. Push and create a pull request

---

## 📄 License

ISC

---

## 👤 Author

Alfred Leung

---

**Repository:** https://github.com/alfredpcleung/EduNexusBackEnd
