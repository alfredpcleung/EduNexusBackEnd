# EduNexus Backend Architecture

---

## System Overview

```
Frontend (React) → Backend API (Express.js) → MongoDB Atlas
```

### Request Flow
1. Request → Router → Middleware (auth, ownership) → Controller → Service → Model → Response

---

## Data Models

### User
```javascript
{
  uid: String,                // Auto: user_<timestamp>_<random>
  firstName: String,          // Required
  lastName: String,           // Required
  email: String,              // Required, unique
  password: String,           // Bcrypt hashed
  role: "student" | "admin",
  schoolName: String,         // Required for students
  programName: String,        // Required for students
  academicRecords: [{         // Transcript
    courseSubject: String,    // e.g., "COMP"
    courseNumber: String,     // e.g., "213"
    term: String,             // Fall, Winter, Spring, Summer
    year: Number,
    grade: String,            // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, P, I, W
    credits: Number
  }],
  profilePic: String,
  bio: String,
  linkedin: String
}
```

### Course
```javascript
{
  institution: String,        // Required
  courseSubject: String,      // 2-5 uppercase letters
  courseNumber: String,       // 2-4 digits
  title: String,              // Required
  description: String,
  credits: Number,            // Default: 3
  prerequisites: [String],
  corequisites: [String],
  // Auto-calculated (null if < 3 reviews):
  avgDifficulty: Number,
  avgUsefulness: Number,
  avgWorkload: Number,
  avgGradingFairness: Number,
  numReviews: Number,
  topTags: [String]
}
// Unique: institution + courseSubject + courseNumber
```

### Review
```javascript
{
  courseId: ObjectId,
  authorUid: String,          // Auto from auth
  term: String,
  year: Number,
  difficulty: Number,         // 1-5
  usefulness: Number,         // 1-5
  workload: Number,           // 1-5
  gradingFairness: Number,    // 1-5
  tags: [String],             // Max 5, controlled vocabulary
  comment: String,            // Max 2000 chars
  isAnonymous: Boolean,
  status: "active" | "deleted"
}
// Unique: authorUid + courseId + term + year
```

### Project
```javascript
{
  title: String,
  description: String,
  owner: String,              // User UID
  courseId: ObjectId,         // Optional
  tags: [String],
  status: "active" | "archived" | "draft"
}
```

### Feedback
```javascript
{
  projectId: ObjectId,
  authorId: String,           // User UID
  rating: Number,             // 1-5
  comment: String
}
// Unique: authorId + projectId
```

---

## Middleware

| Middleware | Purpose |
|------------|---------|
| `authMiddleware` | Verify JWT, attach user to request |
| `ownershipMiddleware` | Check resource ownership |
| `reviewAuth` | Verify transcript eligibility |

---

## Services

### TranscriptService
GPA calculations with global grade scale support.

| Grade | GPA |
|-------|-----|
| A+ | 4.5 |
| A | 4.0 |
| A- | 3.7 |
| B+ | 3.3 |
| B | 3.0 |
| ... | ... |
| F | 0.0 |
| P, I, W | Excluded |

### ReviewService
Calculates course aggregates (avgDifficulty, topTags, etc.) after review CRUD operations.

---

## Authorization Rules

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| User | Public | Public | Auth + Self | Auth + Self |
| Course | Auth | Public | Auth | Auth |
| Review | Auth + Transcript | Public | Author | Author |
| Project | Auth | Public | Owner | Owner |
| Feedback | Auth | Public | Author | Author |

---

## Error Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing/invalid token |
| 403 | Not authorized (ownership) |
| 404 | Not found |
| 409 | Duplicate |
