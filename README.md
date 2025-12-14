# EduNexus Backend

A Node.js/Express backend for the EduNexus educational platform.

**Status:** ✅ Production Ready (265 tests passing)  
**URL:** https://edunexusbackend-mi24.onrender.com

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/api.md](docs/api.md) | API endpoint reference |
| [docs/design.md](docs/design.md) | Architecture & data models |
| [docs/project_requirements.md](docs/project_requirements.md) | Feature requirements |
| [EduNexusDocs](https://github.com/alfredpcleung/EduNexusDocs) | Central docs (source of truth) |

---

## Quick Start

### Prerequisites
- Node.js v24.11.1+
- MongoDB Atlas account

### Install & Run

```bash
git clone https://github.com/alfredpcleung/EduNexusBackEnd.git
cd EduNexusBackEnd
npm install
```

Create `.env`:
```env
ATLAS_DB=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
PORT=3000
JWT_SECRET=your_secret_key
ENFORCE_INSTITUTION_DOMAIN=your_domain.com
```

```bash
npm start
```

### Run Tests

```bash
npm test                                    # All tests
npm test -- __tests__/auth.crud.test.js     # Specific suite
npm test -- --coverage                      # With coverage
```

---

## API Overview

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/signin` |
| Users | `GET/PUT/DELETE /api/users/:uid` |
| Courses | `GET/POST/PUT/DELETE /api/courses/:id` |
| Reviews | `GET/POST/PUT/DELETE /api/reviews/:id` |
| Projects | `GET/POST/PUT/DELETE /api/projects/:id` |
| Feedback | `GET/POST/PUT/DELETE /api/feedback/:id` |
| Dashboard | `GET /api/dashboard/me` |

> Full details: [docs/api.md](docs/api.md)

---

## Deployment (Render)

1. Push to GitHub
2. Connect repo to [Render.com](https://render.com)
3. Set env vars: `ATLAS_DB`, `JWT_SECRET`
4. Deploy

---

## License

ISC | Alfred Leung

---

## Environment Variables

Add the following to your `.env` file:

- `ATLAS_DB`: MongoDB connection string.
- `PORT`: Port number for the server (default: 3000).
- `JWT_SECRET`: Secret key for JWT authentication.
- `ENFORCE_INSTITUTION_DOMAIN`: (Optional) Restrict user emails to a specific domain (e.g., `example.com`).
