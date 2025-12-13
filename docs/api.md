# EduNexus Backend API Documentation

**Last Updated:** December 13, 2025  
**Status:** ✅ Production Deployed & Verified  
**Backend URL:** https://edunexusbackend-mi24.onrender.com/api  
**All Endpoints:** Operational & Tested

---

## Table of Contents

1. [Base URL & Status](#base-url--status)
2. [Environment Configuration](#environment-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Course Endpoints](#course-endpoints)
7. [Review Endpoints](#review-endpoints)
8. [User Endpoints](#user-endpoints)
9. [Project Endpoints (Tier 1)](#project-endpoints-tier-1)
10. [Feedback Endpoints (Tier 1)](#feedback-endpoints-tier-1)
11. [Dashboard Endpoints](#dashboard-endpoints)
12. [Token Management](#token-management)
13. [Error Handling](#error-handling)
14. [Frontend Implementation Guide](#frontend-implementation-guide)
15. [Troubleshooting](#troubleshooting)

---

## Base URL & Status

```
http://localhost:3000/api                                    (Local Development)
https://edunexusbackend-mi24.onrender.com/api                (Production - LIVE)
```

✅ **Production Verified:** December 13, 2025  
✅ **Authentication:** Working (JWT with 7-day expiration)  
✅ **Database:** Connected (MongoDB Atlas)  
✅ **All Endpoints:** Operational  
✅ **Test Coverage:** 265/265 tests passing

---

## Environment Configuration

### Backend Prerequisites

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

#### Environment Variable Explanations

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

---

## Local Development Setup

### Step 1: Clone & Install Backend

```bash
git clone https://github.com/alfredpcleung/EduNexusBackEnd.git
cd EduNexusBackEnd
npm install

# Create .env file with MongoDB and JWT credentials
echo "ATLAS_DB=mongodb+srv://...
PORT=3000
JWT_SECRET=dev_secret_key" > .env

npm start
```

**Verify:** Backend running at `http://localhost:3000`
- Expected: "Server is running at http://localhost:3000/"
- Expected: "====> Connected to MongoDb."

### Step 2: Clone & Install Frontend

```bash
cd ..
git clone https://github.com/alfredpcleung/EduNexusFrontEnd.git
cd EduNexusFrontEnd
npm install

# Create .env file pointing to local backend
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env

npm run dev
```

**Verify:** Frontend running at `http://localhost:5173`

### Step 3: Test the Integration

1. Open `http://localhost:5173` in browser
2. Sign up with test account
3. Create a course
4. Check dashboard - course should appear
5. Open DevTools → Network tab to verify requests to `http://localhost:3000/api`

### Backend Configuration

After installing, start the server:

```bash
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

### Frontend Configuration

#### Local Development
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Production (Render/Vercel)
```env
VITE_API_BASE_URL=https://edunexusbackend-mi24.onrender.com/api
```

### Frontend Deployment Options

**Option A: Render**
```bash
npm run build
# Upload 'dist' folder to Render
```

**Option B: Vercel**
```bash
npm install -g vercel
vercel --prod
```

---

## Authentication Endpoints

### 1. Sign Up (Register)
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student",
  "schoolName": "Test University",
  "programName": "Computer Science"
}
```

**Note:** For student role, `schoolName` and `programName` are required. Valid roles: "student", "admin" (default: "student")

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "student",
      "uid": "user_1702310400123_a1b2c3d4e"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this uid or email already exists"
}
```

---

### 2. Sign In (Login)
**Endpoint:** `POST /api/auth/signin`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "student",
      "uid": "user_1702310400123_a1b2c3d4e"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Token Management

### Token Details
- **Expiration:** 7 days
- **Format:** JWT (JSON Web Token)
- **Use in requests:** Include in `Authorization` header as `Bearer <token>`

### Token Storage (JavaScript)
```javascript
// After successful login/signup
localStorage.setItem('authToken', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Retrieve Token
```javascript
const token = localStorage.getItem('authToken');
```

### Clear Token (Logout)
```javascript
localStorage.removeItem('authToken');
localStorage.removeItem('user');
```

### Authenticated Request Header Format
All protected endpoints require:
```
Authorization: Bearer <token>
```

---

## Course Endpoints

> **⚠️ BREAKING CHANGE (December 13, 2025):** Course schema completely redesigned.
> - Courses are now **institution catalog entries** (no owner field)
> - Identified by compound key: `institution + courseSubject + courseNumber`
> - Review aggregation metrics added (calculated from reviews)
> - Any authenticated user can create courses

### Course Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `institution` | String | Yes | Institution name (e.g., "Centennial College") |
| `courseSubject` | String | Yes | 2-5 uppercase letters (e.g., "COMP", "MATH") |
| `courseNumber` | String | Yes | 2-4 digits (e.g., "100", "2003") |
| `title` | String | Yes | Course title |
| `description` | String | No | Course description |
| `credits` | Number | No | Credit value (default: 3) |
| `syllabusRevisionDate` | Date | No | Last syllabus update |
| `prerequisites` | Array | No | Array of prerequisite course codes |
| `corequisites` | Array | No | Array of corequisite course codes |
| `avgDifficulty` | Number | Auto | Average difficulty (1-5), null if < 3 reviews |
| `avgUsefulness` | Number | Auto | Average usefulness (1-5), null if < 3 reviews |
| `avgWorkload` | Number | Auto | Average workload (1-5), null if < 3 reviews |
| `avgGradingFairness` | Number | Auto | Average grading fairness (1-5), null if < 3 reviews |
| `numReviews` | Number | Auto | Total number of active reviews |
| `topTags` | Array | Auto | Most common review tags |
| `lastReviewAt` | Date | Auto | Timestamp of most recent review |

**Virtual Field:** `courseCode` - Returns `courseSubject + courseNumber` (e.g., "COMP213")

---

### 1. List All Courses (Public - No Auth Required)
**Endpoint:** `GET /courses`

**Query Parameters:**
- `institution` (optional) - Filter by institution name
- `courseSubject` (optional) - Filter by subject code

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "507f1f77bcf86cd799439011",
      "institution": "Centennial College",
      "courseSubject": "COMP",
      "courseNumber": "213",
      "courseCode": "COMP213",
      "title": "Web Interface Design",
      "description": "Learn modern web development",
      "credits": 3,
      "prerequisites": ["COMP100"],
      "corequisites": [],
      "avgDifficulty": 3.5,
      "avgUsefulness": 4.2,
      "avgWorkload": 3.8,
      "avgGradingFairness": 4.0,
      "numReviews": 5,
      "topTags": ["engaging-lectures", "heavy-workload"],
      "lastReviewAt": "2025-12-10T15:30:00Z"
    }
  ]
}
```

---

### 2. Get Course by ID (Public - No Auth Required)
**Endpoint:** `GET /courses/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "institution": "Centennial College",
    "courseSubject": "COMP",
    "courseNumber": "213",
    "courseCode": "COMP213",
    "title": "Web Interface Design",
    "description": "Learn modern web development",
    "credits": 3,
    "avgDifficulty": 3.5,
    "avgUsefulness": 4.2,
    "numReviews": 5
  }
}
```

**Note:** Aggregate fields (`avgDifficulty`, `avgUsefulness`, etc.) are `null` if fewer than 3 reviews exist.

---

### 3. Create Course (Auth Required)
**Endpoint:** `POST /courses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "institution": "Centennial College",
  "courseSubject": "COMP",
  "courseNumber": "213",
  "title": "Web Interface Design",
  "description": "Learn modern web development with React and Node.js",
  "credits": 3,
  "prerequisites": ["COMP100"],
  "corequisites": []
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "id": "507f1f77bcf86cd799439012",
    "institution": "Centennial College",
    "courseSubject": "COMP",
    "courseNumber": "213",
    "courseCode": "COMP213",
    "title": "Web Interface Design",
    "credits": 3,
    "numReviews": 0,
    "avgDifficulty": null,
    "avgUsefulness": null,
    "avgWorkload": null,
    "avgGradingFairness": null
  }
}
```

**Error Response (409 - Duplicate):**
```json
{
  "success": false,
  "message": "Course already exists: Centennial College COMP213"
}
```

---

### 4. Update Course (Auth Required)
**Endpoint:** `PUT /courses/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Web Interface Design - Updated",
  "description": "Updated course description",
  "credits": 4,
  "syllabusRevisionDate": "2025-09-01"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Web Interface Design - Updated",
    "credits": 4,
    "syllabusRevisionDate": "2025-09-01T00:00:00Z"
  }
}
```

**Note:** Aggregate fields (`avgDifficulty`, `numReviews`, etc.) cannot be manually updated.

---

### 5. Delete Course (Auth Required)
**Endpoint:** `DELETE /courses/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully."
}
```

---

## Review Endpoints

> **NEW (December 13, 2025):** Course review system with transcript-based eligibility.

Reviews allow students to rate and comment on courses they've completed. Users can only review courses that appear in their academic transcript with a reviewable grade.

### Review Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseId` | ObjectId | Yes | Reference to Course |
| `authorUid` | String | Auto | User's UID (set from auth token) |
| `term` | String | Yes | Term taken: Fall, Winter, Spring, Summer, Q1-Q4 |
| `year` | Number | Yes | Year taken (e.g., 2025) |
| `difficulty` | Number | Yes | 1-5 scale |
| `usefulness` | Number | Yes | 1-5 scale |
| `workload` | Number | Yes | 1-5 scale |
| `gradingFairness` | Number | Yes | 1-5 scale |
| `tags` | Array | No | Controlled vocabulary tags (max 5) |
| `comment` | String | No | Free-text comment (max 2000 chars) |
| `isAnonymous` | Boolean | No | Hide author info (default: false) |
| `status` | String | Auto | "active" or "deleted" |

### Controlled Tags

Reviews can include up to 5 tags from this list:
- `engaging-lectures`, `great-professor`, `fair-grading`, `useful-content`, `well-organized`
- `heavy-workload`, `challenging-exams`, `lots-of-projects`, `group-work-required`
- `easy-A`, `attendance-mandatory`, `good-resources`, `industry-relevant`
- `flexible-deadlines`, `poor-communication`

---

### 1. List Reviews for Course (Public - No Auth Required)
**Endpoint:** `GET /reviews?courseId=:courseId`

**Query Parameters:**
- `courseId` (required) - Course ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "courseId": "507f1f77bcf86cd799439011",
      "authorUid": "user123",
      "term": "Fall",
      "year": 2025,
      "difficulty": 4,
      "usefulness": 5,
      "workload": 4,
      "gradingFairness": 4,
      "tags": ["engaging-lectures", "useful-content"],
      "comment": "Great course, learned a lot!",
      "isAnonymous": false,
      "status": "active",
      "created": "2025-12-10T15:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Review by ID (Public - No Auth Required)
**Endpoint:** `GET /reviews/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "courseId": "507f1f77bcf86cd799439011",
    "authorUid": "user123",
    "term": "Fall",
    "year": 2025,
    "difficulty": 4,
    "usefulness": 5,
    "workload": 4,
    "gradingFairness": 4,
    "tags": ["engaging-lectures"],
    "comment": "Great course!",
    "isAnonymous": false
  }
}
```

---

### 3. Create Review (Auth Required + Transcript Eligibility)
**Endpoint:** `POST /reviews`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "term": "Fall",
  "year": 2025,
  "difficulty": 4,
  "usefulness": 5,
  "workload": 4,
  "gradingFairness": 4,
  "tags": ["engaging-lectures", "useful-content"],
  "comment": "Excellent course with practical projects!",
  "isAnonymous": false
}
```

**Eligibility Requirements:**
- User must have the course in their `academicRecords` (transcript)
- The transcript entry must have a reviewable grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, P, W)
- Grades `I` (Incomplete) cannot review
- One review per user per course per term/year

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "courseId": "507f1f77bcf86cd799439011",
    "authorUid": "authenticated_user_uid",
    "term": "Fall",
    "year": 2025,
    "difficulty": 4,
    "usefulness": 5
  }
}
```

