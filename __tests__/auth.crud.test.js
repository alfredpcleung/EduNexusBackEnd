const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Setup Express app for testing
let app;
let server;
let authToken;
let testUserId;
let testUid;
let testEmail = 'testuser@example.com';
let testPassword = 'TestPassword123';

// Import models and routers
const UserModel = require('../App/Models/user');
const CourseModel = require('../App/Models/course');
const authRouter = require('../App/Routers/auth');
const userRouter = require('../App/Routers/user');
const courseRouter = require('../App/Routers/course');

describe('Authentication & CRUD Tests', () => {
  beforeAll(async () => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/courses', courseRouter);

    // Connect to MongoDB (use test database)
    const mongoUri = process.env.ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    // Clear collections before tests
    await UserModel.deleteMany({});
    await CourseModel.deleteMany({});

    server = app.listen(3001);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe('Authentication - Sign Up', () => {
    test('Should successfully sign up a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          displayName: 'Test User',
          email: testEmail,
          password: testPassword,
          role: 'student'
          // uid is optional - will be auto-generated
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.displayName).toBe('Test User');
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.uid).toBeDefined(); // Verify uid was auto-generated

      // Store token and userId for later tests
      authToken = res.body.data.token;
      testUid = res.body.data.user.uid;
    });

    test('Should fail signup with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          displayName: 'Test User'
          // missing email and password
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    test('Should fail signup with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          displayName: 'Another User',
          email: testEmail, // Same email as first test
          password: testPassword
          // uid is optional
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('Authentication - Sign In', () => {
    test('Should successfully sign in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.displayName).toBe('Test User');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    test('Should fail signin with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: 'WrongPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    test('Should fail signin with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    test('Should fail signin with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testEmail
          // missing password
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });
  });

  // ============================================
  // COURSE CRUD TESTS
  // ============================================

  let courseId;

  describe('Courses - Create (Protected)', () => {
    test('Should fail to create course without auth token', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({
          title: 'Test Course',
          description: 'Test Description',
          instructor: 'Dr. Test',
          credits: 3,
          tags: ['test']
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    test('Should fail to create course with invalid token', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer invalid_token_here')
        .send({
          title: 'Test Course',
          description: 'Test Description',
          instructor: 'Dr. Test',
          credits: 3
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid token');
    });

    test('Should successfully create course with valid auth token', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Advanced JavaScript',
          description: 'Learn advanced JavaScript concepts',
          instructor: 'Dr. Smith',
          credits: 4,
          tags: ['javascript', 'advanced'],
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Advanced JavaScript');
      expect(res.body.data.owner).toBe(testUid); // Verify owner is the authenticated user's UID
      expect(res.body.data.credits).toBe(4);

      // Store course ID from the response
      courseId = res.body.data._id || res.body.data.id;
    });
  });

  describe('Courses - Read (Public)', () => {
    test('Should list all courses without auth', async () => {
      const res = await request(app)
        .get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBeDefined();
    });

    test('Should get course by ID without auth', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(courseId);
      expect(res.body.data.title).toBe('Advanced JavaScript');
      expect(res.body.data.owner).toBe(testUid);
    });

    test('Should fail to get non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/courses/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Courses - Update (Protected + Owner Check)', () => {
    test('Should fail to update course without auth token', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send({
          title: 'Updated Title'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to update course with invalid token', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', 'Bearer invalid_token')
        .send({
          title: 'Updated Title'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should successfully update own course', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated JavaScript Course',
          credits: 5,
          status: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated JavaScript Course');
      expect(res.body.data.credits).toBe(5);
      expect(res.body.data.status).toBe('archived');
    });

    test('Should fail to update course owned by another user', async () => {
      // Create another user and try to update first user's course
      const newUserEmail = 'otheruser@example.com';
      const newUserRes = await request(app)
        .post('/api/auth/signup')
        .send({
          displayName: 'Other User',
          email: newUserEmail,
          password: 'OtherPassword123'
          // uid is optional - will be auto-generated
        });

      const otherUserToken = newUserRes.body.data.token;

      const updateRes = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);
      expect(updateRes.body.message).toContain('not authorized');
    });
  });

  describe('Courses - Delete (Protected + Owner Check)', () => {
    test('Should fail to delete course without auth token', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to delete course owned by another user', async () => {
      const newUserEmail = 'deletetest@example.com';
      const newUserRes = await request(app)
        .post('/api/auth/signup')
        .send({
          displayName: 'Delete Test User',
          email: newUserEmail,
          password: 'DeletePassword123'
          // uid is optional - will be auto-generated
        });

      const otherUserToken = newUserRes.body.data.token;

      const deleteRes = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.success).toBe(false);
    });

    test('Should successfully delete own course', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');
    });

    test('Should not be able to get deleted course', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // USER CRUD TESTS
  // ============================================

  describe('Users - Read (Public)', () => {
    test('Should list all users without auth', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Should get user by ID without auth', async () => {
      const res = await request(app)
        .get(`/api/users/${testUid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Test User');
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.password).toBeUndefined(); // Password should never be returned
    });
  });

  describe('Users - Update (Protected)', () => {
    test('Should fail to update user without auth token', async () => {
      const res = await request(app)
        .put(`/api/users/${testUid}`)
        .send({
          displayName: 'Updated Name'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should successfully update own user profile', async () => {
      const res = await request(app)
        .put(`/api/users/${testUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Test User',
          bio: 'Updated bio'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Updated Test User');
      expect(res.body.data.bio).toBe('Updated bio');
    });
  });

  describe('Users - Delete (Protected)', () => {
    test('Should fail to delete user without auth token', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUid}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should successfully delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');
    });
  });
});
