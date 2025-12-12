# EduNexus Backend API Documentation
## Frontend Implementation Guide

---

## Base URL
```
http://localhost:3000/api                                    (Local Development)
https://edunexusbackend-mi24.onrender.com/api                (Production - LIVE)
```

---

## Status
✅ **Production Verified:** December 12, 2025  
✅ **Authentication:** Working (JWT with 7-day expiration)  
✅ **Database:** Connected (MongoDB Atlas)  
✅ **All Endpoints:** Operational

---

## Authentication Endpoints

### 1. Sign Up (Register)
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"  // Optional: "student", "instructor", or "admin" (default: "student")
}
```

**Note:** The `uid` field is optional and will be auto-generated if not provided.

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "displayName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "uid": "user_1702310400123_a1b2c3d4e"
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
**Endpoint:** `POST /auth/signin`

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
  "message": "Sign in successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "displayName": "John Doe",
    "email": "john@example.com",
    "role": "student"
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

### Token Storage
After successful login/signup, store the token in **localStorage**:
```javascript
localStorage.setItem('authToken', response.token);
```

### Token Details
- **Expiration:** 7 days
- **Format:** JWT (JSON Web Token)
- **Use in requests:** Include in `Authorization` header as `Bearer <token>`

### Retrieve Token
```javascript
const token = localStorage.getItem('authToken');
```

### Clear Token (Logout)
```javascript
localStorage.removeItem('authToken');
```

---

## Authenticated Requests

### Authorization Header Format
All protected endpoints require this header:
```
Authorization: Bearer <token>
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('authToken');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

fetch('http://localhost:3000/api/courses', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(courseData)
});
```

---

## Course Endpoints

### 1. List All Courses (Public - No Auth Required)
**Endpoint:** `GET /courses`

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to React",
    "description": "Learn React basics",
    "credits": 3,
    "instructor": "Dr. Smith",
    "owner": "user_id_here",
    "studentsEnrolled": ["student1", "student2"],
    "tags": ["web", "javascript"],
    "status": "active"
  }
]
```

---

### 2. Get Course by ID (Public - No Auth Required)
**Endpoint:** `GET /courses/:id`

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to React",
  "description": "Learn React basics",
  "credits": 3,
  "instructor": "Dr. Smith",
  "owner": "user_id_here",
  "studentsEnrolled": ["student1", "student2"],
  "tags": ["web", "javascript"],
  "status": "active"
}
```

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
  "title": "Advanced JavaScript",
  "description": "Deep dive into JavaScript concepts",
  "credits": 4,
  "instructor": "Dr. Johnson",
  "studentsEnrolled": [],
  "tags": ["javascript", "advanced"],
  "status": "active"
}
```

**Note:** The `owner` field is automatically set to the authenticated user's ID. Do not include it in the request.

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Advanced JavaScript",
  "description": "Deep dive into JavaScript concepts",
  "credits": 4,
  "instructor": "Dr. Johnson",
  "owner": "authenticated_user_id",
  "studentsEnrolled": [],
  "tags": ["javascript", "advanced"],
  "status": "active"
}
```

**Error Response (401 - No Auth Token):**
```json
{
  "success": false,
  "message": "No token provided. Please authenticate."
}
```

---

### 4. Update Course (Auth + Ownership Required)
**Endpoint:** `PUT /courses/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Advanced JavaScript - Updated",
  "description": "Updated description",
  "credits": 5,
  "status": "archived"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Advanced JavaScript - Updated",
    "description": "Updated description",
    "credits": 5,
    "instructor": "Dr. Johnson",
    "owner": "authenticated_user_id",
    "studentsEnrolled": [],
    "tags": ["javascript", "advanced"],
    "status": "archived"
  }
}
```

**Error Response (403 - Not Owner):**
```json
{
  "success": false,
  "message": "You are not authorized to perform this action. Only the course owner can modify it."
}
```

---

### 5. Delete Course (Auth + Ownership Required)
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

**Error Response (403 - Not Owner):**
```json
{
  "success": false,
  "message": "You are not authorized to perform this action. Only the course owner can modify it."
}
```

---

## User Endpoints

### 1. List All Users (Public - No Auth Required)
**Endpoint:** `GET /users`

**Success Response (200):**
```json
[
  {
    "uid": "user123",
    "displayName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "enrolledCourses": ["course_id_1", "course_id_2"],
    "profilePic": "https://...",
    "bio": "Short biography",
    "linkedin": "https://linkedin.com/in/johndoe",
    "created": "2024-12-11T10:30:00Z",
    "updated": "2024-12-11T15:45:00Z",
    "admin": false
  }
]
```

**Note:** Password field is never returned in responses.

---

### 2. Get User by ID (Public - No Auth Required)
**Endpoint:** `GET /users/:id`

**Success Response (200):**
```json
{
  "uid": "user123",
  "displayName": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "enrolledCourses": ["course_id_1", "course_id_2"],
  "profilePic": "https://...",
  "bio": "Short biography",
  "linkedin": "https://linkedin.com/in/johndoe",
  "created": "2024-12-11T10:30:00Z",
  "updated": "2024-12-11T15:45:00Z",
  "admin": false
}
```

---

### 3. Update User (Auth Required)
**Endpoint:** `PUT /users/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "John Updated",
  "bio": "Updated biography",
  "profilePic": "https://new-image-url.com/pic.jpg",
  "linkedin": "https://linkedin.com/in/johndoe-updated",
  "enrolledCourses": ["course_id_1"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "displayName": "John Updated",
    "email": "john@example.com",
    "role": "student",
    "enrolledCourses": ["course_id_1"],
    "profilePic": "https://new-image-url.com/pic.jpg",
    "bio": "Updated biography",
    "linkedin": "https://linkedin.com/in/johndoe-updated",
    "created": "2024-12-11T10:30:00Z",
    "updated": "2024-12-11T16:00:00Z",
    "admin": false
  }
}
```

---

### 4. Delete User (Auth Required)
**Endpoint:** `DELETE /users/:id`

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

## Error Handling

### Common Error Responses

**401 - Unauthorized (Invalid/Expired Token):**
```json
{
  "success": false,
  "message": "Invalid token. Please authenticate."
}
```

**401 - Token Expired:**
```json
{
  "success": false,
  "message": "Token has expired. Please sign in again."
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
  "message": "Missing required fields: uid, displayName, email, password"
}
```

---

## Frontend Checklist

- [ ] Implement Sign Up form with fields: displayName, email, password (uid is auto-generated)
- [ ] Implement Sign In form with fields: email, password
- [ ] Store token in localStorage after successful auth
- [ ] Create utility function to add Authorization header to requests
- [ ] Implement token expiration handling (redirect to login if token expires)
- [ ] Add logout button that clears token from localStorage
- [ ] Protect course creation form (only authenticated users)
- [ ] Implement course ownership check (only owner can edit/delete)
- [ ] Add error handling for 401 (unauthorized) responses
- [ ] Display user data (displayName, role, email, uid) after login
- [ ] Test signup → login → create course flow

---

## Quick Implementation Example

### Signup (uid auto-generated)
```javascript
async function signup(displayName, email, password) {
  const response = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password })
    // Note: uid is optional and will be auto-generated
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
  }
  return data;
}
```

### Signin
```javascript
async function signin(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
  }
  return data;
}
```

### Authenticated Request Helper
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

### Create Course (with token)
```javascript
async function createCourse(courseData) {
  const response = await authenticatedFetch('http://localhost:3000/api/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });
  return await response.json();
}
```

---

**Last Updated:** December 11, 2024  
**Backend Status:** Ready for Production