**Error Response (403 - Not Eligible):**
```json
{
  "success": false,
  "message": "You are not eligible to review this course. You must have completed this course (found in your academic transcript with a reviewable grade)."
}
```

**Error Response (403 - Duplicate Review):**
```json
{
  "success": false,
  "message": "You have already reviewed this course for Fall 2025"
}
```

---

### 4. Update Review (Auth + Author Required)
**Endpoint:** `PUT /reviews/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "difficulty": 3,
  "comment": "Updated my review after reflection"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "difficulty": 3,
    "comment": "Updated my review after reflection",
    "updated": "2025-12-11T10:00:00Z"
  }
}
```

---

### 5. Delete Review (Auth + Author Required)
**Endpoint:** `DELETE /reviews/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Note:** Deleting a review triggers automatic recalculation of the course's aggregate metrics.

---

### 6. Refresh Course Aggregates (Admin Only)
**Endpoint:** `POST /reviews/admin/refresh-aggregates/:courseId`

**Headers:**
```
Authorization: Bearer <token>
```

**Description:** Manually trigger recalculation of course aggregate metrics. Useful for maintenance.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Aggregates refreshed",
  "data": {
    "numReviews": 5,
    "avgDifficulty": 3.6,
    "avgUsefulness": 4.2,
    "avgWorkload": 3.8,
    "avgGradingFairness": 4.0,
    "topTags": ["engaging-lectures", "useful-content"]
  }
}
```

