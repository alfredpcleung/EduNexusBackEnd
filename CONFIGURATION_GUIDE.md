# Configuration Guide: Frontend & Backend Setup

**Last Updated:** December 11, 2025

## Table of Contents

1. [Backend Configuration](#backend-configuration)
2. [Frontend Configuration](#frontend-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Backend Configuration

### Prerequisites

- Node.js v24.11.1+ installed
- MongoDB Atlas account with database
- Git installed

### Environment Variables (.env)

Create a `.env` file in the root of `EduNexusBackEnd/`:

```env
# MongoDB Atlas Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/database
ATLAS_DB=mongodb+srv://edunexus_user:nsGZgrgpQLWK6ej9@cluster0.lc1sdts.mongodb.net/edunexus

# Server Port
PORT=3000

# JWT Secret (use a strong random string, min 32 characters in production)
JWT_SECRET=dev_local_secret_key_change_in_production
```

### Environment Variable Explanations

| Variable | Required | Description |
|----------|----------|-------------|
| `ATLAS_DB` | Yes | MongoDB Atlas connection string with credentials |
| `PORT` | No | Server port (default: 3000) |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens. Min 32 chars in production. |

### Getting MongoDB Atlas Credentials

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click **Connect**
4. Choose **Drivers** option
5. Copy the connection string
6. Replace `<username>` and `<password>` with your credentials
7. Replace `<database>` with your database name (e.g., `edunexus`)

**Example:**
```
mongodb+srv://edunexus_user:nsGZgrgpQLWK6ej9@cluster0.lc1sdts.mongodb.net/edunexus
```

### Testing Environment (.env.test)

Pre-configured for Jest testing. Located at `EduNexusBackEnd/.env.test`:

```env
ATLAS_DB=mongodb+srv://testuser:testpass@cluster0.lc1sdts.mongodb.net/edunexus_test
PORT=3000
JWT_SECRET=test_jwt_secret_key_for_testing_purposes_only
```

### Starting the Backend

```bash
cd EduNexusBackEnd
npm install
npm start
```

**Expected Output:**
```
[dotenv@17.2.3] injecting env (3) from .env
✅ JWT_SECRET is loaded successfully
Server is running at  http://localhost:3000/
====> Connected to MongoDb.
```

---

## Frontend Configuration

### Prerequisites

- Node.js v18+ installed
- npm or yarn
- Vite 5.x (included in project)

### Project Setup

```bash
cd EduNexusFrontEnd
npm install
```

### Environment Variables (.env)

Create a `.env` file in `EduNexusFrontEnd/`:

#### Local Development
```env
# Firebase Configuration (optional - for future use)
VITE_APP_FIREBASECONFIG={"apiKey":"YOUR_API_KEY","authDomain":"YOUR_PROJECT.firebaseapp.com","projectId":"YOUR_PROJECT_ID","storageBucket":"YOUR_PROJECT.appspot.com","messagingSenderId":"YOUR_MESSAGING_SENDER_ID","appId":"YOUR_APP_ID"}

# Backend API Base URL (points to local Node.js backend)
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Production (Render Deployment)
```env
VITE_APP_FIREBASECONFIG={"apiKey":"YOUR_API_KEY","authDomain":"YOUR_PROJECT.firebaseapp.com","projectId":"YOUR_PROJECT_ID","storageBucket":"YOUR_PROJECT.appspot.com","messagingSenderId":"YOUR_MESSAGING_SENDER_ID","appId":"YOUR_APP_ID"}

# Backend API Base URL (points to Render deployment)
VITE_API_BASE_URL=https://edunexusbackend-mi24.onrender.com/api
```

### Running the Frontend

**Development Mode:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

### Frontend Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI)
- **State Management:** React Context API
- **HTTP Client:** Fetch API

---

## Local Development Setup

### Step 1: Clone Repositories

```bash
# Clone backend
git clone https://github.com/alfredpcleung/EduNexusBackEnd.git
cd EduNexusBackEnd

# In another terminal, clone frontend
git clone https://github.com/alfredpcleung/EduNexusFrontEnd.git
cd EduNexusFrontEnd
```

### Step 2: Backend Setup

```bash
cd EduNexusBackEnd
npm install

# Create .env file with MongoDB and JWT credentials
echo "ATLAS_DB=mongodb+srv://...
PORT=3000
JWT_SECRET=dev_secret_key" > .env

npm start
```

**Verify:** Backend running at `http://localhost:3000`

### Step 3: Frontend Setup

```bash
cd EduNexusFrontEnd
npm install

# Create .env file pointing to local backend
echo "VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_FIREBASECONFIG={...}" > .env

npm run dev
```

**Verify:** Frontend running at `http://localhost:5173`

### Step 4: Test the Connection

1. Open `http://localhost:5173` in browser
2. Sign up with test account
3. Create a course
4. Check dashboard - course should appear
5. Open DevTools → Network tab to verify requests to `http://localhost:3000/api`

---

## Production Deployment

### Backend Deployment (Render)

1. **Push to GitHub:**
```bash
cd EduNexusBackEnd
git add .
git commit -m "production deployment"
git push origin main
```

2. **Connect to Render:**
   - Go to [Render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start` or `node Server.js`

3. **Set Environment Variables in Render Dashboard:**
   - `ATLAS_DB`: Your production MongoDB connection string
   - `PORT`: Keep as 3000 (Render assigns the actual port)
   - `JWT_SECRET`: Strong random string (min 32 chars)

4. **Deploy:**
   - Click "Create Web Service"
   - Render builds and deploys automatically

### Frontend Deployment (Render / Vercel)

#### Option A: Render
```bash
# Create .env.production
echo "VITE_API_BASE_URL=https://your-render-backend-url/api" > .env

npm run build
# Upload 'dist' folder to Render
```

#### Option B: Vercel
```bash
npm install -g vercel
vercel
# Follow prompts to deploy
```

### Update Frontend API URL

Once backend is deployed to Render:

```env
# EduNexusFrontEnd/.env (update with your Render URL)
VITE_API_BASE_URL=https://edunexusbackend-mi24.onrender.com/api
```

Redeploy frontend:
```bash
npm run build
vercel --prod  # or re-push to Render
```

---

## Troubleshooting

### Backend Issues

#### Error: "secretOrPrivateKey must have a value"

**Cause:** JWT_SECRET not loaded from .env

**Solution:**
1. Verify `require('dotenv').config()` is at top of `Server.js`
2. Ensure `.env` file exists in project root
3. Restart `npm start`

```bash
# Verify .env exists
ls -la .env

# Restart server
npm start
```

#### Error: "bad auth : authentication failed"

**Cause:** Invalid MongoDB credentials

**Solution:**
1. Go to MongoDB Atlas
2. Verify username/password match
3. Check IP whitelist includes your current IP
4. Copy fresh connection string from Atlas dashboard
5. Update `.env` with correct string

```bash
# Check current IP
curl https://ifconfig.me
```

#### Error: "Cannot find module './Config/db.js'"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
npm start
```

---

### Frontend Issues

#### Error: "404 Not Found" on API calls

**Cause:** Frontend pointing to wrong backend URL

**Solution:**
1. Check `VITE_API_BASE_URL` in `.env`
2. Verify backend is running on that URL
3. Restart `npm run dev`

```env
# .env - for local development
VITE_API_BASE_URL=http://localhost:3000/api

# .env - for production
VITE_API_BASE_URL=https://your-render-url.onrender.com/api
```

#### Error: "No token provided" on protected endpoints

**Cause:** JWT token not being sent in requests

**Solution:**
1. Verify user is logged in (token in localStorage)
2. Check Network tab in DevTools - should see `Authorization: Bearer <token>`
3. Ensure `authenticatedFetch()` is being used, not plain `fetch()`

```javascript
// ✅ CORRECT - Uses authenticatedFetch
import { authenticatedFetch } from './auth-helper';
await authenticatedFetch(`${API_URL}/users/${uid}`, { method: 'PUT', body: ... });

// ❌ WRONG - Uses plain fetch without token
await fetch(`${API_URL}/users/${uid}`, { method: 'PUT', body: ... });
```

#### Error: "Empty dashboard on login"

**Cause:** Courses not showing in `/dashboard/me`

**Solution:**
1. Verify course `owner` field = user `uid` (not MongoDB `_id`)
2. Create new course after login
3. Check browser DevTools → Network tab → `/dashboard/me` response

---

### Database Issues

#### MongoDB Connection Timeout

**Cause:** IP not whitelisted or incorrect connection string

**Solution:**
```bash
# Test connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/database"
```

#### Duplicate Key Error on Course Creation

**Cause:** Unique index violation

**Solution:**
1. Check if user already owns a course with same title
2. Delete duplicate in MongoDB Atlas
3. Retry course creation

---

## Verification Checklist

### Backend ✅
- [ ] `.env` file created with valid MongoDB credentials
- [ ] `JWT_SECRET` set to non-placeholder value
- [ ] `npm start` runs without errors
- [ ] "Connected to MongoDb" message appears
- [ ] `http://localhost:3000/api/courses` returns courses (no auth required)

### Frontend ✅
- [ ] `.env` file created with correct `VITE_API_BASE_URL`
- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:5173` loads in browser
- [ ] Can sign up and login
- [ ] Can create courses
- [ ] Courses appear in dashboard
- [ ] Network requests go to `http://localhost:3000/api`

### Integration ✅
- [ ] Frontend signup creates user in MongoDB
- [ ] JWT token received and stored in localStorage
- [ ] Dashboard shows user's courses
- [ ] User can update profile
- [ ] User can create projects
- [ ] User can submit feedback

---

## Security Notes

### Development
- Use placeholder `JWT_SECRET` like `dev_secret_key`
- Allow localhost CORS
- Log all requests for debugging

### Production
- Generate strong random `JWT_SECRET` (min 32 chars)
- Use HTTPS only
- Restrict CORS to frontend domain
- Never commit `.env` to git (use `.gitignore`)
- Rotate secrets regularly

---

## Additional Resources

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Render Docs](https://render.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Need Help?** Check `FIXES_AND_UPDATES.md` for common issues and solutions.
