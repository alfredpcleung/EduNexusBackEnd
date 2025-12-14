const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../app/Models/user');
const userRouter = require('../app/Routers/user');
const authRouter = require('../app/Routers/auth');
jest.mock('../config/db.js', () => jest.fn());

describe('User Controller', () => {

  let app;
  const mongoUri = process.env.ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users - Create User', () => {


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
          school: 'Test University',
          fieldOfStudy: 'Computer Science'
        });

      authToken = signupRes.body.data.token;
      testUid = signupRes.body.data.user.uid;
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
          school: 'Test University',
          fieldOfStudy: 'Computer Science'
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
      const deletedUser = await User.findOne({ uid: testUid });
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

  describe('User Model Validation', () => {
    test('should throw error if school is missing for student role', async () => {
      const user = new User({
        role: 'student',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      await expect(user.validate()).rejects.toThrow(/school: Path `school` is required/);
    });

    test('should throw error if fieldOfStudy is missing for student role', async () => {
      const user = new User({
        role: 'student',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        school: 'Test University',
      });

      await expect(user.validate()).rejects.toThrow(/fieldOfStudy: Path `fieldOfStudy` is required/);
    });

    test('should validate successfully for admin role without school and fieldOfStudy', async () => {
      const user = new User({
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'adminpassword',
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });
  });
});
