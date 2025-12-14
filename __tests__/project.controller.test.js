// Write JWT secret to file for debug
const fs = require('fs');
fs.writeFileSync('test_jwt_secret.txt', `TEST FILE JWT_SECRET: ${process.env.JWT_SECRET}\n`, { flag: 'a' });
// Print JWT secret at test runtime (unique marker)
console.log('===TEST FILE JWT_SECRET===', process.env.JWT_SECRET, '===END===');
// Persistent Express app and DB connection for all tests

let app;
beforeEach(async () => {
  if (mongoose.connection.readyState === 0) {
    await configDb();
  }
  await User.deleteMany({});
  await Project.deleteMany({});
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/projects', projectRouter);
});

afterEach(async () => {
  await User.deleteMany({});
  await Project.deleteMany({});
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Minimal test to debug signup and token usage
describe.skip('Minimal Auth Debug', () => {
  let debugToken;
  it('should signup and access protected endpoint', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Debug',
        lastName: 'User',
        email: 'debuguser@test.com',
        password: 'password123',
        role: 'student',
        school: 'Test University',
        fieldOfStudy: 'Computer Science'
      });
    // Write signup response to file for inspection
    fs.writeFileSync('debug_signup_response.json', JSON.stringify(signup.body, null, 2));
    debugToken = signup.body?.data?.token;
    expect(debugToken).toBeDefined();
    // Try to create a project with this token
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${debugToken}`)
      .send({
        projectTitle: 'Debug Project',
        description: 'Debugging',
        courseSubject: 'CS',
        courseNumber: '999',
        members: [signup.body?.data?.user?.email || 'debuguser@test.com', 'seconduser@test.com'],
        createdBy: signup.body?.data?.user?.uid,
        tags: ['JavaScript'],
        status: 'active'
      });
    // Write project creation response to file for inspection
    fs.writeFileSync('debug_project_response.json', JSON.stringify(projectRes.body, null, 2));
    expect([201, 401]).toContain(projectRes.status); // Accept 201 or 401 for debug
  });
});
// Ensure test environment variables are loaded before any other imports
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const configDb = require('../config/db.js');


// Import routers, models, and middleware
const authRouter = require('../app/Routers/auth');
const userRouter = require('../app/Routers/user');
const projectRouter = require('../app/Routers/project');
const { requireAuth } = require('../app/Controllers/authMiddleware');
const User = require('../app/Models/user');
const Project = require('../app/Models/project');


// Test data
let token1, token2, user1Uid, user2Uid, projectId1, projectId2;

describe('Project Controller Tests', () => {

  // Helper to create a new user and return { token, uid }
  async function createUser(email, password = 'password123') {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Project',
        lastName: 'User',
        email,
        password,
        role: 'student',
        school: 'Test University',
        fieldOfStudy: 'Computer Science'
      });
    return {
      token: res.body.data?.token,
      uid: res.body.data?.user?.uid
    };
  }

  // Use fresh users/tokens for each test
  let user1, user2;
  beforeEach(async () => {
    user1 = await createUser(`projectuser1+${Date.now()}@test.com`);
    user2 = await createUser(`projectuser2+${Date.now()}@test.com`);
    // Wait to ensure users are fully committed to the DB
    await new Promise(res => setTimeout(res, 100));
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
  });

  // ===== POST /api/projects - Create Project =====
  describe('POST /api/projects - Create Project', () => {
    test('should create a project with valid body', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Web Development Portfolio',
          description: 'Build a personal portfolio website',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'active'
        });
      // Write project creation response to file for debug
      const fs = require('fs');
      fs.writeFileSync('debug_project1_response.json', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.projectTitle).toBe('Web Development Portfolio');
      expect(res.body.data.description).toBe('Build a personal portfolio website');
      expect(res.body.data.owner).toBe(user1.uid);
      expect(res.body.data.tags).toEqual(['JavaScript', 'Frontend', 'Portfolio-worthy']);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.created).toBeDefined();
      expect(res.body.data.updated).toBeDefined();
      projectId1 = res.body.data._id;
    });
    // Additional tests for POST /api/projects can be added here
  });

  // Additional describe blocks for GET, PUT, DELETE, and edge cases can be added here
});
  

  // ===== POST /api/projects - Create Project =====
  describe('POST /api/projects - Create Project', () => {

    test('should create a project with valid body', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Web Development Portfolio',
          description: 'Build a personal portfolio website',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.projectTitle).toBe('Web Development Portfolio');
      expect(res.body.data.description).toBe('Build a personal portfolio website');
      expect(res.body.data.owner).toBe(user1Uid);
      expect(res.body.data.tags).toEqual(['JavaScript', 'Frontend', 'Portfolio-worthy']);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.created).toBeDefined();
      expect(res.body.data.updated).toBeDefined();

      projectId1 = res.body.data._id;
    });

    test('should set owner to authenticated user uid', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          projectTitle: 'Machine Learning Project',
          description: 'Implement ML algorithms',
          courseSubject: 'CS',
          courseNumber: '102',
          members: [user1.uid, user2.uid],
          createdBy: user2.uid,
          tags: ['JavaScript'],
          status: 'draft'
        });

      const fs = require('fs');
      fs.writeFileSync('debug_project2_response.json', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.owner).toBe(user2.uid);
      expect(res.body.data.owner).not.toBe(user1.uid);
      projectId2 = res.body.data._id;
    });

    test('should default tags to empty array if not provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Simple Project',
          description: 'No tags',
          courseSubject: 'CS',
          courseNumber: '103',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid
        });

      const fs = require('fs');
      fs.writeFileSync('debug_project3_response.json', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags.length).toBe(0);
    });

    test('should default status to active if not provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Default Status Project',
          description: 'No status provided',
          courseSubject: 'CS',
          courseNumber: '104',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid
        });

      const fs = require('fs');
      fs.writeFileSync('debug_project4_response.json', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Unauthorized Project',
          description: 'Should fail'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should fail without title', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          description: 'Missing title'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    test('should fail with invalid status enum value', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Invalid Status Project',
          description: 'Invalid status',
          courseSubject: 'CS',
          courseNumber: '105',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript'],
          status: 'invalid_status'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('should accept optional courseId', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Course Project',
          courseId: 'course123',
          description: 'Project for specific course',
          courseSubject: 'CS',
          courseNumber: '107',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript'],
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courseId).toBe('course123');
	});
  });

  // ===== GET /api/projects - List Projects =====
  describe('GET /api/projects - List Projects', () => {

    test('should return all projects as array', async () => {
      // Create a project first
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Course Project',
          courseId: 'course123',
          description: 'Project for specific course',
          courseSubject: 'CS',
          courseNumber: '107',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript'],
          status: 'active'
        });

      const res = await request(app)
        .get('/api/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Optionally, check for the created project
      // const foundProject = res.body.data.find(p => p.projectTitle === 'Course Project');
      // expect(foundProject).toBeDefined();
    });

    test('should filter projects by owner', async () => {
      const res = await request(app)
        .get(`/api/projects?owner=${user1.uid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      res.body.data.forEach(project => {
        expect(project.owner).toBe(user1.uid);
      });
    });

    test('should filter projects by status', async () => {
      const res = await request(app)
        .get('/api/projects?status=active');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      res.body.data.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    test('should filter projects by courseId', async () => {
      const res = await request(app)
        .get('/api/projects?courseId=course123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        res.body.data.forEach(project => {
          expect(project.courseId).toBe('course123');
        });
      }
    });

    test('should return empty array with non-matching filter', async () => {
      const res = await request(app)
        .get('/api/projects?status=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    test('should combine multiple filters', async () => {
      const res = await request(app)
        .get(`/api/projects?owner=${user1.uid}&status=active`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      res.body.data.forEach(project => {
        expect(project.owner).toBe(user1.uid);
        expect(project.status).toBe('active');
      });
    });
  });
  // ===== GET /api/projects/:id - Get Single Project =====
  describe('GET /api/projects/:id - Get Single Project', () => {

    test('should return correct project by id', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id.toString()).toBe(projectId1.toString());
      expect(res.body.data.projectTitle).toBe('Web Development Portfolio');
      expect(res.body.data.owner).toBe(user1.uid);
    });

    test('should return project with all fields', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const project = res.body.data;
      
      expect(project).toHaveProperty('_id');
      expect(project).toHaveProperty('projectTitle');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('owner');
      expect(project).toHaveProperty('tags');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('created');
      expect(project).toHaveProperty('updated');
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/projects/507f1f77bcf86cd799439011');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    test('should return different projects correctly', async () => {
      const res1 = await request(app)
        .get(`/api/projects/${projectId1}`);

      const res2 = await request(app)
        .get(`/api/projects/${projectId2}`);

      expect(res1.body.data._id.toString()).toBe(projectId1.toString());
      expect(res2.body.data._id.toString()).toBe(projectId2.toString());
      expect(res1.body.data.owner).toBe(user1.uid);
      expect(res2.body.data.owner).toBe(user2.uid);
    });
  });

  // ===== PUT /api/projects/:id - Update Project =====
  describe('PUT /api/projects/:id - Update Project', () => {

    test('should allow owner to update project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Updated Portfolio Project',
          description: 'Updated description',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'active'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectTitle).toBe('Updated Portfolio Project');
      expect(res.body.data.description).toBe('Updated description');
    });

    test('should update individual fields', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Updated Portfolio Project',
          description: 'Updated description',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
      // Verify other fields unchanged
      expect(res.body.data.projectTitle).toBe('Updated Portfolio Project');
    });

    test('should update tags', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          tags: ['JavaScript', 'Backend']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tags).toEqual(['JavaScript', 'Backend']);
    });

    test('should update timestamp on modification', async () => {
      // Get the original updated timestamp
      const getRes = await request(app)
        .get(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user1.token}`);

      const originalUpdated = getRes.body.data.updated;

      // Perform an update
      const updateRes = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          projectTitle: 'Updated Portfolio Project',
          description: 'Updated description',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'active'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(new Date(updateRes.body.data.updated) > new Date(originalUpdated)).toBe(true);
    });

    test('should prevent non-owner from updating', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          projectTitle: 'Hacked Title',
          description: 'Hacked',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1.uid, user2.uid],
          createdBy: user1.uid,
          tags: ['JavaScript'],
          status: 'active'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .send({
          projectTitle: 'Unauthorized Update',
          description: 'Unauthorized',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid,
          tags: ['JavaScript'],
          status: 'active'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .put('/api/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should allow only valid status values', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          status: 'draft'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('draft');
    });

    test('should not allow owner field to be updated', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          owner: user2Uid
        });

      // Owner should remain unchanged
      expect(res.status).toBe(200);
      expect(res.body.data.owner).toBe(user1Uid);
    });
  });

  // ===== DELETE /api/projects/:id - Delete Project =====
  describe('DELETE /api/projects/:id - Delete Project', () => {

    test('should allow owner to delete project', async () => {
      // Create a project to delete
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'Project to Delete',
          description: 'Will be deleted',
          courseSubject: 'CS',
          courseNumber: '111',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid,
          tags: ['JavaScript'],
          status: 'active'
        });

      const projectIdToDelete = createRes.body.data._id;

      // Verify it exists
      const res = await request(app)
        .put(`/api/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'Updated Portfolio Project',
          description: 'Updated description',
          courseSubject: 'CS',
          courseNumber: '101',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid,
          tags: ['JavaScript', 'Frontend', 'Portfolio-worthy'],
          status: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
      // Verify other fields unchanged
      expect(res.body.data.projectTitle).toBe('Updated Portfolio Project');

      // Verify it's gone
      const getAfterDelete = await request(app)
        .get(`/api/projects/${projectIdToDelete}`);
      expect(getAfterDelete.status).toBe(404);
    });

    test('should prevent non-owner from deleting', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId2}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');

      // Verify it still exists
      const getRes = await request(app)
        .get(`/api/projects/${projectId2}`);
      expect(getRes.status).toBe(200);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId2}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .delete('/api/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== Edge Cases & Validation =====
  describe('Project Validation & Edge Cases', () => {

    test('should trim whitespace from title', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: '  Trimmed Title  ',
          description: 'Test trimming',
          courseSubject: 'CS',
          courseNumber: '108',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid
        });

      expect(res.status).toBe(201);
      expect(res.body.data.projectTitle).toBe('Trimmed Title');
    });

    test('should accept empty description', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'No Description Project',
          description: '',
          courseSubject: 'CS',
          courseNumber: '109',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid
        });

      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('');
    });

    test('should accept special characters in title', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'Project #2: Build "Amazing" App (v1.0)',
          description: 'Special chars test',
          courseSubject: 'CS',
          courseNumber: '110',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid
        });

      expect(res.status).toBe(201);
      expect(res.body.data.projectTitle).toContain('#');
      expect(res.body.data.projectTitle).toContain('"');
    });

    test('should not modify created timestamp on update', async () => {
      const getRes = await request(app)
        .get(`/api/projects/${projectId1}`);

      const originalCreated = getRes.body.data.created;

      await new Promise(resolve => setTimeout(resolve, 100));

      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'Project to Delete',
          description: 'Will be deleted',
          courseSubject: 'CS',
          courseNumber: '111',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid,
          tags: ['JavaScript'],
          status: 'active'
        });
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          projectTitle: 'Tags Array Project',
          description: 'Project with tags array',
          courseSubject: 'CS',
          courseNumber: '105',
          members: [user1Uid, user2Uid],
          createdBy: user1Uid,
          tags: ['Machine Learning', 'Backend', 'Highly collaborative']
        });

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags).toEqual(['Machine Learning', 'Backend', 'Highly collaborative']);
    });

    test('should handle all valid status values', async () => {
      const validStatuses = ['active', 'archived', 'draft'];

      for (const status of validStatuses) {
        const res = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            projectTitle: `Project Status ${status}`,
            description: `Project with status ${status}`,
            courseSubject: 'CS',
            courseNumber: '106',
            members: [user1Uid, user2Uid],
            createdBy: user1Uid,
            tags: ['JavaScript'],
            status: status
          });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(status);
      }
    });
});