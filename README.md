# EduNexus Backend

A secure Node.js/Express backend for the EduNexus educational platform with JWT authentication, course management, and user management features.

## Features

✅ **Authentication & Authorization**
- User signup with auto-generated unique ID
- User signin with JWT tokens
- 7-day token expiration
- Bcrypt password hashing (never stored in plain text)
- Role-based access control (student, instructor, admin)

✅ **Course Management**
- Create, read, update, delete courses
- Course ownership enforcement
- Only course owners can modify their courses
- Public read access for all users
- Tags, credits, and status tracking

✅ **User Management**
- User profiles with avatar, bio, LinkedIn
- Track enrolled courses
- Public read access
- Protected update/delete operations

✅ **Security**
- CORS enabled
- Input validation
- Duplicate prevention
- Error handling with proper HTTP status codes
- Ownership middleware verification

✅ **Testing**
- 27 comprehensive automated tests
- Authentication tests
- CRUD operation tests
- Ownership enforcement tests
- Security validation tests

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Password Security:** Bcrypt
- **Testing:** Jest + Supertest
- **Environment:** Dotenv

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
# MongoDB Atlas Connection
ATLAS_DB=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Server Configuration
PORT=3000

# JWT Secret (change this to a strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

For testing, `.env.test` is pre-configured.

## Running the Server

**Development:**
```bash
npm start
```

Server runs on `http://localhost:3000`

## Testing

**Run all tests:**
```bash
npm test
```

**Run specific test suite:**
```bash
npm test -- __tests__/auth.crud.test.js
```

**Run tests with verbose output:**
```bash
npm test -- __tests__/auth.crud.test.js --verbose
```

**Test Results:** 27/27 tests passing ✅

## API Documentation

**For detailed API documentation with request/response examples and code snippets, see [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md) - Frontend developers should refer to this document.**

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
- `credits`: Credit hours (default: 3)
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

## Frontend Integration

**Complete API documentation with exact request/response formats and code examples available in [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md)** with:
- Exact endpoint URLs and methods
- Request/response formats with JSON examples
- Authorization header format
- Token management code examples
- Authenticated request helper functions
- Frontend implementation checklist

Share this file with your frontend team!

## Testing Coverage

- **Authentication Tests:** Signup, signin, token validation
- **Course CRUD Tests:** Create, read, update, delete with ownership checks
- **User CRUD Tests:** Create, read, update, delete
- **Security Tests:** Auth enforcement, ownership verification, password hashing
- **Edge Cases:** Duplicate prevention, missing fields, invalid tokens

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