---

## User Endpoints

### 1. List All Users (Public - No Auth Required)
**Endpoint:** `GET /users`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "uid": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "student",
      "schoolName": "Test University",
      "programName": "Computer Science",
      "enrolledCourses": ["course_id_1", "course_id_2"],
      "profilePic": "https://...",
      "bio": "Short biography",
      "linkedin": "https://linkedin.com/in/johndoe",
      "created": "2024-12-11T10:30:00Z",
      "updated": "2024-12-11T15:45:00Z"
    }
  ]
}
```

**Note:** Password field is never returned in responses.

---

### 2. Get User by UID (Public - No Auth Required)
**Endpoint:** `GET /users/:uid`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "schoolName": "Test University",
    "programName": "Computer Science",
    "enrolledCourses": ["course_id_1", "course_id_2"],
    "profilePic": "https://...",
    "bio": "Short biography",
    "linkedin": "https://linkedin.com/in/johndoe"
  }
}
```

---

### 3. Update User (Auth Required)
**Endpoint:** `PUT /users/:uid`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Updated",
  "bio": "Updated biography",
  "profilePic": "https://new-image-url.com/pic.jpg",
  "linkedin": "https://linkedin.com/in/johndoe-updated"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "firstName": "John",
    "lastName": "Updated",
    "email": "john@example.com",
    "role": "student",
    "bio": "Updated biography",
    "profilePic": "https://new-image-url.com/pic.jpg",
    "linkedin": "https://linkedin.com/in/johndoe-updated",
    "updated": "2024-12-11T16:00:00Z"
  }
}
```

---

### 4. Delete User (Auth Required)
**Endpoint:** `DELETE /users/:uid`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully."
}
```

