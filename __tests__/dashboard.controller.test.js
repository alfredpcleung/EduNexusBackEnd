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
const Review = require('../app/Models/review');

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
let token1, token2, user1Uid, user2Uid;
let courseId1, courseId2, projectId1, projectId2, feedbackId1;

describe.skip('Dashboard Controller Tests', () => {
  
  beforeAll(async () => {
    // Connect to database
    configDb();
    
    // Clear collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});
    await Review.deleteMany({});

    // Create test user 1
    const signup1 = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Dashboard',
        lastName: 'User1',
        email: 'dashboarduser1@test.com',
        password: 'password123',
        school: 'Test University',
        fieldOfStudy: 'Computer Science'
      });

    token1 = signup1.body.data.token;
    user1Uid = signup1.body.data.user.uid;

    // Create test user 2
    const signup2 = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Dashboard',
        lastName: 'User2',
        email: 'dashboarduser2@test.com',
        password: 'password456',
        school: 'Test University',
        fieldOfStudy: 'Business'
      });

    token2 = signup2.body.data.token;
    user2Uid = signup2.body.data.user.uid;

    // Create 2 courses (catalog entries, no owner)
    const course1Res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        school: 'Test University',
        courseSubject: 'WEB',
        courseNumber: '101',
        title: 'Web Development 101',
        description: 'Learn web dev',
        credits: 4
      });

    courseId1 = course1Res.body.data._id;

    const course2Res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        school: 'Test University',
        courseSubject: 'DATA',
        courseNumber: '100',
        title: 'Data Science Basics',
        description: 'Intro to DS',
        credits: 4
      });

    courseId2 = course2Res.body.data._id;

    // Add transcript entries for user1
    await User.findOneAndUpdate(
      { uid: user1Uid },
      {
        $push: {
          academicRecords: {
            $each: [
              {
                term: 'Fall',
                year: 2024,
                subject: 'WEB',
                courseCode: '101',
                courseTitle: 'Web Development 101',
                creditHours: 4,
                grade: 'A'
              },
              {
                term: 'Fall',
                year: 2024,
                subject: 'DATA',
                courseCode: '100',
                courseTitle: 'Data Science Basics',
                creditHours: 4,
                grade: 'B+'
              }
            ]
          }
        }
      }
    );

    // User 1: Create 2 projects
    const project1Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Personal Portfolio Site',
        description: 'Build portfolio',
        courseId: courseId1,
        tags: ['frontend', 'react']
      });

    projectId1 = project1Res.body.data._id;

    const project2Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Data Analysis Project',
        description: 'Analyze dataset',
        courseId: courseId2,
        tags: ['python', 'pandas']
      });

    projectId2 = project2Res.body.data._id;

    // User 2: Create project for user1 to feedback on
    const project3Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        title: 'User 2 Project',
        description: 'Another project'
      });

    const projectId3 = project3Res.body.data._id;

    // User 1: Provide feedback on User 2's project
    const feedbackRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        projectId: projectId3,
        rating: 4,
        comment: 'Great work!'
      });

    feedbackId1 = feedbackRes.body.data._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Course.deleteMany({});
    await Project.deleteMany({});
    await Feedback.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  // ===== GET /dashboard/me - User Dashboard =====
  describe('GET /dashboard/me - User Dashboard', () => {

    test('should return dashboard for authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard).toBeDefined();
    });

    test('should return user information', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const user = res.body.dashboard.user;

      expect(user.uid).toBe(user1Uid);
      expect(user.firstName).toBe('Dashboard');
      expect(user.lastName).toBe('User1');
      expect(user.email).toBe('dashboarduser1@test.com');
      expect(user.role).toBeDefined();
      expect(user.schoolName).toBe('Test University');
      expect(user.programName).toBe('Computer Science');
    });

    test('should return enrolled courses from transcript', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const courses = res.body.dashboard.courses;

      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.length).toBe(2); // User1 has 2 transcript entries
    });

    test('should return enrolled course details with transcript info', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      // ...existing code...

      if (courses.length > 0) {
        const course = courses[0];
        expect(course).toHaveProperty('_id');
        expect(course).toHaveProperty('title');
        expect(course).toHaveProperty('term');
        expect(course).toHaveProperty('year');
        expect(course).toHaveProperty('grade');
      }
    });

    test('should return user reviews section', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const userReviews = res.body.dashboard.userReviews;

      expect(userReviews).toBeDefined();
      expect(typeof userReviews.count).toBe('number');
      expect(Array.isArray(userReviews.reviews)).toBe(true);
    });

    test('should return owned projects with correct count', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const ownedProjects = res.body.dashboard.ownedProjects;

      expect(ownedProjects.count).toBe(2);
      expect(Array.isArray(ownedProjects.projects)).toBe(true);
      expect(ownedProjects.projects.length).toBe(2);
    });

    test('should return correct project details', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const projects = res.body.dashboard.ownedProjects.projects;

      const foundProject = projects.find(p => p._id.toString() === projectId1.toString());
      expect(foundProject).toBeDefined();
      expect(foundProject.title).toBe('Personal Portfolio Site');
      expect(foundProject.description).toBe('Build portfolio');
    });

    test('should only return user-owned projects', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      const ownedProjects = res.body.dashboard.ownedProjects;

      expect(ownedProjects.count).toBe(1);
      expect(ownedProjects.projects.length).toBe(1);
      expect(ownedProjects.projects[0].title).toBe('User 2 Project');
    });

    test('should return authored feedback with correct count', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const authoredFeedback = res.body.dashboard.authoredFeedback;

      expect(authoredFeedback.count).toBe(1);
      expect(Array.isArray(authoredFeedback.feedback)).toBe(true);
      expect(authoredFeedback.feedback.length).toBe(1);
    });

    test('should return correct feedback details', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const feedback = res.body.dashboard.authoredFeedback.feedback[0];

      expect(feedback.rating).toBe(4);
      expect(feedback.comment).toBe('Great work!');
    });

    test('should return complete dashboard structure', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const dashboard = res.body.dashboard;

      expect(dashboard).toHaveProperty('user');
      expect(dashboard).toHaveProperty('courses');
      expect(dashboard).toHaveProperty('userReviews');
      expect(dashboard).toHaveProperty('ownedProjects');
      expect(dashboard).toHaveProperty('authoredFeedback');
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ===== Edge Cases =====
  describe('Dashboard - Edge Cases', () => {

    test('should handle user with no transcript entries', async () => {
      const newUser = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'No',
          lastName: 'Courses',
          email: 'nocourses@test.com',
          password: 'password123',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${newUser.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.dashboard.courses.length).toBe(0);
      expect(res.body.dashboard.courses).toEqual([]);
    });

    test('should handle user with no projects', async () => {
      const newUser = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'No',
          lastName: 'Projects',
          email: 'noprojects@test.com',
          password: 'password123',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${newUser.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.dashboard.ownedProjects.count).toBe(0);
      expect(res.body.dashboard.ownedProjects.projects).toEqual([]);
    });

    test('should handle user with no feedback', async () => {
      const newUser = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'No',
          lastName: 'Feedback',
          email: 'nofeedback@test.com',
          password: 'password123',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${newUser.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.dashboard.authoredFeedback.count).toBe(0);
      expect(res.body.dashboard.authoredFeedback.feedback).toEqual([]);
    });

    test('should handle user with all empty categories', async () => {
      const newUser = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Empty',
          lastName: 'Dashboard',
          email: 'emptydash@test.com',
          password: 'password123',
          schoolName: 'Test University',
          programName: 'Computer Science'
        });

      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${newUser.body.data.token}`);

      expect(res.status).toBe(200);
      const dashboard = res.body.dashboard;

      expect(dashboard.courses.length).toBe(0);
      expect(dashboard.userReviews.count).toBe(0);
      expect(dashboard.ownedProjects.count).toBe(0);
      expect(dashboard.authoredFeedback.count).toBe(0);
      expect(dashboard.user.uid).toBe(newUser.body.data.user.uid);
    });
  });
});
