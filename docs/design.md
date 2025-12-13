# EduNexus Backend Design & Architecture

**Last Updated:** December 13, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Data Models](#data-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Design Principles](#api-design-principles)
7. [Service Layer](#service-layer)
8. [Middleware](#middleware)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Architecture](#deployment-architecture)

---

## Overview

EduNexus Backend is a RESTful API built with Node.js and Express.js, serving as the backend for the EduNexus educational platform. It provides:

- User authentication and authorization (JWT-based)
- Course catalog management (institution-based entries)
- Course review system (transcript-based eligibility)
- Project management (student projects)
- Peer feedback system
- User dashboard aggregation
- Academic transcript and GPA services

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js v24.11.1+ |
| Framework | Express.js v5.1.0 |
| Database | MongoDB Atlas (Mongoose v8.19.0) |
| Authentication | JWT (jsonwebtoken v9.0.2) |
| Password Security | Bcrypt v3.1.x |
| Testing | Jest v29.7.0 + Supertest v6.3.3 |
| Deployment | Render.com |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                    (EduNexusFrontEnd Repository)                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Express.js)                    │
│                    https://edunexusbackend-mi24.onrender.com     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Routes  │→ │Middleware│→ │Controller│→ │ Services │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                    │                             │
│                                    ▼                             │
│                            ┌──────────────┐                     │
│                            │    Models    │                     │
│                            └──────────────┘                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas (Cloud)                        │
│                         edunexus database                        │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Request** arrives at Express router
2. **Middleware** processes request (auth, validation, ownership)
3. **Controller** handles business logic
4. **Service** (if needed) performs complex operations
5. **Model** interacts with MongoDB
6. **Response** sent back to client

---

## Project Structure

```
EduNexusBackEnd/
├── App/
│   ├── Constants/
│   │   └── reviewTags.js           # Controlled vocabulary for reviews
│   ├── Controllers/
│   │   ├── auth.js                 # Signup, signin logic
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── ownershipMiddleware.js  # Resource ownership checks
│   │   ├── course.js               # Course CRUD operations
│   │   ├── review.js               # Review CRUD + aggregates
│   │   ├── project.js              # Project CRUD operations
│   │   ├── feedback.js             # Feedback CRUD operations
│   │   ├── dashboard.js            # Dashboard aggregation
│   │   └── user.js                 # User CRUD operations
│   ├── Middleware/
│   │   └── reviewAuth.js           # Review-specific authorization
│   ├── Models/
│   │   ├── user.js                 # User schema + password hashing
│   │   ├── course.js               # Course schema + aggregates
│   │   ├── review.js               # Review schema
│   │   ├── project.js              # Project schema
│   │   └── feedback.js             # Feedback schema
│   ├── Routers/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── course.js               # Course routes
│   │   ├── review.js               # Review routes
│   │   ├── project.js              # Project routes
│   │   ├── feedback.js             # Feedback routes
│   │   ├── dashboard.js            # Dashboard routes
│   │   └── user.js                 # User routes
│   ├── Services/
│   │   ├── reviewService.js        # Review aggregate calculations
│   │   └── transcriptService.js    # GPA calculations
│   └── Utils/
│       ├── errorResponse.js        # Standardized error responses
│       └── tokenManager.js         # JWT token utilities
├── Config/
│   └── db.js                       # MongoDB connection setup
├── __tests__/                      # Jest test suites
├── docs/                           # Documentation
│   ├── api.md                      # API reference
│   ├── design.md                   # This file
│   └── project_requirements.md     # Project requirements
├── Server.js                       # Express app entry point
├── jest.config.js                  # Jest configuration
├── package.json                    # Dependencies
└── .env                            # Environment variables
```

---

## Data Models

### User Model

The User model supports global academic systems with flexible credit tracking.

```javascript
{
  uid: String,              // Auto-generated: user_<timestamp>_<random>
  firstName: String,        // Required
  lastName: String,         // Required
  email: String,            // Required, unique
  password: String,         // Hashed with bcrypt
  role: String,             // "student" | "admin"
  schoolName: String,       // Required for students
  programName: String,      // Required for students
  academicRecords: [{       // Transcript entries
    courseSubject: String,  // e.g., "COMP"
    courseNumber: String,   // e.g., "213"
    term: String,           // Fall, Winter, Spring, Summer, Q1-Q4
    year: Number,
    grade: String,          // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, P, I, W
    credits: Number,
    creditSystem: String    // "Credit Hours" | "ECTS"
  }],
  profilePic: String,
  bio: String,
  linkedin: String,
  created: Date,            // Immutable
  updated: Date             // Auto-updated
}
```

### Course Model

Courses are institution catalog entries (not owned by users).

```javascript
{
  institution: String,      // Required: e.g., "Centennial College"
  courseSubject: String,    // Required: 2-5 uppercase letters
  courseNumber: String,     // Required: 2-4 digits
  title: String,            // Required
  description: String,
  credits: Number,          // Default: 3
  syllabusRevisionDate: Date,
  prerequisites: [String],
  corequisites: [String],
  // Auto-calculated aggregates (null if < 3 reviews):
  avgDifficulty: Number,
  avgUsefulness: Number,
  avgWorkload: Number,
  avgGradingFairness: Number,
  numReviews: Number,
  topTags: [String],
  lastReviewAt: Date
}
// Virtual: courseCode = courseSubject + courseNumber
// Compound unique: institution + courseSubject + courseNumber
```

### Review Model

```javascript
{
  courseId: ObjectId,       // Reference to Course
  authorUid: String,        // User's UID (auto-set from auth)
  term: String,             // Required: Fall, Winter, Spring, Summer, Q1-Q4
  year: Number,             // Required: e.g., 2025
  difficulty: Number,       // Required: 1-5 scale
  usefulness: Number,       // Required: 1-5 scale
  workload: Number,         // Required: 1-5 scale
  gradingFairness: Number,  // Required: 1-5 scale
  tags: [String],           // Max 5, controlled vocabulary
  comment: String,          // Max 2000 chars
  isAnonymous: Boolean,     // Default: false
  status: String,           // "active" | "deleted"
  created: Date,
  updated: Date
}
// Compound unique: authorUid + courseId + term + year
```

### Project Model

```javascript
{
  title: String,            // Required
  description: String,
  owner: String,            // User's UID (auto-set from auth)
  courseId: ObjectId,       // Optional reference to Course
  tags: [String],
  status: String,           // "active" | "archived" | "draft"
  created: Date,
  updated: Date
}
```

### Feedback Model

```javascript
{
  projectId: ObjectId,      // Reference to Project
  authorId: String,         // User's UID (auto-set from auth)
  rating: Number,           // Required: 1-5
  comment: String,
  created: Date,
  updated: Date
}
// Compound unique: authorId + projectId
```

---

## Authentication & Authorization

### JWT Token Flow

```
┌────────────┐    POST /auth/signup    ┌────────────┐
│   Client   │ ─────────────────────→  │   Server   │
│            │    or POST /auth/signin │            │
│            │ ←───────────────────────│            │
│            │    { token, user }      │            │
└────────────┘                         └────────────┘
      │
      │  Store token in localStorage
      ▼
┌────────────┐    Protected Request    ┌────────────┐
│   Client   │ ─────────────────────→  │   Server   │
│            │  Authorization: Bearer  │            │
│            │      <token>            │            │
└────────────┘                         └────────────┘
```

### Token Structure

```javascript
{
  userId: ObjectId,    // MongoDB _id
  uid: String,         // Custom user identifier
  email: String,
  iat: Number,         // Issued at
  exp: Number          // Expires (7 days from iat)
}
```

### Authorization Layers

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| **authMiddleware** | Verify JWT token | Decodes token, attaches user to request |
| **ownershipMiddleware** | Resource ownership | Checks if user owns the resource |
| **reviewAuth** | Review eligibility | Verifies transcript + duplicate checks |

### Role-Based Access

| Role | Capabilities |
|------|-------------|
| `student` | CRUD on own resources, create courses, submit reviews |
| `admin` | All student capabilities + manage any resource + admin endpoints |

---

## API Design Principles

### RESTful Conventions

- **GET** - Read (list or single)
- **POST** - Create
- **PUT** - Update (full or partial)
- **DELETE** - Remove

### URL Structure

```
/api/{resource}                 # List or create
/api/{resource}/:id             # Read, update, delete by ID
/api/{resource}/:id/{subresource}  # Nested resources
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Query Parameters

- Filtering: `?courseId=xxx&status=active`
- Pagination: Not yet implemented (planned)
- Sorting: `?sort=created:-1` (planned)

---

## Service Layer

### ReviewService

Handles complex review aggregate calculations:

```javascript
// App/Services/reviewService.js
- calculateAggregates(courseId)  // Computes avg ratings, topTags
- refreshCourseAggregates(courseId)  // Triggers after review CRUD
```

### TranscriptService

Handles GPA calculations with global compatibility:

```javascript
// App/Services/transcriptService.js
- gradeToGPA(grade)              // Maps grade to 4.5 scale
- calculateTermGPA(records)      // Term-specific GPA
- calculateCumulativeGPA(records) // Overall GPA
- isReviewableGrade(grade)       // Check if can review
```

**GPA Scale (4.5):**
| Grade | GPA Points |
|-------|------------|
| A+ | 4.5 |
| A | 4.0 |
| A- | 3.7 |
| B+ | 3.3 |
| B | 3.0 |
| B- | 2.7 |
| C+ | 2.3 |
| C | 2.0 |
| C- | 1.7 |
| D+ | 1.3 |
| D | 1.0 |
| D- | 0.7 |
| F | 0.0 |
| P, I, W | Excluded from GPA |

---

## Middleware

### Authentication Middleware

```javascript
// App/Controllers/authMiddleware.js
exports.verifyToken = async (req, res, next) => {
  // 1. Extract token from Authorization header
  // 2. Verify with JWT_SECRET
  // 3. Decode payload
  // 4. Attach to req.user
  // 5. Call next() or return 401
};
```

### Ownership Middleware

```javascript
// App/Controllers/ownershipMiddleware.js
exports.checkOwnership = (Model, ownerField) => async (req, res, next) => {
  // 1. Find resource by ID
  // 2. Compare resource[ownerField] with req.user.uid
  // 3. Allow admin override
  // 4. Call next() or return 403
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not authorized (ownership) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Unexpected errors |

### Error Response Utility

```javascript
// App/Utils/errorResponse.js
exports.errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
```

---

## Testing Strategy

### Test Structure

```
__tests__/
├── auth.crud.test.js          # 27 tests - Authentication flows
├── course.controller.test.js  # 33 tests - Course CRUD
├── review.controller.test.js  # 29 tests - Review system
├── project.controller.test.js # 45 tests - Project management
├── feedback.controller.test.js# 40 tests - Feedback system
├── dashboard.controller.test.js # 17 tests - Dashboard
├── tier1.test.js              # 16 tests - Integration
├── transcriptService.test.js  # 35 tests - GPA calculations
└── user.controller.test.js    # Misc user tests
```

### Test Categories

1. **Unit Tests** - Individual functions (GPA calculations)
2. **Integration Tests** - API endpoints with real DB
3. **Authorization Tests** - Verify access controls
4. **Edge Case Tests** - Boundary conditions, invalid inputs

### Running Tests

```bash
# All tests
npm test

# Specific suite
npm test -- __tests__/review.controller.test.js

# With coverage
npm test -- --coverage
```

---

## Deployment Architecture

### Production Environment (Render.com)

```
┌─────────────────────────────────────────────────────────────┐
│                      Render.com                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Web Service (Backend)                   │   │
│  │    https://edunexusbackend-mi24.onrender.com        │   │
│  │                                                      │   │
│  │    Environment Variables:                            │   │
│  │    - ATLAS_DB (MongoDB connection)                   │   │
│  │    - JWT_SECRET (Token signing)                      │   │
│  │    - PORT (Auto-assigned by Render)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                             │
│         cluster0.lc1sdts.mongodb.net/edunexus               │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ATLAS_DB` | MongoDB Atlas connection string | Yes |
| `PORT` | Server port (Render auto-assigns) | No |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars in prod) | Yes |

### Deployment Process

1. Push to `main` branch on GitHub
2. Render auto-detects changes
3. Runs `npm install`
4. Runs `npm start` (or `node Server.js`)
5. Service goes live

---

## Future Considerations

### Nice-to-Have Features (from project_requirements.md)

- Weighted review averages by recency
- Multi-institution support
- Review moderation (approved/flagged/deleted)
- Admin role separation
- Pagination for large datasets
- Rate limiting

### Scalability Notes

- MongoDB indexes on frequently queried fields
- Connection pooling via Mongoose
- Stateless JWT auth (no session store needed)
- Services for complex calculations (offload from controllers)

---

## Related Documentation

- [API Reference](api.md) - Full endpoint documentation
- [Project Requirements](project_requirements.md) - Feature requirements
- [README](../README.md) - Quick start guide