---

## Project Endpoints (Tier 1)

### 1. List All Projects (Public - No Auth Required)
**Endpoint:** `GET /projects`

**Query Parameters:**
- `owner` (optional) - Filter by owner UID
- `courseId` (optional) - Filter by course ID
- `status` (optional) - Filter by status (active/archived/draft)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Portfolio Project",
      "description": "Build a portfolio website",
      "owner": "user_uid_here",
      "courseId": "course_id_here",
      "tags": ["frontend", "react"],
      "status": "active",
      "created": "2024-12-11T10:30:00Z",
      "updated": "2024-12-11T10:30:00Z"
    }
  ]
}
```

---

### 2. Get Project by ID (Public - No Auth Required)
**Endpoint:** `GET /projects/:projectId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Portfolio Project",
    "description": "Build a portfolio website",
    "owner": "user_uid_here",
    "courseId": "course_id_here",
    "tags": ["frontend", "react"],
    "status": "active",
    "created": "2024-12-11T10:30:00Z",
    "updated": "2024-12-11T10:30:00Z"
  }
}
```

---

### 3. Create Project (Auth Required)
**Endpoint:** `POST /projects`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Portfolio Project",
  "description": "Build a portfolio website",
  "courseId": "course_id_here (optional)",
  "tags": ["frontend", "react"],
  "status": "active"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Portfolio Project",
    "owner": "authenticated_user_uid",
    "tags": ["frontend", "react"],
    "status": "active",
    "created": "2024-12-11T10:30:00Z",
    "updated": "2024-12-11T10:30:00Z"
  }
}
```

