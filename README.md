# EduNexus Backend

A secure Node.js/Express backend for the EduNexus educational platform with JWT authentication, course management, projects, feedback, and user management features.

**Status:** ✅ Production Ready - All 193 Tests Passing  
**Backend URL:** https://edunexusbackend-mi24.onrender.com  
**Last Updated:** December 12, 2025

---

## Quick Navigation

📚 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Full API reference with endpoints, auth, and request/response examples

---

## Features

✅ **Authentication & Authorization**
- User signup with auto-generated unique ID
- User signin with JWT tokens
- 7-day token expiration
- Bcrypt password hashing (never stored in plain text)
- Role-based access control (student, instructor, admin)

✅ **Course Management**
- Create, read, update, delete courses
- Course ownership enforcement (owner field uses user `uid`)
- Only course owners can modify their courses
- Public read access for all users
- Tags, credits, and status tracking

✅ **Project Management** (Tier 1)
- Create, read, update, delete projects
- Project ownership enforcement
- Only project owners can modify/delete their projects
- Optional course association
- Tags and status tracking (active, archived, draft)
- Indexes on owner and courseId for efficient queries

✅ **Feedback System** (Tier 1)
- Create, read, update, delete feedback on projects
- 1-5 star rating system
- Comment support
- Author displayName included in all feedback responses (no extra lookups needed)
- Unique feedback per author per project (compound index)
- Only feedback authors can modify/delete their feedback
- Admin users can manage any feedback

✅ **User Dashboard**
- Aggregated user data (courses, projects, feedback)
- Single `/dashboard/me` endpoint for complete user overview
- Shows owned courses, owned projects, and authored feedback with counts
- Protected with JWT authentication

✅ **User Management**
- User profiles with avatar, bio, LinkedIn
- Update user record with uid-based operations
- Delete user account
- Protected operations with JWT auth

✅ **Security**
- CORS enabled
- Input validation
- Duplicate prevention
- Error handling with proper HTTP status codes
- Ownership middleware verification
- JWT token-based authentication
- Environment variable protection for secrets

✅ **Testing**
- 193 comprehensive automated tests
- Authentication tests (27 tests)
- Course CRUD tests (41 tests)
- Project management tests (45 tests)
- Feedback system tests (40 tests)
- Dashboard aggregation tests (16 tests)
- Tier 1 integration tests (16 tests)
- Misc tests (8 tests)
- Ownership enforcement tests
- Security validation tests

---

## Tech Stack

- **Runtime:** Node.js (v24.11.1+)
- **Framework:** Express.js (v5.1.0)
- **Database:** MongoDB with Mongoose (v8.19.0)
- **Authentication:** JWT - jsonwebtoken (v9.0.2)
- **Password Security:** Bcrypt (v3.1.x)
- **Testing:** Jest (v29.7.0) + Supertest (v6.3.3)
- **Environment:** Dotenv (v17.2.3)
- **Deployment:** Render.com

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/alfredpcleung/EduNexusBackEnd.git
cd EduNexusBackEnd
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
# MongoDB Atlas Connection String
ATLAS_DB=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Server Port
PORT=3000

# JWT Secret (use a strong random string in production)
JWT_SECRET=dev_local_secret_key_change_in_production
```

For testing, `.env.test` is pre-configured with test values.

## Running the Server

**Development:**
```bash
npm start
```

Server runs on `http://localhost:3000`

The server will:
1. Load environment variables from `.env`
2. Connect to MongoDB Atlas
3. Start listening on PORT 3000
4. Log "Server is running at http://localhost:3000/"
5. Log "====> Connected to MongoDb." when DB connection is successful

## Testing

**Run all tests:**
```bash
npm test
```

**Run specific test suite:**
```bash
npm test -- __tests__/project.controller.test.js
npm test -- __tests__/feedback.controller.test.js
npm test -- __tests__/dashboard.controller.test.js
```

**Test Coverage:**
- Total: 101 tests
- Phase 1 (Auth): 27 tests ✅
- Phase 2 (Courses): 41 tests ✅
- Phase 3 (Projects): 45 tests ✅
- Phase 3 (Feedback): 40 tests ✅
- Phase 3 (Dashboard): 16 tests ✅

## API Structure

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user

### Users (UID-based operations)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:uid` - Get user by uid
- `PUT /api/users/:uid` - Update user (requires auth)
- `DELETE /api/users/:uid` - Delete user (requires auth)

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course (requires auth)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course (owner only)
- `DELETE /api/courses/:id` - Delete course (owner only)

### Projects (Tier 1)
- `GET /api/projects` - List all projects (with filters)
- `POST /api/projects` - Create project (requires auth)
- `GET /api/projects/:projectId` - Get project by ID
- `PUT /api/projects/:projectId` - Update project (owner only)
- `DELETE /api/projects/:projectId` - Delete project (owner only)

### Feedback (Tier 1)
- `GET /api/feedback` - List all feedback (with filters)
- `POST /api/feedback` - Create feedback (requires auth)
- `GET /api/feedback/:feedbackId` - Get feedback by ID
- `PUT /api/feedback/:feedbackId` - Update feedback (author only)
- `DELETE /api/feedback/:feedbackId` - Delete feedback (author only)

