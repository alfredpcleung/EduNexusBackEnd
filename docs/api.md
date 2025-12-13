# EduNexus API Reference

**Base URL:** `https://edunexusbackend-mi24.onrender.com/api`  
**Local:** `http://localhost:3000/api`

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <token>
```

Tokens expire after 7 days.

---

## Endpoints

### Auth

#### POST /auth/signup
Register a new user.

```json
// Request
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student",
  "schoolName": "Test University",
  "programName": "Computer Science"
}

// Response 201
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "user": { "uid": "user_123...", "firstName": "John", "lastName": "Doe", "email": "john@example.com", "role": "student" }
  }
}
```

#### POST /auth/signin
Login existing user.

```json
// Request
{ "email": "john@example.com", "password": "securepassword123" }

// Response 200
{
  "success": true,
  "data": { "token": "eyJhbG...", "user": { ... } }
}
```

---

### Courses

#### GET /courses
List all courses (public).

Query params: `institution`, `courseSubject`

#### GET /courses/:id
Get course by ID (public).

#### GET /courses/lookup/:institution/:subject/:number
Lookup course by compound key (public).

#### POST /courses *(auth required)*
Create course.

```json
// Request
{
  "institution": "Centennial College",
  "courseSubject": "COMP",
  "courseNumber": "213",
  "title": "Web Interface Design",
  "description": "Learn modern web development",
  "credits": 3,
  "prerequisites": ["COMP100"]
}

// Response 201
{ "success": true, "data": { "_id": "...", "courseCode": "COMP213", ... } }
```

#### PUT /courses/:id *(auth required)*
Update course.

#### DELETE /courses/:id *(auth required)*
Delete course.

---

### Reviews

#### GET /reviews
List reviews with filters (public). Query params: `courseId`, `authorUid`, `term`, `year`

#### GET /reviews/tags
Get list of valid review tags (public).

#### GET /reviews/course/:courseId
Get all reviews for a specific course (public).

#### GET /reviews/:reviewId
Get review by ID (public).

#### POST /reviews *(auth + transcript eligibility)*
Create review. User must have completed the course.

```json
// Request
{
  "courseId": "507f1f77bcf86cd799439011",
  "term": "Fall",
  "year": 2025,
  "difficulty": 4,
  "usefulness": 5,
  "workload": 4,
  "gradingFairness": 4,
  "tags": ["engaging-lectures", "useful-content"],
  "comment": "Great course!"
}
```

**Controlled Tags:** `engaging-lectures`, `great-professor`, `fair-grading`, `useful-content`, `well-organized`, `heavy-workload`, `challenging-exams`, `lots-of-projects`, `group-work-required`, `easy-A`, `attendance-mandatory`, `good-resources`, `industry-relevant`, `flexible-deadlines`, `poor-communication`

#### PUT /reviews/:id *(author only)*
Update review.

#### DELETE /reviews/:id *(author only)*
Delete review.

#### POST /reviews/admin/refresh-aggregates/:courseId *(admin only)*
Manually refresh course aggregates.

---

### Users

#### GET /users
List all users (public).

#### GET /users/:uid
Get user by UID (public).

#### PUT /users/:uid *(auth required)*
Update user profile.

```json
// Request
{ "firstName": "John", "lastName": "Updated", "bio": "Updated bio" }
```

#### DELETE /users/:uid *(auth required)*
Delete user.

---

### Projects

#### GET /projects
List projects (public). Query params: `owner`, `courseId`, `status`

#### GET /projects/:projectId
Get project by ID (public).

#### POST /projects *(auth required)*
Create project.

```json
// Request
{
  "title": "Portfolio Project",
  "description": "Build a portfolio website",
  "tags": ["frontend", "react"],
  "status": "active"
}
```

#### PUT /projects/:projectId *(owner only)*
Update project.

#### DELETE /projects/:projectId *(owner only)*
Delete project.

---

### Feedback

#### GET /feedback?projectId=:id
List feedback for a project. Query params: `authorId`

#### POST /feedback *(auth required)*
Create feedback (one per user per project).

```json
// Request
{ "projectId": "...", "rating": 4, "comment": "Great project!" }
```

#### PUT /feedback/:feedbackId *(author only)*
Update feedback.

#### DELETE /feedback/:feedbackId *(author only)*
Delete feedback.

---

### Dashboard

#### GET /dashboard/me *(auth required)*
Get user's dashboard with enrolled courses, reviews, projects, and feedback.

```json
// Response 200
{
  "success": true,
  "dashboard": {
    "user": { ... },
    "enrolledCourses": { "count": 2, "courses": [...] },
    "userReviews": { "count": 1, "reviews": [...] },
    "ownedProjects": { "count": 5, "projects": [...] },
    "authoredFeedback": { "count": 8, "feedback": [...] }
  }
}
```

---

### Stats (Public)

Homepage metrics endpoints. No authentication required.

#### GET /stats/registered-students
Count of users with role "Student".

```json
// Response 200
{ "success": true, "data": { "registeredStudents": 150 } }
```

#### GET /stats/courses-with-reviews
Count of unique courses that have at least one review.

```json
// Response 200
{ "success": true, "data": { "coursesWithReviews": 42 } }
```

#### GET /stats/active-students
Count of students active in last 90 days (logged in OR created content).

```json
// Response 200
{ "success": true, "data": { "activeStudents": 87 } }
```

#### GET /stats/projects-recruiting
Count of approved projects currently recruiting members.

```json
// Response 200
{ "success": true, "data": { "projectsRecruiting": 15 } }
```

#### GET /stats/all
All metrics in a single request.

```json
// Response 200
{
  "success": true,
  "data": {
    "registeredStudents": 150,
    "coursesWithReviews": 42,
    "activeStudents": 87,
    "projectsRecruiting": 15
  }
}
```

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Not owner/author |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |

```json
{ "success": false, "message": "Error description" }
```

---

## Token Management (Frontend)

```javascript
// Store after login
localStorage.setItem('authToken', response.data.token);

// Use in requests
fetch(url, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
});

// Clear on logout
localStorage.removeItem('authToken');
```
