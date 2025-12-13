const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const configDb = require('../config/db.js');

// Import routers and models
const authRouter = require('../app/Routers/auth');
const userRouter = require('../app/Routers/user');
const courseRouter = require('../app/Routers/course');
const projectRouter = require('../app/Routers/project');
const feedbackRouter = require('../app/Routers/feedback');
const dashboardRouter = require('../app/Routers/dashboard');
const User = require('../app/Models/user');
const Course = require('../app/Models/course');
const Project = require('../app/Models/project');
const Feedback = require('../app/Models/feedback');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/projects', projectRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/dashboard', dashboardRouter);

// Test data
let token1, token2, user1Uid, user2Uid, courseId, projectId, feedbackId;

describe('Tier 1: Projects & Feedback - Integration Tests', () => {
  
  beforeAll(async () => {
    // Connect to database
    configDb();
    // Clear collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Course.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});
    await mongoose.connection.close();
  });

  // ===== SETUP: Create users and course =====
  describe('Setup: User Registration & Course Creation', () => {
    
    test('Should signup user 1', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Alice',
          lastName: 'TestUser',
          email: 'alice@example.com',
          password: 'password123',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.uid).toBeDefined();

      token1 = res.body.data.token;
      user1Uid = res.body.data.user.uid;
    });

    test('Should signup user 2', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Bob',
          lastName: 'TestUser',
          email: 'bob@example.com',
          password: 'password456',
          schoolName: 'Test University',
          programName: 'Business'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      token2 = res.body.data.token;
      user2Uid = res.body.data.user.uid;
    });

    test('Should create course owned by user 1', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          institution: 'Test University',
          courseSubject: 'WEB',
          courseNumber: '101',
          title: 'Web Development 101',
          description: 'Learn web dev',
          credits: 4
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();

      courseId = res.body.data._id;
    });
  });

  // ===== PROJECT TESTS =====
  describe('Projects - CRUD Operations', () => {

    test('Should create project (authenticated)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Portfolio Project',
          description: 'Build a portfolio',
          courseId: courseId,
          tags: ['frontend', 'react'],
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Portfolio Project');
      expect(res.body.data.owner).toBe(user1Uid);
      expect(res.body.data.status).toBe('active');

      projectId = res.body.data._id;
    });

    test('Should fail to create project without authentication', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Another Project',
          description: 'Test',
          courseId: courseId
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to create project without title', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          courseId: courseId
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    test('Should get all projects', async () => {
      const res = await request(app)
        .get('/api/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Should filter projects by courseId', async () => {
      const res = await request(app)
        .get(`/api/projects?courseId=${courseId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0].courseId).toBe(courseId);
      }
    });

    test('Should filter projects by owner', async () => {
      const res = await request(app)
        .get(`/api/projects?owner=${user1Uid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].owner).toBe(user1Uid);
    });

    test('Should get single project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(projectId.toString());
    });

    test('Should fail to get non-existent project', async () => {
      const res = await request(app)
        .get(`/api/projects/507f1f77bcf86cd799439011`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('Should update project as owner', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated Portfolio Project',
          status: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Portfolio Project');
      expect(res.body.data.status).toBe('archived');
    });

    test('Should fail to update project as non-owner', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Hacked Title'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');
    });

    test('Should fail to update project without authentication', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .send({
          title: 'Hacked Title'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to delete project as non-owner', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== FEEDBACK TESTS =====
  describe('Feedback - CRUD Operations', () => {

    test('Should create feedback (authenticated)', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          projectId: projectId,
          rating: 4,
          comment: 'Great project!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Great project!');
      expect(res.body.data.authorId).toBe(user2Uid);

      feedbackId = res.body.data._id;
    });

    test('Should fail to create feedback without authentication', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({
          projectId: projectId,
          rating: 5
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to create feedback without projectId', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('projectId');
    });

    test('Should fail to create feedback with invalid rating', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: projectId,
          rating: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 5');
    });

    test('Should prevent duplicate feedback from same author', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          projectId: projectId,
          rating: 5
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already provided feedback');
    });

    test('Should get feedback for project', async () => {
      const res = await request(app)
        .get(`/api/feedback?projectId=${projectId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Should require projectId query parameter', async () => {
      const res = await request(app)
        .get('/api/feedback');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Should filter feedback by authorId', async () => {
      const res = await request(app)
        .get(`/api/feedback?projectId=${projectId}&authorId=${user2Uid}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].authorId).toBe(user2Uid);
    });

    test('Should update feedback as author', async () => {
      const res = await request(app)
        .put(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          rating: 5,
          comment: 'Even better!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Even better!');
    });

    test('Should fail to update feedback as non-author', async () => {
      const res = await request(app)
        .put(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          rating: 1
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');
    });

    test('Should fail to update feedback without authentication', async () => {
      const res = await request(app)
        .put(`/api/feedback/${feedbackId}`)
        .send({
          rating: 1
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail to delete feedback as non-author', async () => {
      const res = await request(app)
        .delete(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Should delete feedback as author', async () => {
      const res = await request(app)
        .delete(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ===== DASHBOARD TESTS =====
  describe('Dashboard - User Aggregation', () => {

    test('Should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should get dashboard for user 1 (course owner + project owner)', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard).toBeDefined();
      expect(res.body.dashboard.user.uid).toBe(user1Uid);
      expect(res.body.dashboard.user.firstName).toBe('Alice');
      expect(res.body.dashboard.user.lastName).toBe('TestUser');
      expect(res.body.dashboard.ownedProjects.count).toBeGreaterThan(0);
      expect(res.body.dashboard.ownedProjects.projects[0]._id.toString()).toBe(projectId.toString());
    });

    test('Should get dashboard for user 2 (feedback author)', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard.user.uid).toBe(user2Uid);
      expect(res.body.dashboard.user.firstName).toBe('Bob');
      expect(res.body.dashboard.user.lastName).toBe('TestUser');
      expect(res.body.dashboard.enrolledCourses.count).toBe(0);
      expect(res.body.dashboard.ownedProjects.count).toBe(0);
    });

    test('Dashboard should include all user fields', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      const user = res.body.dashboard.user;
      expect(user).toHaveProperty('uid');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('created');
      expect(user).toHaveProperty('updated');
    });

    test('Dashboard should have correct structure', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      const dashboard = res.body.dashboard;
      expect(dashboard).toHaveProperty('user');
      expect(dashboard).toHaveProperty('enrolledCourses');
      expect(dashboard).toHaveProperty('userReviews');
      expect(dashboard).toHaveProperty('ownedProjects');
      expect(dashboard).toHaveProperty('authoredFeedback');
      expect(dashboard.enrolledCourses).toHaveProperty('count');
      expect(dashboard.enrolledCourses).toHaveProperty('courses');
      expect(dashboard.userReviews).toHaveProperty('count');
      expect(dashboard.userReviews).toHaveProperty('reviews');
      expect(dashboard.ownedProjects).toHaveProperty('count');
      expect(dashboard.ownedProjects).toHaveProperty('projects');
      expect(dashboard.authoredFeedback).toHaveProperty('count');
      expect(dashboard.authoredFeedback).toHaveProperty('feedback');
    });
  });

  // ===== OWNERSHIP & AUTHORIZATION TESTS =====
  describe('Ownership & Authorization', () => {

    test('Project owner can update their project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Non-owner cannot update project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'draft' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Project owner can delete their project', async () => {
      // Create a new project to delete
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'To Delete',
          description: 'Test deletion'
        });

      const deleteRes = await request(app)
        .delete(`/api/projects/${createRes.body.data._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    test('Non-owner cannot delete project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== EDGE CASES & VALIDATION =====
  describe('Edge Cases & Validation', () => {

    test('Should handle project status enum values', async () => {
      const validStatuses = ['active', 'archived', 'draft'];

      for (const status of validStatuses) {
        const res = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            title: `Project ${status}`,
            status: status
          });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(status);
      }
    });

    test('Should maintain feedback rating constraints (1-5)', async () => {
      // Create a new project for clean test
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Rating Test Project'
        });

      const newProjectId = projectRes.body.data._id;

      // Test boundary values - each with different user
      const validRatings = [1, 2, 3, 4, 5];

      for (let i = 0; i < validRatings.length; i++) {
        const rating = validRatings[i];
        // Create a new user for each feedback to avoid duplicate constraint
        const newUserRes = await request(app)
          .post('/api/auth/signup')
          .send({
            firstName: `RatingTest${i}`,
            lastName: 'User',
            email: `ratingtest${i}@example.com`,
            password: 'password123',
            schoolName: 'Test University',
            programName: 'Computer Science'
          });

        const userToken = newUserRes.body.data.token;

        const res = await request(app)
          .post('/api/feedback')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            projectId: newProjectId,
            rating: rating
          });

        expect(res.status).toBe(201);
      }
    });

    test('Should enforce unique compound index on feedback', async () => {
      // Create new project
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Unique Feedback Test'
        });

      const newProjectId = projectRes.body.data._id;

      // First feedback should succeed
      const res1 = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: newProjectId,
          rating: 3
        });

      expect(res1.status).toBe(201);

      // Duplicate feedback should fail
      const res2 = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectId: newProjectId,
          rating: 4
        });

      expect(res2.status).toBe(409);
    });

    test('Should return 404 for non-existent feedback', async () => {
      const res = await request(app)
        .get('/api/feedback?projectId=507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