### Dashboard
- `GET /api/dashboard/me` - Get user dashboard (requires auth)

## Key Implementation Details

### User ID Strategy
- **uid**: Custom user identifier (format: `user_<timestamp>_<random>`) - used for API operations
- **_id**: MongoDB ObjectId - used for database storage
- **JWT contains**: `{ userId: _id, uid: uid, email: email }`

### Ownership & Authorization
- Courses: Owned by user via `owner` field (stored as `uid`)
- Projects: Owned by user via `owner` field (stored as `uid`)
- Feedback: Created by user via `authorId` field (stored as `uid`)

### Important Fixes (Latest Commit)
1. **JWT_SECRET Loading** - Added `require('dotenv').config()` at top of Server.js to load environment before routers
2. **UID-based User Operations** - Changed user routes to use `:uid` instead of `:id` for consistency
3. **Course Owner Tracking** - Fixed course creation to save owner as `uid` instead of `userId` for dashboard matching

## Project Structure

```
EduNexusBackEnd/
├── App/
│   ├── Controllers/
│   │   ├── auth.js              # Authentication logic
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── course.js            # Course CRUD
│   │   ├── user.js              # User CRUD
│   │   ├── project.js           # Project CRUD (Tier 1)
│   │   ├── feedback.js          # Feedback CRUD (Tier 1)
│   │   ├── dashboard.js         # Dashboard aggregation
│   │   └── ownershipMiddleware.js
│   ├── Models/
│   │   ├── user.js              # User schema
│   │   ├── course.js            # Course schema
│   │   ├── project.js           # Project schema (Tier 1)
│   │   └── feedback.js          # Feedback schema (Tier 1)
│   └── Routers/
│       ├── auth.js
│       ├── user.js
│       ├── course.js
│       ├── project.js            # (Tier 1)
│       ├── feedback.js           # (Tier 1)
│       └── dashboard.js
├── Config/
│   ├── db.js                    # MongoDB connection
│   └── firebaseAdmin.js
├── __tests__/
│   ├── project.controller.test.js   # 45 tests
│   ├── feedback.controller.test.js  # 40 tests
│   └── dashboard.controller.test.js # 16 tests
├── .env                         # Environment variables
├── .env.test                    # Test environment
├── Server.js                    # Express app setup
└── package.json
```

## Environment Setup Notes

### Local Development
1. Create `.env` with your MongoDB Atlas credentials
2. Set `JWT_SECRET` to any value (e.g., `dev_secret_key`)
3. Frontend should point to `http://localhost:3000` via `.env` file
4. Run `npm start` to start backend

### Production (Render)
1. Set environment variables in Render dashboard
2. Ensure `JWT_SECRET` is a strong random string
3. MongoDB connection should be from production cluster
4. Frontend should point to Render deployment URL

## Recent Updates

**Latest Commit (5c8b70e):**
- ✅ Fixed JWT_SECRET loading issue
- ✅ Updated user operations to use `uid` instead of MongoDB `_id`
- ✅ Fixed course owner tracking for dashboard display
- ✅ All 101 tests passing

## Common Issues & Solutions

### Issue: "secretOrPrivateKey must have a value"
**Solution:** Ensure `require('dotenv').config()` is called at the very top of Server.js before importing routers.

### Issue: Course not showing in dashboard
**Solution:** Ensure course `owner` field uses `uid` (custom user ID), not MongoDB `_id`.

### Issue: User update returns "Invalid ID format"
**Solution:** Use the user's `uid` field in the URL, not the MongoDB `_id`.

### Issue: "No token provided" on protected endpoints
**Solution:** Ensure Authorization header is sent with format: `Authorization: Bearer <token>`

## Git Repository

All code is version controlled and pushed to GitHub:
```
https://github.com/alfredpcleung/EduNexusBackEnd
```

## Contributors

- Alfred Leung

## License

ISC

---

**Last Updated:** December 12, 2025  
**Status:** ✅ Production Ready - Verified & Tested  
**Backend URL:** https://edunexusbackend-mi24.onrender.com  
**All Systems:** Operational - 101/101 Tests Passing

**Run tests with verbose output:**
```bash
npm test -- __tests__/auth.crud.test.js --verbose
```

**Test Results:** 27/27 tests passing ✅

## API Documentation

**For detailed API documentation with request/response examples and code snippets, see [BACKEND_API_DOCUMENTATION.md](BACKEND_API_DOCUMENTATION.md) - Frontend developers should refer to this document.**

### Quick API Reference

#### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

**POST /auth/signup** - Register new user
- Required: `displayName`, `email`, `password`
- Optional: `role` (default: "student")
- Returns: JWT token + user data

**POST /auth/signin** - Login user
- Required: `email`, `password`
- Returns: JWT token + user data

### Course Endpoints

**GET /courses** - List all courses (public)
**GET /courses/:id** - Get course by ID (public)
**POST /courses** - Create course (auth required)
**PUT /courses/:id** - Update course (auth + owner required)
**DELETE /courses/:id** - Delete course (auth + owner required)