---

### 4. Update Project (Auth + Owner Required)
**Endpoint:** `PUT /projects/:projectId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Portfolio Project",
  "status": "archived"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Updated Portfolio Project",
    "status": "archived",
    "updated": "2024-12-11T11:30:00Z"
  }
}
```

---

### 5. Delete Project (Auth + Owner Required)
**Endpoint:** `DELETE /projects/:projectId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Feedback Endpoints (Tier 1)

### 1. List All Feedback (Public - No Auth Required)
**Endpoint:** `GET /feedback`

**Query Parameters:**
- `projectId` (required) - Filter by project ID
- `authorId` (optional) - Filter by author UID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "projectId": "project_id_here",
      "authorId": "user_uid_here",
      "rating": 4,
      "comment": "Great project!",
      "created": "2024-12-11T10:30:00Z",
      "updated": "2024-12-11T10:30:00Z"
    }
  ],
  "count": 3
}
```

---

### 2. Create Feedback (Auth Required)
**Endpoint:** `POST /feedback`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "projectId": "project_id_here",
  "rating": 4,
  "comment": "Great project!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "projectId": "project_id_here",
    "authorId": "authenticated_user_uid",
    "rating": 4,
    "comment": "Great project!",
    "created": "2024-12-11T10:30:00Z",
    "updated": "2024-12-11T10:30:00Z"
  }
}
```

**Error on Duplicate (409):**
```json
{
  "success": false,
  "message": "You have already provided feedback for this project"
}
```

---

### 3. Update Feedback (Auth + Author Required)
**Endpoint:** `PUT /feedback/:feedbackId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Actually, this was excellent!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "projectId": "project_id_here",
    "authorId": "authenticated_user_uid",
    "rating": 5,
    "comment": "Actually, this was excellent!",
    "updated": "2024-12-11T11:30:00Z"
  }
}
```

---

### 4. Delete Feedback (Auth + Author Required)
**Endpoint:** `DELETE /feedback/:feedbackId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Feedback deleted successfully"
}
```

---

## Dashboard Endpoints

> **⚠️ BREAKING CHANGE (December 13, 2025):** Dashboard structure updated.
> - `ownedCourses` → `enrolledCourses` (from user's academic transcript)
> - Added `userReviews` section

### Get User Dashboard (Auth Required)
**Endpoint:** `GET /dashboard/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "uid": "user_uid",
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice@example.com",
      "role": "student",
      "schoolName": "Centennial College",
      "programName": "Software Engineering",
      "profilePic": "...",
      "bio": "...",
      "linkedin": "...",
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    },
    "enrolledCourses": {
      "count": 2,
      "courses": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "institution": "Centennial College",
          "courseSubject": "COMP",
          "courseNumber": "213",
          "title": "Web Interface Design",
          "term": "Fall",
          "year": 2025,
          "grade": "A"
        }
      ]
    },
    "userReviews": {
      "count": 1,
      "reviews": [
        {
          "_id": "507f1f77bcf86cd799439020",
          "courseId": {
            "institution": "Centennial College",
            "courseSubject": "COMP",
            "courseNumber": "213",
            "title": "Web Interface Design"
          },
          "term": "Fall",
          "year": 2025,
          "difficulty": 4,
          "usefulness": 5
        }
      ]
    },
    "ownedProjects": {
      "count": 5,
      "projects": [...]
    },
    "authoredFeedback": {
      "count": 8,
      "feedback": [...]
    }
  }
}
```

**Note:** `enrolledCourses` are derived from the user's `academicRecords` (transcript) and matched against the course catalog. Courses in transcript that don't exist in the catalog will not appear.

---

## Error Handling

### Common Error Responses

**401 - Unauthorized (Invalid/Expired Token):**
```json
{
  "success": false,
  "message": "Invalid token. Please authenticate."
}
```

**401 - Missing Token:**
```json
{
  "success": false,
  "message": "No token provided. Please authenticate."
}
```

**403 - Forbidden (Ownership Check Failed):**
```json
{
  "success": false,
  "message": "You are not authorized to perform this action. Only the course owner can modify it."
}
```

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Not Found"
}
```

