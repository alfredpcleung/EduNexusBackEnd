const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const UserController = require('../App/Controllers/user');
const UserModel = require('../App/Models/user');
const userRouter = require('../App/Routers/user');

// Mock MongoDB connection
jest.mock('../Config/db.js', () => jest.fn());

describe('User Controller', () => {
  let app;
  let userId;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRouter);

    // Connect to test database
    const mongoUri = process.env.TEST_ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
      const validUser = {
        uid: 'user123',
        displayName: 'John Doe',
        email: 'john@example.com',
        role: 'student',
      };

      const res = await request(app)
        .post('/api/users')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
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
      const users = [
        { uid: 'user1', displayName: 'User 1', email: 'user1@example.com' },
        { uid: 'user2', displayName: 'User 2', email: 'user2@example.com' },
      ];

      for (const user of users) {
        await request(app).post('/api/users').send(user);
      }

      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    it('should return user by id', async () => {
      const uniqueUid = 'user_' + Date.now();
      const user = {
        uid: uniqueUid,
        displayName: 'John Doe',
        email: 'john' + Date.now() + '@example.com',
        role: 'student',
      };

      const createRes = await request(app)
        .post('/api/users')
        .send(user);

      expect(createRes.status).toBe(201);
      userId = uniqueUid;

      const res = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('John Doe');
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
    beforeEach(async () => {
      const uniqueUid = 'user_' + Date.now() + '_update';
      const user = {
        uid: uniqueUid,
        displayName: 'John Doe',
        email: 'john' + Date.now() + '_update@example.com',
        role: 'student',
        bio: 'Original bio',
      };

      const createRes = await request(app).post('/api/users').send(user);
      expect(createRes.status).toBe(201);
      userId = uniqueUid;
    });

    it('should update user with valid data', async () => {
      const updateData = {
        displayName: 'Jane Doe',
        bio: 'Updated bio',
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Jane Doe');
      expect(res.body.data.bio).toBe('Updated bio');
    });

    it('should update partial fields', async () => {
      const updateData = {
        bio: 'Only bio updated',
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('John Doe'); // Should remain unchanged
      expect(res.body.data.bio).toBe('Only bio updated');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = { displayName: 'Test' };

      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not Found');
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    beforeEach(async () => {
      const uniqueUid = 'user_' + Date.now() + '_delete';
      const user = {
        uid: uniqueUid,
        displayName: 'John Doe',
        email: 'john' + Date.now() + '_delete@example.com',
        role: 'student',
      };

      const createRes = await request(app).post('/api/users').send(user);
      expect(createRes.status).toBe(201);
      userId = uniqueUid;
    });

    it('should delete user successfully', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');

      // Verify user is deleted
      const deletedUser = await UserModel.findOne({ uid: userId });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      const fakeUid = 'non_existent_uid_' + Date.now();

      const res = await request(app)
        .delete(`/api/users/${fakeUid}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
