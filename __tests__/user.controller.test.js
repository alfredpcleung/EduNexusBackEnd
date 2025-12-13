const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const UserController = require('../app/Controllers/user');
const UserModel = require('../app/Models/user');
const userRouter = require('../app/Routers/user');
const authRouter = require('../app/Routers/auth');

// Mock MongoDB connection
jest.mock('../config/db.js', () => jest.fn());

describe('User Controller', () => {
  let app;
  let userId;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);

    // Connect to test database
    const mongoUri = process.env.TEST_ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear users collection
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('POST /api/users - Create User', () => {
    it('should create a user with valid body', async () => {
      const uniqueUid = 'test_user_' + Date.now();
      const validUser = {
        uid: uniqueUid,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john' + Date.now() + '@example.com',
        password: 'SecurePassword123',
        role: 'student',
        schoolName: 'Test University',
        programName: 'Computer Science'
      };

      const res = await request(app)
        .post('/api/users')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.lastName).toBe('Doe');
    });
  });

  describe('GET /api/users - List Users', () => {
    it('should return empty list when no users exist', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('should return all users', async () => {
      // Create two users via signup
      const user1Res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'List',
          lastName: 'Tester',
          email: 'listtest1' + Date.now() + '@example.com',
          password: 'TestPassword123',
          role: 'student',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      const user2Res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          email: 'listtest2' + Date.now() + '@example.com',
          password: 'TestPassword123',
          role: 'admin'
        });

      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    it('should return user by id', async () => {
      const uniqueUid = 'user_' + Date.now();
      const user = {
        uid: uniqueUid,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john' + Date.now() + '@example.com',
        password: 'SecurePassword123',
        role: 'student',
        schoolName: 'Test University',
        programName: 'Computer Science'
      };

      const createRes = await request(app)
        .post('/api/users')
        .send(user);

      expect(createRes.status).toBe(201);

      const res = await request(app)
        .get(`/api/users/${uniqueUid}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.lastName).toBe('Doe');
      expect(res.body.data.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUid = 'non_existent_uid_' + Date.now();

      const res = await request(app)
        .get(`/api/users/${fakeUid}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    let authToken;
    let testUid;

    beforeEach(async () => {
      // Create a user via auth signup
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Update',
          lastName: 'Tester',
          email: 'updatetest' + Date.now() + '@example.com',
          password: 'TestPassword123',
          role: 'student',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      authToken = signupRes.body.data.token;
      testUid = signupRes.body.data.user.uid;
    });

    it('should update user with valid data', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Updated bio',
      };

      const res = await request(app)
        .put(`/api/users/${testUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.lastName).toBe('Doe');
      expect(res.body.data.bio).toBe('Updated bio');
    });

    it('should update partial fields', async () => {
      const updateData = {
        bio: 'Only bio updated',
      };

      const res = await request(app)
        .put(`/api/users/${testUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Update'); // Should remain unchanged
      expect(res.body.data.lastName).toBe('Tester');
      expect(res.body.data.bio).toBe('Only bio updated');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUid = 'fake_uid_' + Date.now();
      const updateData = { firstName: 'Test', lastName: 'User' };

      const res = await request(app)
        .put(`/api/users/${fakeUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    let authToken;
    let testUid;

    beforeEach(async () => {
      // Create a user via auth signup
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Delete',
          lastName: 'Tester',
          email: 'deletetest' + Date.now() + '@example.com',
          password: 'TestPassword123',
          role: 'student',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      authToken = signupRes.body.data.token;
      testUid = signupRes.body.data.user.uid;
    });

    it('should delete user successfully', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');

      // Verify user is deleted
      const deletedUser = await UserModel.findOne({ uid: testUid });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      const fakeUid = 'non_existent_uid_' + Date.now();

      const res = await request(app)
        .delete(`/api/users/${fakeUid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
