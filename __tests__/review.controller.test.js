const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const CourseModel = require('../app/Models/course');
const ReviewModel = require('../app/Models/review');
const UserModel = require('../app/Models/user');
const courseRouter = require('../app/Routers/course');
const reviewRouter = require('../app/Routers/review');
const authRouter = require('../app/Routers/auth');
const userRouter = require('../app/Routers/user');
const { REVIEW_TAGS, MIN_REVIEWS_FOR_AGGREGATES } = require('../app/Constants/reviewTags');

// Mock MongoDB connection
jest.mock('../config/db.js', () => jest.fn());

describe.skip('Review Controller', () => {
  let app;
  let authToken;
  let testUid;
  let testCourse;
  let testCourseId;
  let adminToken;
  let adminUid;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/courses', courseRouter);
    app.use('/api/reviews', reviewRouter);

    // Connect to test database
    const mongoUri = process.env.TEST_ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear collections
    await UserModel.deleteMany({});
    await CourseModel.deleteMany({});
    await ReviewModel.deleteMany({});

    // Create test user with transcript entry
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Review',
        lastName: 'Tester',
        email: 'reviewtest@example.com',
        password: 'TestPassword123',
        role: 'student',
        schoolName: 'Centennial College',
        programName: 'Software Engineering'
      });

    authToken = signupRes.body.data.token;
    testUid = signupRes.body.data.user.uid;

    // Create admin user
    const adminSignupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'AdminPassword123',
        role: 'admin',
        schoolName: 'Centennial College',
        programName: 'Administration'
      });

    adminToken = adminSignupRes.body.data.token;
    adminUid = adminSignupRes.body.data.user.uid;

    // Create test course
    testCourse = await CourseModel.create({
      school: 'Centennial College',
      courseSubject: 'COMP',
      courseNumber: '246',
      title: 'Web Development'
    });
    testCourseId = testCourse._id.toString();

    // Add transcript entry so user can review
    await UserModel.findOneAndUpdate(
      { uid: testUid },
      {
        $push: {
          academicRecords: {
            term: 'Fall',
            year: 2024,
            subject: 'COMP',
            courseCode: '246',
            courseTitle: 'Web Development',
            creditHours: 4,
            grade: 'A'
          }
        }
      }
    );
  });

  afterAll(async () => {
    await ReviewModel.deleteMany({});
    await CourseModel.deleteMany({});
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
    // Reset course aggregates
    await CourseModel.findByIdAndUpdate(testCourseId, {
      avgDifficulty: null,
      avgUsefulness: null,
      avgWorkload: null,
      avgGradingFairness: null,
      numReviews: 0,
      topTags: [],
      lastReviewAt: null
    });
  });

  // ==========================================
  // GET TAGS TESTS
  // ==========================================
  describe('GET /api/reviews/tags - Get Available Tags', () => {
    it('should return all available review tags', async () => {
      const res = await request(app)
        .get('/api/reviews/tags')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toEqual(REVIEW_TAGS);
    });
  });

  // ==========================================
  // CREATE REVIEW TESTS
  // ==========================================
  describe('POST /api/reviews - Create Review', () => {
    const validReview = {
      term: 'Fall',
      year: 2024,
      difficulty: 3,
      usefulness: 4,
      workload: 3,
      gradingFairness: 4,
      tags: ['Heavy workload', 'Project-based'],
      comment: 'Great course, learned a lot!'
    };

    it('should create a review with valid data', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.difficulty).toBe(3);
      expect(res.body.data.usefulness).toBe(4);
      expect(res.body.data.tags).toContain('Heavy workload');
      expect(res.body.data.authorUid).toBe(testUid);
    });

    it('should reject review without transcript entry', async () => {
      // Create another course user hasn't taken
      const otherCourse = await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'MATH',
        courseNumber: '181',
        title: 'Calculus'
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: otherCourse._id.toString()
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No transcript entry found');
    });

    it('should reject duplicate review for same course/term/year', async () => {
      // Create first review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId
        })
        .expect(201);

      // Try duplicate - middleware catches this and returns 403
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId
        })
        .expect(403);

      expect(res.body.message).toContain('already reviewed');
    });

    it('should validate metric range (1-5)', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId,
          difficulty: 6 // Invalid
        })
        .expect(400);

      expect(res.body.message).toContain('between 1 and 5');
    });

    it('should validate tags against controlled vocabulary', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId,
          tags: ['Invalid Tag']
        })
        .expect(400);

      expect(res.body.message).toContain('Invalid tag');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          ...validReview,
          courseId: testCourseId
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should update course aggregates after review creation', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId
        })
        .expect(201);

      const course = await CourseModel.findById(testCourseId);
      expect(course.numReviews).toBe(1);
      expect(course.lastReviewAt).toBeTruthy();
      // Aggregates should still be null (< 3 reviews)
      expect(course.avgDifficulty).toBeNull();
    });

    it('should support anonymous reviews', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validReview,
          courseId: testCourseId,
          isAnonymous: true
        })
        .expect(201);

      expect(res.body.data.isAnonymous).toBe(true);
    });
  });

  // ==========================================
  // LIST REVIEWS TESTS
  // ==========================================
  describe('GET /api/reviews - List Reviews', () => {
    beforeEach(async () => {
      // Create multiple reviews directly in DB
      await ReviewModel.create([
        {
          courseId: testCourseId,
          authorUid: testUid,
          term: 'Fall',
          year: 2024,
          difficulty: 3,
          usefulness: 4,
          workload: 3,
          gradingFairness: 4,
          tags: ['Heavy workload'],
          status: 'active'
        },
        {
          courseId: testCourseId,
          authorUid: adminUid,
          term: 'Winter',
          year: 2024,
          difficulty: 4,
          usefulness: 5,
          workload: 4,
          gradingFairness: 3,
          tags: ['Project-based'],
          status: 'active'
        }
      ]);
    });

    it('should list all active reviews', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by courseId', async () => {
      const res = await request(app)
        .get(`/api/reviews?courseId=${testCourseId}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every(r => r.courseId === testCourseId)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/reviews?limit=1&skip=1')
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  // ==========================================
  // GET REVIEWS BY COURSE TESTS
  // ==========================================
  describe('GET /api/reviews/course/:courseId - Get Reviews by Course', () => {
    beforeEach(async () => {
      await ReviewModel.create({
        courseId: testCourseId,
        authorUid: testUid,
        term: 'Fall',
        year: 2024,
        difficulty: 3,
        usefulness: 4,
        workload: 3,
        gradingFairness: 4,
        status: 'active'
      });
    });

    it('should get reviews for specific course', async () => {
      const res = await request(app)
        .get(`/api/reviews/course/${testCourseId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should return empty array for course with no reviews', async () => {
      const otherCourse = await CourseModel.create({
        school: 'Other College',
        courseSubject: 'COMP',
        courseNumber: '100',
        title: 'Intro to Programming'
      });

      const res = await request(app)
        .get(`/api/reviews/course/${otherCourse._id}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  // ==========================================
  // GET REVIEW BY ID TESTS
  // ==========================================
  describe('GET /api/reviews/:id - Get Review by ID', () => {
    let reviewId;

    beforeEach(async () => {
      const review = await ReviewModel.create({
        courseId: testCourseId,
        authorUid: testUid,
        term: 'Fall',
        year: 2024,
        difficulty: 3,
        usefulness: 4,
        workload: 3,
        gradingFairness: 4,
        status: 'active'
      });
      reviewId = review._id.toString();
    });

    it('should get review by ID', async () => {
      const res = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.difficulty).toBe(3);
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/reviews/${fakeId}`)
        .expect(404);

      expect(res.body.message).toBe('Review not found');
    });
  });

  // ==========================================
  // UPDATE REVIEW TESTS
  // ==========================================
  describe('PUT /api/reviews/:id - Update Review', () => {
    let reviewId;

    beforeEach(async () => {
      const review = await ReviewModel.create({
        courseId: testCourseId,
        authorUid: testUid,
        term: 'Fall',
        year: 2024,
        difficulty: 3,
        usefulness: 4,
        workload: 3,
        gradingFairness: 4,
        comment: 'Original comment',
        status: 'active'
      });
      reviewId = review._id.toString();
    });

    it('should update review as author', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          difficulty: 4,
          comment: 'Updated comment'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.difficulty).toBe(4);
      expect(res.body.data.comment).toBe('Updated comment');
    });

    it('should reject update from non-author', async () => {
      // Create another user
      const otherUserRes = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Other',
          lastName: 'User',
          email: 'otheruser@example.com',
          password: 'TestPassword123',
          role: 'student',
          schoolName: 'Centennial College',
          programName: 'Software Engineering'
        });

      const otherToken = otherUserRes.body.data.token;

      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ difficulty: 5 })
        .expect(403);

      expect(res.body.message).toContain('only modify your own');
    });

    it('should allow admin to update any review', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comment: 'Admin updated' })
        .expect(200);

      expect(res.body.data.comment).toBe('Admin updated');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .send({ difficulty: 5 })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // DELETE REVIEW TESTS
  // ==========================================
  describe('DELETE /api/reviews/:id - Delete Review', () => {
    let reviewId;

    beforeEach(async () => {
      const review = await ReviewModel.create({
        courseId: testCourseId,
        authorUid: testUid,
        term: 'Fall',
        year: 2024,
        difficulty: 3,
        usefulness: 4,
        workload: 3,
        gradingFairness: 4,
        status: 'active'
      });
      reviewId = review._id.toString();
    });

    it('should soft delete review as author', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify soft delete
      const review = await ReviewModel.findById(reviewId);
      expect(review.status).toBe('deleted');
    });

    it('should reject delete from non-author', async () => {
      const otherUserRes = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Delete',
          lastName: 'Tester',
          email: 'deletetester@example.com',
          password: 'TestPassword123',
          role: 'student',
          schoolName: 'Centennial College',
          programName: 'Software Engineering'
        });

      const otherToken = otherUserRes.body.data.token;

      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body.message).toContain('only modify your own');
    });

    it('should allow admin to delete any review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should update course aggregates after deletion', async () => {
      await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const course = await CourseModel.findById(testCourseId);
      expect(course.numReviews).toBe(0);
    });
  });

  // ==========================================
  // AGGREGATION TESTS
  // ==========================================
  describe('Course Aggregate Calculations', () => {
    it('should show null aggregates when less than MIN_REVIEWS_FOR_AGGREGATES', async () => {
      // Create 2 reviews (below threshold)
      await ReviewModel.create([
        {
          courseId: testCourseId,
          authorUid: testUid,
          term: 'Fall',
          year: 2024,
          difficulty: 3,
          usefulness: 4,
          workload: 3,
          gradingFairness: 4,
          status: 'active'
        },
        {
          courseId: testCourseId,
          authorUid: adminUid,
          term: 'Winter',
          year: 2024,
          difficulty: 4,
          usefulness: 5,
          workload: 4,
          gradingFairness: 3,
          status: 'active'
        }
      ]);

      // Manually trigger aggregation refresh
      await request(app)
        .post(`/api/reviews/refresh-aggregates/${testCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const course = await CourseModel.findById(testCourseId);
      expect(course.numReviews).toBe(2);
      expect(course.avgDifficulty).toBeNull();
      expect(course.avgUsefulness).toBeNull();
    });

    it('should calculate aggregates when reaching MIN_REVIEWS_FOR_AGGREGATES', async () => {
      // Create MIN_REVIEWS_FOR_AGGREGATES reviews
      const users = [];
      for (let i = 0; i < MIN_REVIEWS_FOR_AGGREGATES; i++) {
        const userRes = await request(app)
          .post('/api/auth/signup')
          .send({
            firstName: `Reviewer${i}`,
            lastName: 'Test',
            email: `reviewer${i}@example.com`,
            password: 'TestPassword123',
            role: 'student',
            schoolName: 'Centennial College',
            programName: 'Software Engineering'
          });
        users.push(userRes.body.data.user.uid);
      }

      // Create reviews directly
      for (let i = 0; i < MIN_REVIEWS_FOR_AGGREGATES; i++) {
        await ReviewModel.create({
          courseId: testCourseId,
          authorUid: users[i],
          term: 'Fall',
          year: 2024 - i, // Different years to avoid duplicate constraint
          difficulty: 3,
          usefulness: 4,
          workload: 3,
          gradingFairness: 4,
          tags: ['Heavy workload'],
          status: 'active'
        });
      }

      // Trigger aggregation refresh
      await request(app)
        .post(`/api/reviews/refresh-aggregates/${testCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const course = await CourseModel.findById(testCourseId);
      expect(course.numReviews).toBe(MIN_REVIEWS_FOR_AGGREGATES);
      expect(course.avgDifficulty).toBe(3);
      expect(course.avgUsefulness).toBe(4);
      expect(course.topTags).toContain('Heavy workload');
    });
  });

  // ==========================================
  // REFRESH AGGREGATES TESTS
  // ==========================================
  describe('POST /api/reviews/refresh-aggregates/:courseId - Refresh Aggregates', () => {
    it('should refresh aggregates as admin', async () => {
      const res = await request(app)
        .post(`/api/reviews/refresh-aggregates/${testCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post(`/api/reviews/refresh-aggregates/${testCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/reviews/refresh-aggregates/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.message).toBe('Course not found');
    });
  });
});