**400 - Bad Request (Validation Error):**
```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName, email, password"
}
```

**409 - Conflict (Duplicate Feedback):**
```json
{
  "success": false,
  "message": "You have already provided feedback for this project"
}
```

---

## Frontend Implementation Guide

### JavaScript Example: Signup with Token Storage

```javascript
async function signup(firstName, lastName, email, password, schoolName, programName) {
  const response = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, role: 'student', schoolName, programName })
  });
  const data = await response.json();
  if (data.data?.token) {
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
}
```

### JavaScript Example: Signin with Token Storage

```javascript
async function signin(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.data?.token) {
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
}
```

### JavaScript Example: Authenticated Request Helper

```javascript
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}
```

### JavaScript Example: Create Course (with auth)

```javascript
async function createCourse(courseData) {
  const response = await authenticatedFetch('http://localhost:3000/api/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });
  return await response.json();
}
```

### Frontend Implementation Checklist

- [ ] Implement Sign Up form with fields: firstName, lastName, email, password, schoolName, programName
- [ ] Implement Sign In form with fields: email, password
- [ ] Store token in localStorage after successful auth
- [ ] Create utility function to add Authorization header to requests
- [ ] Implement token expiration handling (redirect to login if token expires)
- [ ] Add logout button that clears token from localStorage
- [ ] Protect course creation form (only authenticated users)
- [ ] Implement course ownership check (only owner can edit/delete)
- [ ] Add error handling for 401 (unauthorized) responses
- [ ] Display user data (firstName, lastName, role, email, uid) after login
- [ ] Test signup → login → create course flow

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
VITE_API_BASE_URL=https://edunexusbackend-mi24.onrender.com/api
```

#### Error: "No token provided" on protected endpoints

**Cause:** JWT token not being sent in requests

**Solution:**
1. Verify user is logged in (token in localStorage)
2. Check Network tab in DevTools - should see `Authorization: Bearer <token>`
3. Ensure `authenticatedFetch()` is being used, not plain `fetch()`

```javascript
// ✅ CORRECT - Uses authenticatedFetch
const response = await authenticatedFetch(`${API_URL}/users/${uid}`, {
  method: 'PUT',
  body: JSON.stringify(userData)
});

// ❌ WRONG - Uses plain fetch without token
const response = await fetch(`${API_URL}/users/${uid}`, {
  method: 'PUT',
  body: JSON.stringify(userData)
});
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
- [Express.js Docs](https://expressjs.com/)
- [React Context API](https://react.dev/reference/react/useContext)

---

**For detailed test coverage information, see [TESTING_AND_IMPLEMENTATION.md](TESTING_AND_IMPLEMENTATION.md)**
