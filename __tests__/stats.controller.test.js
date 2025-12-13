const statsController = require('../app/Controllers/stats');
const User = require('../app/Models/user');
const Course = require('../app/Models/course');
const Review = require('../app/Models/review');
const Project = require('../app/Models/project');
const Feedback = require('../app/Models/feedback');

jest.mock('../app/Models/user');
jest.mock('../app/Models/course');
jest.mock('../app/Models/review');
jest.mock('../app/Models/project');
jest.mock('../app/Models/feedback');

describe('Stats Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('registeredStudents', () => {
    it('should return count of students', async () => {
      User.countDocuments.mockResolvedValue(42);

      await statsController.registeredStudents(mockReq, mockRes, mockNext);

      expect(User.countDocuments).toHaveBeenCalledWith({ role: 'student' });
      expect(mockRes.json).toHaveBeenCalledWith({ count: 42 });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      User.countDocuments.mockRejectedValue(error);

      await statsController.registeredStudents(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('coursesWithReviews', () => {
    it('should return count of courses with reviews', async () => {
      Course.countDocuments.mockResolvedValue(15);

      await statsController.coursesWithReviews(mockReq, mockRes, mockNext);

      expect(Course.countDocuments).toHaveBeenCalledWith({ numReviews: { $gte: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith({ count: 15 });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      Course.countDocuments.mockRejectedValue(error);

      await statsController.coursesWithReviews(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('activeStudents', () => {
    it('should return count of active students', async () => {
      // Mock users who logged in recently
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { uid: 'user1' },
          { uid: 'user2' }
        ])
      });
      // Mock users who created content
      Review.distinct.mockResolvedValue(['user2', 'user3']);
      Project.distinct.mockResolvedValue(['user3', 'user4']);
      Feedback.distinct.mockResolvedValue(['user4', 'user5']);
      // Mock final count
      User.countDocuments.mockResolvedValue(5);

      await statsController.activeStudents(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ count: 5 });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      User.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(error)
      });

      await statsController.activeStudents(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('projectsRecruiting', () => {
    it('should return count of recruiting projects', async () => {
      Project.countDocuments.mockResolvedValue(15);

      await statsController.projectsRecruiting(mockReq, mockRes, mockNext);

      expect(Project.countDocuments).toHaveBeenCalledWith({
        status: 'active',
        recruiting: true
      });
      expect(mockRes.json).toHaveBeenCalledWith({ count: 15 });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      Project.countDocuments.mockRejectedValue(error);

      await statsController.projectsRecruiting(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('all', () => {
    it('should return all stats combined', async () => {
      User.countDocuments
        .mockResolvedValueOnce(100) // registered students
        .mockResolvedValueOnce(5);  // active students count
      Course.countDocuments.mockResolvedValue(20);
      Project.countDocuments.mockResolvedValue(10);
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ uid: 'user1' }])
      });
      Review.distinct.mockResolvedValue(['user2']);
      Project.distinct.mockResolvedValue(['user3']);
      Feedback.distinct.mockResolvedValue(['user4']);

      await statsController.all(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        registeredStudents: 100,
        coursesWithReviews: 20,
        activeStudents: 5,
        projectsRecruiting: 10
      });
    });

    it('should call next on error', async () => {
      const error = new Error('DB error');
      User.countDocuments.mockRejectedValue(error);

      await statsController.all(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