### User Endpoints

**GET /users** - List all users (public)
**GET /users/:id** - Get user by ID (public)
**PUT /users/:id** - Update user profile (auth required)
**DELETE /users/:id** - Delete user account (auth required)

## Authentication

All protected endpoints require an Authorization header:
```
Authorization: Bearer <jwt_token>
```

Tokens expire after 7 days. Frontend should handle token expiration by redirecting to login.

## Project Structure

```
App/
├── Controllers/
│   ├── auth.js                    # Authentication logic (signup, signin)
│   ├── authMiddleware.js          # JWT token verification
│   ├── ownershipMiddleware.js     # Course ownership enforcement
│   ├── user.js                    # User CRUD operations
│   └── course.js                  # Course CRUD operations
├── Models/
│   ├── user.js                    # User schema with password hashing
│   └── course.js                  # Course schema with owner field
└── Routers/
    ├── auth.js                    # Auth routes
    ├── user.js                    # User routes
    └── course.js                  # Course routes

Config/
├── db.js                          # MongoDB connection
└── firebaseAdmin.js               # Firebase config (optional)

__tests__/
├── auth.crud.test.js              # Comprehensive test suite
├── user.controller.test.js        # User tests
└── course.controller.test.js      # Course tests

Server.js                           # Main server file
jest.config.js                      # Jest configuration
.env                               # Environment variables
.env.test                          # Test environment variables
```

## Database Schema

### User Model
- `uid`: Auto-generated unique identifier
- `displayName`: User's full name (required)
- `email`: Email address (required, unique)
- `password`: Hashed password (required)
- `role`: "student", "instructor", or "admin" (default: "student")
- `enrolledCourses`: Array of course IDs
- `profilePic`: Avatar URL
- `bio`: Biography
- `linkedin`: LinkedIn profile URL
- `admin`: Boolean flag
- `created`: Creation timestamp (immutable)
- `updated`: Last update timestamp

### Course Model
- `title`: Course title (required)
- `description`: Course description (required)
- `credits`: Credit hours (default: 4)
- `instructor`: Instructor name (required)
- `owner`: User ID of course creator (required)
- `studentsEnrolled`: Array of enrolled student IDs
- `tags`: Array of keywords/categories
- `status`: "active", "archived", or "draft" (default: "active")

## Error Handling

All errors return JSON responses with appropriate HTTP status codes:

- **200 OK** - Successful request
- **201 Created** - Resource created
- **400 Bad Request** - Validation error or missing fields
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized (e.g., not course owner)
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

Error Response Format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Considerations

1. **Passwords** - Never stored in plain text, hashed with bcrypt
2. **Tokens** - JWT tokens expire after 7 days
3. **Validation** - All inputs validated on the backend
4. **CORS** - Enabled with default settings
5. **Ownership** - Middleware enforces ownership checks
6. **Unique Fields** - Email and UID are unique constraints

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ATLAS_DB` | MongoDB connection string | Required |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `NODE_ENV` | Environment (development/production) | Optional |

## Deployment to Render

1. Push code to GitHub
2. Connect Render to GitHub repository
3. Set environment variables in Render dashboard:
   - `ATLAS_DB` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A strong random secret key
   - `NODE_ENV` - Set to "production"
4. Deploy

## Documentation

### API Documentation
📚 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with:
- Base URLs (local development and production)
- Environment configuration
- Local development setup
- Production deployment instructions
- Complete endpoint reference for all features
- Token management
- Error handling
- Frontend implementation examples
- Troubleshooting guide

### Testing & Implementation
🧪 **[TESTING_AND_IMPLEMENTATION.md](TESTING_AND_IMPLEMENTATION.md)** - Test coverage and implementation details with:
- Tier 1 implementation overview
- Complete feature descriptions
- Data model schemas
- API endpoint reference
- Authorization rules
- Test suite documentation (193 tests)
- Test coverage summary
- Running tests
- Test patterns and best practices

---

## Testing Coverage

**Total:** 193 tests (100% passing)
- **Authentication Tests:** 27 tests - Signup, signin, token validation
- **Course CRUD Tests:** 41 tests - Create, read, update, delete with ownership checks
- **Project CRUD Tests:** 45 tests - Create, read, update, delete with ownership checks
- **Feedback Tests:** 40 tests - Create, read, update, delete with authorship checks and duplicate prevention
- **Dashboard Tests:** 16 tests - Aggregation and access control
- **Tier 1 Integration Tests:** 16 tests - Feature integration
- **Misc Tests:** 8 tests - User CRUD, security validation
- **Security Tests:** Auth enforcement, ownership verification, password hashing
- **Edge Cases:** Duplicate prevention, missing fields, invalid tokens, boundary conditions

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests to ensure nothing breaks
4. Commit with clear messages
5. Push to GitHub
6. Create a pull request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

**Last Updated:** December 11, 2024  
**Backend Status:** Production Ready ✅  
**Test Status:** 27/27 Passing ✅
