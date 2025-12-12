const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const CourseController = require('../App/Controllers/course');
const CourseModel = require('../App/Models/course');
const courseRouter = require('../App/Routers/course');

// Mock MongoDB connection
jest.mock('../Config/db.js', () => jest.fn());

describe('Course Controller', () => {
  let app;
  let courseId;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/courses', courseRouter);

    // Connect to test database
    const mongoUri = process.env.TEST_ATLAS_DB || 'mongodb://localhost:27017/ednexus_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await CourseModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await CourseModel.deleteMany({});
  });

  describe('POST /api/courses - Create Course', () => {
    it('should create a course with valid body', async () => {
      const validCourse = {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of web development',
        credits: 3,
        instructor: 'John Smith',
        tags: ['web', 'beginner'],
        status: 'active',
      };

      const res = await request(app)
        .post('/api/courses')
        .send(validCourse)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Introduction to Web Development');
      expect(res.body.data.instructor).toBe('John Smith');
      expect(Array.isArray(res.body.data.tags)).toBe(true);
    });

    it('should accept tags as comma-separated string', async () => {
      const course = {
        title: 'Advanced JavaScript',
        description: 'Master JavaScript concepts',
        credits: 4,
        instructor: 'Jane Doe',
        tags: 'javascript, advanced, programming',
        status: 'active',
      };

      const res = await request(app)
        .post('/api/courses')
        .send(course)
        .expect(201);

      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags).toContain('javascript');
      expect(res.body.data.tags).toContain('advanced');
      expect(res.body.data.tags).toContain('programming');
    });

    it('should accept tags as array', async () => {
      const course = {
        title: 'React Fundamentals',
        description: 'Learn React basics',
        credits: 3,
        instructor: 'Bob Johnson',
        tags: ['react', 'frontend', 'javascript'],
        status: 'active',
      };

      const res = await request(app)
        .post('/api/courses')
        .send(course)
        .expect(201);

      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags.length).toBe(3);
    });

    it('should default tags to empty array if not provided', async () => {
      const course = {
        title: 'Python Basics',
        description: 'Introduction to Python',
        credits: 3,
        instructor: 'Alice Brown',
        status: 'draft',
      };

      const res = await request(app)
        .post('/api/courses')
        .send(course)
        .expect(201);

      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags.length).toBe(0);
    });
  });

  describe('GET /api/courses - List Courses', () => {
    it('should return empty list when no courses exist', async () => {
      const res = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('should return all courses', async () => {
      const courses = [
        {
          title: 'Course 1',
          description: 'Description 1',
          instructor: 'Instructor 1',
          credits: 3,
        },
        {
          title: 'Course 2',
          description: 'Description 2',
          instructor: 'Instructor 2',
          credits: 4,
        },
      ];

      for (const course of courses) {
        await request(app).post('/api/courses').send(course);
      }

      const res = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/courses/:id - Get Course by ID', () => {
    it('should return course by id', async () => {
      const course = {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of web development',
        credits: 3,
        instructor: 'John Smith',
      };

      const createRes = await request(app)
        .post('/api/courses')
        .send(course);

      const createdCourse = await CourseModel.findOne({ title: 'Introduction to Web Development' });
      courseId = createdCourse._id;

      const res = await request(app)
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Introduction to Web Development');
      expect(res.body.data.instructor).toBe('John Smith');
    });

    it('should return null for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/courses/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/courses/:id - Update Course', () => {
    beforeEach(async () => {
      const course = {
        title: 'Original Title',
        description: 'Original description',
        credits: 3,
        instructor: 'Original Instructor',
        tags: ['original'],
        status: 'active',
      };

      const createRes = await request(app)
        .post('/api/courses')
        .send(course);

      const createdCourse = await CourseModel.findOne({ title: 'Original Title' });
      courseId = createdCourse._id;
    });

    it('should update course with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should update partial fields', async () => {
      const updateData = {
        credits: 4,
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.credits).toBe(4);
      expect(res.body.data.title).toBe('Original Title'); // Should remain unchanged
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Test' };

      const res = await request(app)
        .put(`/api/courses/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not Found');
    });

    it('should update status to valid enum value', async () => {
      const updateData = {
        status: 'archived',
      };

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
    });
  });

  describe('DELETE /api/courses/:id - Delete Course', () => {
    beforeEach(async () => {
      const course = {
        title: 'Course to Delete',
        description: 'This course will be deleted',
        credits: 3,
        instructor: 'Test Instructor',
      };

      const createRes = await request(app)
        .post('/api/courses')
        .send(course);

      const createdCourse = await CourseModel.findOne({ title: 'Course to Delete' });
      courseId = createdCourse._id;
    });

    it('should delete course successfully', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');

      // Verify course is deleted
      const deletedCourse = await CourseModel.findById(courseId);
      expect(deletedCourse).toBeNull();
    });

    it('should return error when deleting non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/courses/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
