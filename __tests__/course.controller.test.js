const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const CourseModel = require('../app/Models/course');
const UserModel = require('../app/Models/user');
const courseRouter = require('../app/Routers/course');
const authRouter = require('../app/Routers/auth');

// Mock MongoDB connection
jest.mock('../config/db.js', () => jest.fn());

describe.skip('Course Controller - New Schema', () => {
  let app;
  let authToken;
  let testUid;
  let testCourseId;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/courses', courseRouter);

    // Connect to test database
    const mongoUri = process.env.TEST_ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear collections
    await UserModel.deleteMany({});
    await CourseModel.deleteMany({});

    // Create test user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Course',
        lastName: 'Tester',
        email: 'coursetest@example.com',
        password: 'TestPassword123',
        role: 'student',
        school: 'Centennial College',
        fieldOfStudy: 'Software Engineering'
      });

    authToken = signupRes.body.data.token;
    testUid = signupRes.body.data.user.uid;
  });

  afterAll(async () => {
    await CourseModel.deleteMany({});
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await CourseModel.deleteMany({});
  });

  // ==========================================
  // CREATE COURSE TESTS
  // ==========================================
  describe('POST /api/courses - Create Course', () => {
    const validCourse = {
      school: 'Centennial College',
      courseSubject: 'COMP',
      courseNumber: '246',
      title: 'Web Development',
      description: 'Learn full-stack web development',
      credits: 4
    };

    it('should create a course with valid data', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCourse)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.school).toBe('Centennial College');
      expect(res.body.data.courseSubject).toBe('COMP');
      expect(res.body.data.courseNumber).toBe('246');
      expect(res.body.data.title).toBe('Web Development');
      expect(res.body.data.courseCode).toBe('COMP 246');
    });

    it('should normalize courseSubject to uppercase', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, courseSubject: 'comp' })
        .expect(201);

      expect(res.body.data.courseSubject).toBe('COMP');
    });

    it('should reject duplicate course (same school/subject/number)', async () => {
      // Create first
      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCourse)
        .expect(201);

      // Try duplicate
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCourse)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should require school', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, school: '' })
        .expect(400);

      expect(res.body.message).toContain('School is required');
    });

    it('should require courseSubject', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, courseSubject: '' })
        .expect(400);

      expect(res.body.message).toContain('Course subject is required');
    });

    it('should require courseNumber', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, courseNumber: '' })
        .expect(400);

      expect(res.body.message).toContain('Course number is required');
    });

    it('should require title', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, title: '' })
        .expect(400);

      expect(res.body.message).toContain('Course title is required');
    });

    it('should validate courseSubject format (2-5 uppercase letters)', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, courseSubject: 'A' }) // Too short
        .expect(400);

      expect(res.body.message).toContain('2-5 uppercase letters');
    });

    it('should validate courseNumber format (2-4 digits)', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validCourse, courseNumber: '1' }) // Too short
        .expect(400);

      expect(res.body.message).toContain('2-4 digits');
    });

    it('should create course with prerequisites', async () => {
      const courseWithPrereqs = {
        ...validCourse,
        prerequisites: [
          { subject: 'COMP', number: '100' },
          { subject: 'MATH', number: '181' }
        ]
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(courseWithPrereqs)
        .expect(201);

      expect(res.body.data.prerequisites).toHaveLength(2);
      expect(res.body.data.prerequisites[0].subject).toBe('COMP');
    });

    it('should create course with syllabusRevisionDate', async () => {
      const courseWithSyllabus = {
        ...validCourse,
        syllabusRevisionDate: '2024-09-01'
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(courseWithSyllabus)
        .expect(201);

      expect(res.body.data.syllabusRevisionDate).toBeTruthy();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send(validCourse)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should initialize aggregates as null', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCourse)
        .expect(201);

      expect(res.body.data.avgDifficulty).toBeNull();
      expect(res.body.data.avgUsefulness).toBeNull();
      expect(res.body.data.avgWorkload).toBeNull();
      expect(res.body.data.avgGradingFairness).toBeNull();
      expect(res.body.data.numReviews).toBe(0);
    });
  });

  // ==========================================
  // LIST COURSES TESTS
  // ==========================================
  describe('GET /api/courses - List Courses', () => {
    beforeEach(async () => {
      // Create test courses
      await CourseModel.create([
        { school: 'Centennial College', courseSubject: 'COMP', courseNumber: '100', title: 'Intro to Programming' },
        { school: 'Centennial College', courseSubject: 'COMP', courseNumber: '213', title: 'Web Development I' },
        { school: 'Centennial College', courseSubject: 'MATH', courseNumber: '181', title: 'Calculus' },
        { school: 'Other College', courseSubject: 'COMP', courseNumber: '100', title: 'Programming Basics' }
      ]);
    });

    it('should list all courses', async () => {
      const res = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by school', async () => {
      const res = await request(app)
        .get('/api/courses?school=Centennial College')
        .expect(200);

      expect(res.body.data.length).toBe(3);
      expect(res.body.data.every(c => c.school === 'Centennial College')).toBe(true);
    });

    it('should filter by courseSubject', async () => {
      const res = await request(app)
        .get('/api/courses?courseSubject=MATH')
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].courseSubject).toBe('MATH');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/courses?limit=2&skip=1')
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.skip).toBe(1);
      expect(res.body.pagination.total).toBe(4);
    });
  });

  // ==========================================
  // GET COURSE BY ID TESTS
  // ==========================================
  describe('GET /api/courses/:id - Get Course', () => {
    let courseId;

    beforeEach(async () => {
      const course = await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'COMP',
        courseNumber: '246',
        title: 'Web Development'
      });
      courseId = course._id.toString();
    });

    it('should get course by ID', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courseSubject).toBe('COMP');
      expect(res.body.data.courseNumber).toBe('246');
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/courses/${fakeId}`)
        .expect(404);

      expect(res.body.message).toBe('Course not found');
    });
  });

  // ==========================================
  // LOOKUP COURSE TESTS
  // ==========================================
  describe('GET /api/courses/lookup/:school/:subject/:number', () => {
    beforeEach(async () => {
      await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'COMP',
        courseNumber: '246',
        title: 'Web Development'
      });
    });

    it('should find course by school/subject/number', async () => {
      const res = await request(app)
        .get('/api/courses/lookup/Centennial College/COMP/246')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Web Development');
    });

    it('should handle case-insensitive subject lookup', async () => {
      const res = await request(app)
        .get('/api/courses/lookup/Centennial College/comp/246')
        .expect(200);

      expect(res.body.data.courseSubject).toBe('COMP');
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .get('/api/courses/lookup/Centennial College/COMP/999')
        .expect(404);

      expect(res.body.message).toBe('Course not found');
    });
  });

  // ==========================================
  // UPDATE COURSE TESTS
  // ==========================================
  describe('PUT /api/courses/:id - Update Course', () => {
    let courseId;

    beforeEach(async () => {
      const course = await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'COMP',
        courseNumber: '246',
        title: 'Web Development',
        description: 'Original description'
      });
      courseId = course._id.toString();
    });

    it('should update course metadata', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Advanced Web Development',
          description: 'Updated description',
          credits: 5
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Advanced Web Development');
      expect(res.body.data.description).toBe('Updated description');
      expect(res.body.data.credits).toBe(5);
    });

    it('should not allow direct aggregate updates', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          avgDifficulty: 5,
          numReviews: 100
        })
        .expect(200);

      // Aggregates should not change
      const course = await CourseModel.findById(courseId);
      expect(course.avgDifficulty).toBeNull();
      expect(course.numReviews).toBe(0);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send({ title: 'New Title' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/courses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(res.body.message).toBe('Course not found');
    });
  });

  // ==========================================
  // DELETE COURSE TESTS
  // ==========================================
  describe('DELETE /api/courses/:id - Delete Course', () => {
    let courseId;

    beforeEach(async () => {
      const course = await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'COMP',
        courseNumber: '246',
        title: 'Web Development'
      });
      courseId = course._id.toString();
    });

    it('should delete course', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Course deleted successfully');

      // Verify deleted
      const course = await CourseModel.findById(courseId);
      expect(course).toBeNull();
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/courses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.message).toBe('Course not found');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // FIND OR CREATE TESTS
  // ==========================================
  describe('POST /api/courses/find-or-create', () => {
    it('should create new course if not exists', async () => {
      const res = await request(app)
        .post('/api/courses/find-or-create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          school: 'Centennial College',
          courseSubject: 'COMP',
          courseNumber: '123',
          title: 'New Course'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courseSubject).toBe('COMP');
    });

    it('should return existing course if exists', async () => {
      // Create first
      await CourseModel.create({
        school: 'Centennial College',
        courseSubject: 'COMP',
        courseNumber: '123',
        title: 'Existing Course'
      });

      const res = await request(app)
        .post('/api/courses/find-or-create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          school: 'Centennial College',
          courseSubject: 'COMP',
          courseNumber: '123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Existing Course');
    });

    it('should generate default title if not provided', async () => {
      const res = await request(app)
        .post('/api/courses/find-or-create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          school: 'Centennial College',
          courseSubject: 'COMP',
          courseNumber: '999'
        })
        .expect(200);

      expect(res.body.data.title).toBe('COMP 999');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/courses/find-or-create')
        .send({
          institution: 'Centennial College',
          courseSubject: 'COMP',
          courseNumber: '123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
