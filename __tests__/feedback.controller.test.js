const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const configDb = require('../Config/db.js');

// Import routers and models
const authRouter = require('../App/Routers/auth');
const userRouter = require('../App/Routers/user');
const projectRouter = require('../App/Routers/project');
const feedbackRouter = require('../App/Routers/feedback');
const User = require('../App/Models/user');
const Project = require('../App/Models/project');
const Feedback = require('../App/Models/feedback');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/feedback', feedbackRouter);

// Test data
let token1, token2, token3, user1Uid, user2Uid, user3Uid;
let projectId1, projectId2, feedbackId1;

describe('Feedback Controller Tests', () => {
  
  beforeAll(async () => {
    // Connect to database
    configDb();
    
    // Clear collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});

    // Create test users
    const signup1 = await request(app)
      .post('/auth/signup')
      .send({
        displayName: 'Reviewer User',
        email: 'reviewer@test.com',
        password: 'password123'
      });

    token1 = signup1.body.token;
    user1Uid = signup1.body.user.uid;

    const signup2 = await request(app)
      .post('/auth/signup')
      .send({
        displayName: 'Project Creator',
        email: 'creator@test.com',
        password: 'password456'
      });

    token2 = signup2.body.token;
    user2Uid = signup2.body.user.uid;

    const signup3 = await request(app)
      .post('/auth/signup')
      .send({
        displayName: 'Another Reviewer',
        email: 'reviewer2@test.com',
        password: 'password789'
      });

    token3 = signup3.body.token;
    user3Uid = signup3.body.user.uid;

    // Create test projects
    const project1Res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        title: 'First Project',
        description: 'For feedback testing',
        status: 'active'
      });

    projectId1 = project1Res.body.project._id;

    const project2Res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        title: 'Second Project',
        description: 'Another project',
        status: 'active'
      });

    projectId2 = project2Res.body.project._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});
    await mongoose.connection.close();
  });

  // ===== POST /feedback - Create Feedback =====
  describe('POST /feedback - Create Feedback', () => {

    test('should create feedback with valid body', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId1,
          rating: 5,
          comment: 'Excellent work!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.feedback).toBeDefined();
      expect(res.body.feedback.projectId).toBe(projectId1);
      expect(res.body.feedback.rating).toBe(5);
      expect(res.body.feedback.comment).toBe('Excellent work!');
      expect(res.body.feedback.authorId).toBe(user1Uid);
      expect(res.body.feedback._id).toBeDefined();
      expect(res.body.feedback.created).toBeDefined();
      expect(res.body.feedback.updated).toBeDefined();

      feedbackId1 = res.body.feedback._id;
    });

    test('should set authorId to authenticated user uid', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token3}`)
        .send({
          projectId: projectId1,
          rating: 4,
          comment: 'Good project'
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.authorId).toBe(user3Uid);
      expect(res.body.feedback.authorId).not.toBe(user1Uid);
    });

    test('should accept optional comment', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId2,
          rating: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.rating).toBe(3);
      expect(res.body.feedback.comment).toBe('');
    });

    test('should accept all valid rating values (1-5)', async () => {
      const ratings = [1, 2, 3, 4, 5];

      for (const rating of ratings) {
        const newUser = await request(app)
          .post('/auth/signup')
          .send({
            displayName: `User Rating ${rating}`,
            email: `ratinguser${rating}@test.com`,
            password: 'password123'
          });

        const res = await request(app)
          .post('/feedback')
          .set('Authorization', `Bearer ${newUser.body.token}`)
          .send({
            projectId: projectId2,
            rating: rating,
            comment: `Rating ${rating}`
          });

        expect(res.status).toBe(201);
        expect(res.body.feedback.rating).toBe(rating);
      }
    });

    test('should prevent same user from creating duplicate feedback for same project', async () => {
      // Try to create second feedback from user1 for projectId1
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId1,
          rating: 4,
          comment: 'Second attempt'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already provided feedback');
    });

    test('should allow same user to feedback on different projects', async () => {
      // token2 should be able to feedback on projectId1 (different from projectId2)
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          projectId: projectId1,
          rating: 5,
          comment: 'Nice project'
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.authorId).toBe(user2Uid);
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post('/feedback')
        .send({
          projectId: projectId1,
          rating: 5
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should fail without projectId', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 5,
          comment: 'No project'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('projectId');
    });

    test('should fail without rating', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId1,
          comment: 'No rating'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('rating');
    });

    test('should fail with rating below 1', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId2,
          rating: 0,
          comment: 'Below range'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 5');
    });

    test('should fail with rating above 5', async () => {
      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId2,
          rating: 10,
          comment: 'Above range'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 5');
    });
  });

  // ===== GET /feedback - List Feedback =====
  describe('GET /feedback - List Feedback', () => {

    test('should return feedback for specific project', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.feedback)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
    });

    test('should include created feedback in results', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      const foundFeedback = res.body.feedback.find(
        f => f._id.toString() === feedbackId1.toString()
      );

      expect(foundFeedback).toBeDefined();
      expect(foundFeedback.rating).toBe(5);
      expect(foundFeedback.comment).toBe('Excellent work!');
      expect(foundFeedback.authorId).toBe(user1Uid);
    });

    test('should filter feedback by projectId', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      expect(res.status).toBe(200);
      
      res.body.feedback.forEach(feedback => {
        expect(feedback.projectId).toBe(projectId1);
      });
    });

    test('should filter feedback by authorId', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}&authorId=${user1Uid}`);

      expect(res.status).toBe(200);
      expect(res.body.feedback.length).toBeGreaterThan(0);
      
      res.body.feedback.forEach(feedback => {
        expect(feedback.authorId).toBe(user1Uid);
      });
    });

    test('should require projectId query parameter', async () => {
      const res = await request(app)
        .get('/feedback');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('projectId');
    });

    test('should return empty array for project with no feedback', async () => {
      // Create new project with no feedback
      const projectRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'No Feedback Project',
          description: 'Will have no feedback'
        });

      const projectId = projectRes.body.project._id;

      const res = await request(app)
        .get(`/feedback?projectId=${projectId}`);

      expect(res.status).toBe(200);
      expect(res.body.feedback).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    test('should not require authentication', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return feedback with all fields', async () => {
      const res = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      expect(res.status).toBe(200);
      const feedback = res.body.feedback[0];

      expect(feedback).toHaveProperty('_id');
      expect(feedback).toHaveProperty('projectId');
      expect(feedback).toHaveProperty('authorId');
      expect(feedback).toHaveProperty('rating');
      expect(feedback).toHaveProperty('comment');
      expect(feedback).toHaveProperty('created');
      expect(feedback).toHaveProperty('updated');
    });
  });

  // ===== PUT /feedback/:id - Update Feedback =====
  describe('PUT /feedback/:id - Update Feedback', () => {

    test('should allow author to update feedback', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 4,
          comment: 'Updated comment'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.feedback.rating).toBe(4);
      expect(res.body.feedback.comment).toBe('Updated comment');
    });

    test('should allow updating only rating', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.feedback.rating).toBe(3);
      expect(res.body.feedback.comment).toBe('Updated comment');
    });

    test('should allow updating only comment', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          comment: 'Final comment'
        });

      expect(res.status).toBe(200);
      expect(res.body.feedback.rating).toBe(3);
      expect(res.body.feedback.comment).toBe('Final comment');
    });

    test('should update timestamp on modification', async () => {
      const getRes = await request(app)
        .get(`/feedback?projectId=${projectId1}`);

      const originalUpdated = getRes.body.feedback.find(
        f => f._id.toString() === feedbackId1.toString()
      ).updated;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updateRes = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 2
        });

      expect(new Date(updateRes.body.feedback.updated) > new Date(originalUpdated)).toBe(true);
    });

    test('should prevent non-author from updating', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          rating: 1
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .send({
          rating: 5
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent feedback', async () => {
      const res = await request(app)
        .put('/feedback/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 5
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should validate rating on update', async () => {
      const res = await request(app)
        .put(`/feedback/${feedbackId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 5');
    });
  });

  // ===== DELETE /feedback/:id - Delete Feedback =====
  describe('DELETE /feedback/:id - Delete Feedback', () => {

    test('should allow author to delete feedback', async () => {
      // Create new project for this test to avoid conflicts
      const newProjectRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Delete Test Project'
        });

      const testProjectId = newProjectRes.body.project._id;

      // Create feedback to delete
      const createRes = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: testProjectId,
          rating: 2,
          comment: 'To be deleted'
        });

      const feedbackIdToDelete = createRes.body.feedback._id;

      // Verify it exists
      const getRes = await request(app)
        .get(`/feedback?projectId=${testProjectId}`);
      
      const found = getRes.body.feedback.find(f => f._id.toString() === feedbackIdToDelete.toString());
      expect(found).toBeDefined();

      // Delete it
      const deleteRes = await request(app)
        .delete(`/feedback/${feedbackIdToDelete}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('deleted');

      // Verify it's gone
      const getAfterDelete = await request(app)
        .get(`/feedback?projectId=${testProjectId}`);
      
      const notFound = getAfterDelete.body.feedback.find(
        f => f._id.toString() === feedbackIdToDelete.toString()
      );
      expect(notFound).toBeUndefined();
    });

    test('should prevent non-author from deleting', async () => {
      // Create new project for this test
      const newProjectRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Delete Prevention Test Project'
        });

      const testProjectId = newProjectRes.body.project._id;

      // Create feedback as token1
      const createRes = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: testProjectId,
          rating: 5,
          comment: 'Should not be deleted'
        });

      const feedbackId = createRes.body.feedback._id;

      // Try to delete as token2 (different user)
      const res = await request(app)
        .delete(`/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');

      // Verify it still exists
      const getRes = await request(app)
        .get(`/feedback?projectId=${testProjectId}`);
      
      const found = getRes.body.feedback.find(f => f._id.toString() === feedbackId.toString());
      expect(found).toBeDefined();
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/feedback/${feedbackId1}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent feedback', async () => {
      const res = await request(app)
        .delete('/feedback/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== Edge Cases & Validation =====
  describe('Feedback Validation & Edge Cases', () => {

    test('should accept long comments', async () => {
      const newUser = await request(app)
        .post('/auth/signup')
        .send({
          displayName: 'Long Comment User',
          email: 'longcomment@test.com',
          password: 'password123'
        });

      const longComment = 'A'.repeat(1000);

      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${newUser.body.token}`)
        .send({
          projectId: projectId2,
          rating: 4,
          comment: longComment
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.comment).toHaveLength(1000);
    });

    test('should accept special characters in comment', async () => {
      const newUser = await request(app)
        .post('/auth/signup')
        .send({
          displayName: 'Special Char User',
          email: 'specialchar@test.com',
          password: 'password123'
        });

      const specialComment = 'Great work! 🎉 #amazing @project $100';

      const res = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${newUser.body.token}`)
        .send({
          projectId: projectId2,
          rating: 5,
          comment: specialComment
        });

      expect(res.status).toBe(201);
      expect(res.body.feedback.comment).toBe(specialComment);
    });

    test('should not modify created timestamp on update', async () => {
      const createRes = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${token3}`)
        .send({
          projectId: projectId2,
          rating: 3,
          comment: 'Original'
        });

      const feedbackId = createRes.body.feedback._id;
      const originalCreated = createRes.body.feedback.created;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updateRes = await request(app)
        .put(`/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token3}`)
        .send({
          rating: 4
        });

      expect(updateRes.body.feedback.created).toBe(originalCreated);
    });

    test('should handle boundary rating values', async () => {
      const testUser = await request(app)
        .post('/auth/signup')
        .send({
          displayName: 'Boundary Test User',
          email: 'boundarytest@test.com',
          password: 'password123'
        });

      // Test rating 1
      const res1 = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${testUser.body.token}`)
        .send({
          projectId: projectId1,
          rating: 1
        });

      expect(res1.status).toBe(201);
      expect(res1.body.feedback.rating).toBe(1);

      // Test rating 5
      const newUser2 = await request(app)
        .post('/auth/signup')
        .send({
          displayName: 'Another Boundary User',
          email: 'boundary2@test.com',
          password: 'password123'
        });

      const res5 = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${newUser2.body.token}`)
        .send({
          projectId: projectId2,
          rating: 5
        });

      expect(res5.status).toBe(201);
      expect(res5.body.feedback.rating).toBe(5);
    });

    test('should enforce unique compound index on [projectId, authorId]', async () => {
      const uniqueTestUser = await request(app)
        .post('/auth/signup')
        .send({
          displayName: 'Unique Test User',
          email: 'uniquetest@test.com',
          password: 'password123'
        });

      const newProject = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Unique Test Project'
        });

      const newProjectId = newProject.body.project._id;

      // First feedback succeeds
      const res1 = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${uniqueTestUser.body.token}`)
        .send({
          projectId: newProjectId,
          rating: 3
        });

      expect(res1.status).toBe(201);

      // Duplicate feedback fails
      const res2 = await request(app)
        .post('/feedback')
        .set('Authorization', `Bearer ${uniqueTestUser.body.token}`)
        .send({
          projectId: newProjectId,
          rating: 4
        });

      expect(res2.status).toBe(409);
      expect(res2.body.message).toContain('already provided feedback');
    });
  });
});
