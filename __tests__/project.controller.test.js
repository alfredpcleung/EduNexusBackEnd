const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const configDb = require('../Config/db.js');

// Import routers and models
const authRouter = require('../App/Routers/auth');
const userRouter = require('../App/Routers/user');
const projectRouter = require('../App/Routers/project');
const User = require('../App/Models/user');
const Project = require('../App/Models/project');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/projects', projectRouter);

// Test data
let token1, token2, user1Uid, user2Uid, projectId1, projectId2;

describe('Project Controller Tests', () => {
  
  beforeAll(async () => {
    // Connect to database
    configDb();
    
    // Clear collections
    await User.deleteMany({});
    await Project.deleteMany({});

    // Create test users
    const signup1 = await request(app)
      .post('/auth/signup')
      .send({
        displayName: 'Project Owner 1',
        email: 'projectowner1@test.com',
        password: 'password123'
      });

    token1 = signup1.body.data.token;
    user1Uid = signup1.body.data.user.uid;

    const signup2 = await request(app)
      .post('/auth/signup')
      .send({
        displayName: 'Project Owner 2',
        email: 'projectowner2@test.com',
        password: 'password456'
      });

    token2 = signup2.body.data.token;
    user2Uid = signup2.body.data.user.uid;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Project.deleteMany({});
    await mongoose.connection.close();
  });

  // ===== POST /projects - Create Project =====
  describe('POST /projects - Create Project', () => {

    test('should create a project with valid body', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Web Development Portfolio',
          description: 'Build a personal portfolio website',
          tags: ['frontend', 'react', 'css'],
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Web Development Portfolio');
      expect(res.body.data.description).toBe('Build a personal portfolio website');
      expect(res.body.data.owner).toBe(user1Uid);
      expect(res.body.data.tags).toEqual(['frontend', 'react', 'css']);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.created).toBeDefined();
      expect(res.body.data.updated).toBeDefined();

      projectId1 = res.body.data._id;
    });

    test('should set owner to authenticated user uid', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Machine Learning Project',
          description: 'Implement ML algorithms',
          status: 'draft'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.owner).toBe(user2Uid);
      expect(res.body.data.owner).not.toBe(user1Uid);

      projectId2 = res.body.data._id;
    });

    test('should default tags to empty array if not provided', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Simple Project',
          description: 'No tags'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags.length).toBe(0);
    });

    test('should default status to active if not provided', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Default Status Project'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post('/projects')
        .send({
          title: 'Unauthorized Project',
          description: 'Should fail'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should fail without title', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Missing title'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    test('should fail with invalid status enum value', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Invalid Status Project',
          status: 'invalid_status'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('should accept optional courseId', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Course Project',
          courseId: 'course123',
          description: 'Project for specific course'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courseId).toBe('course123');
    });
  });

  // ===== GET /projects - List Projects =====
  describe('GET /projects - List Projects', () => {

    test('should return all projects as array', async () => {
      const res = await request(app)
        .get('/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.count).toBeGreaterThan(0);
    });

    test('should include created project in list', async () => {
      const res = await request(app)
        .get('/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const foundProject = res.body.data.find(p => p._id.toString() === projectId1.toString());
      expect(foundProject).toBeDefined();
      expect(foundProject.title).toBe('Web Development Portfolio');
      expect(foundProject.owner).toBe(user1Uid);
    });

    test('should filter projects by owner', async () => {
      const res = await request(app)
        .get(`/projects?owner=${user1Uid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      res.body.data.forEach(project => {
        expect(project.owner).toBe(user1Uid);
      });
    });

    test('should filter projects by status', async () => {
      const res = await request(app)
        .get('/projects?status=active');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      res.body.data.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    test('should filter projects by courseId', async () => {
      const res = await request(app)
        .get('/projects?courseId=course123');

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
        .get('/projects?status=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    test('should combine multiple filters', async () => {
      const res = await request(app)
        .get(`/projects?owner=${user1Uid}&status=active`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      res.body.data.forEach(project => {
        expect(project.owner).toBe(user1Uid);
        expect(project.status).toBe('active');
      });
    });
  });

  // ===== GET /projects/:id - Get Single Project =====
  describe('GET /projects/:id - Get Single Project', () => {

    test('should return correct project by id', async () => {
      const res = await request(app)
        .get(`/projects/${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id.toString()).toBe(projectId1.toString());
      expect(res.body.data.title).toBe('Web Development Portfolio');
      expect(res.body.data.owner).toBe(user1Uid);
    });

    test('should return project with all fields', async () => {
      const res = await request(app)
        .get(`/projects/${projectId1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const project = res.body.data;
      
      expect(project).toHaveProperty('_id');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('owner');
      expect(project).toHaveProperty('tags');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('created');
      expect(project).toHaveProperty('updated');
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/projects/507f1f77bcf86cd799439011');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    test('should return different projects correctly', async () => {
      const res1 = await request(app)
        .get(`/projects/${projectId1}`);

      const res2 = await request(app)
        .get(`/projects/${projectId2}`);

      expect(res1.body.data._id.toString()).toBe(projectId1.toString());
      expect(res2.body.data._id.toString()).toBe(projectId2.toString());
      expect(res1.body.data.owner).toBe(user1Uid);
      expect(res2.body.data.owner).toBe(user2Uid);
    });
  });

  // ===== PUT /projects/:id - Update Project =====
  describe('PUT /projects/:id - Update Project', () => {

    test('should allow owner to update project', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated Portfolio Project',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Portfolio Project');
      expect(res.body.data.description).toBe('Updated description');
    });

    test('should update individual fields', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          status: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
      // Verify other fields unchanged
      expect(res.body.data.title).toBe('Updated Portfolio Project');
    });

    test('should update tags', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          tags: ['javascript', 'node.js']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tags).toEqual(['javascript', 'node.js']);
    });

    test('should update timestamp on modification', async () => {
      const getRes = await request(app)
        .get(`/projects/${projectId1}`);

      const originalUpdated = getRes.body.data.updated;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateRes = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Another Update'
        });

      expect(new Date(updateRes.body.data.updated) > new Date(originalUpdated)).toBe(true);
    });

    test('should prevent non-owner from updating', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Hacked Title'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .put('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should allow only valid status values', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          status: 'draft'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('draft');
    });

    test('should not allow owner field to be updated', async () => {
      const res = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          owner: user2Uid
        });

      // Owner should remain unchanged
      expect(res.status).toBe(200);
      expect(res.body.data.owner).toBe(user1Uid);
    });
  });

  // ===== DELETE /projects/:id - Delete Project =====
  describe('DELETE /projects/:id - Delete Project', () => {

    test('should allow owner to delete project', async () => {
      // Create a project to delete
      const createRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Project to Delete',
          description: 'Will be deleted'
        });

      const projectIdToDelete = createRes.body.data._id;

      // Verify it exists
      const getRes = await request(app)
        .get(`/projects/${projectIdToDelete}`);
      expect(getRes.status).toBe(200);

      // Delete it
      const deleteRes = await request(app)
        .delete(`/projects/${projectIdToDelete}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.message).toContain('deleted');

      // Verify it's gone
      const getAfterDelete = await request(app)
        .get(`/projects/${projectIdToDelete}`);
      expect(getAfterDelete.status).toBe(404);
    });

    test('should prevent non-owner from deleting', async () => {
      const res = await request(app)
        .delete(`/projects/${projectId2}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');

      // Verify it still exists
      const getRes = await request(app)
        .get(`/projects/${projectId2}`);
      expect(getRes.status).toBe(200);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/projects/${projectId2}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .delete('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== Edge Cases & Validation =====
  describe('Project Validation & Edge Cases', () => {

    test('should trim whitespace from title', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: '  Trimmed Title  ',
          description: 'Test trimming'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Trimmed Title');
    });

    test('should accept empty description', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'No Description Project',
          description: ''
        });

      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('');
    });

    test('should accept special characters in title', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Project #2: Build "Amazing" App (v1.0)',
          description: 'Special chars test'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toContain('#');
      expect(res.body.data.title).toContain('"');
    });

    test('should not modify created timestamp on update', async () => {
      const getRes = await request(app)
        .get(`/projects/${projectId1}`);

      const originalCreated = getRes.body.data.created;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updateRes = await request(app)
        .put(`/projects/${projectId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Modified'
        });

      expect(updateRes.body.data.created).toBe(originalCreated);
    });

    test('should accept tags as array', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Tags Array Project',
          tags: ['tag1', 'tag2', 'tag3']
        });

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should handle all valid status values', async () => {
      const validStatuses = ['active', 'archived', 'draft'];

      for (const status of validStatuses) {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            title: `Project Status ${status}`,
            status: status
          });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(status);
      }
    });
  });
});
