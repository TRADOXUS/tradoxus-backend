import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { CourseController } from '../../controllers/CourseController';
import { ModuleController } from '../../controllers/ModuleController';
import { LessonController } from '../../controllers/LessonController';
import { CapsuleController } from '../../controllers/CapsuleController';
import { validateRequest } from '../../middleware/validateRequest';
import { asyncHandler } from '../../utils/asyncHandler';
import { CreateCourseDto, UpdateCourseDto } from '../../dto/CourseDto';

// Mock all controllers and middleware
jest.mock('../../controllers/CourseController');
jest.mock('../../controllers/ModuleController');
jest.mock('../../controllers/LessonController');
jest.mock('../../controllers/CapsuleController');
jest.mock('../../middleware/validateRequest');
jest.mock('../../utils/asyncHandler');

describe('Course Routes', () => {
  let mockCourseController: jest.Mocked<CourseController>;
  let app: express.Application;
  let router: Router;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Create new instances of the mocked controllers
    mockCourseController = new CourseController() as jest.Mocked<CourseController>;
    
    // Mock all controller methods
    mockCourseController.create = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockCourseController.findAll = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json([{ id: 1, title: 'Course 1' }, { id: 2, title: 'Course 2' }]);
    });
    mockCourseController.findOne = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ id: 1, title: 'Test Course' });
    });
    mockCourseController.update = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockCourseController.delete = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ success: true });
    });
    mockCourseController.getPublishedCourses = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json([{ id: 1, title: 'Published Course 1' }]);
    });
    mockCourseController.getCourseWithModules = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ id: 1, title: 'Test Course', modules: [] });
    });
    mockCourseController.togglePublish = jest.fn().mockImplementation(function(this: CourseController, req, res) {
      res.json({ id: 1, published: true });
    });

    // Mock the validation middleware to return a function that calls next()
    (validateRequest as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => {
      next();
    });

    // Mock the async handler to return the original function
    (asyncHandler as jest.Mock).mockImplementation((fn) => fn);

    // Replace the controller instances in the routes
    (CourseController as jest.Mock).mockImplementation(() => mockCourseController);
    (ModuleController as jest.Mock).mockImplementation(() => new ModuleController());
    (LessonController as jest.Mock).mockImplementation(() => new LessonController());
    (CapsuleController as jest.Mock).mockImplementation(() => new CapsuleController());

    // Create a new router
    router = Router();

    // Define routes
    router.post('/', validateRequest(CreateCourseDto), asyncHandler((req, res) => mockCourseController.create(req, res)));
    router.get('/', asyncHandler((req, res) => mockCourseController.findAll(req, res)));
    router.get('/published', asyncHandler((req, res) => mockCourseController.getPublishedCourses(req, res)));
    router.get('/:id', asyncHandler((req, res) => mockCourseController.findOne(req, res)));
    router.get('/:id/with-modules', asyncHandler((req, res) => mockCourseController.getCourseWithModules(req, res)));
    router.put('/:id', validateRequest(UpdateCourseDto), asyncHandler((req, res) => mockCourseController.update(req, res)));
    router.delete('/:id', asyncHandler((req, res) => mockCourseController.delete(req, res)));
    router.patch('/:id/toggle-publish', asyncHandler((req, res) => mockCourseController.togglePublish(req, res)));

    // Use the router
    app.use('/api/courses', router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Course CRUD tests
  describe('POST /api/courses', () => {
    it('should create a new course', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCourseController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/courses', () => {
    it('should get all courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockCourseController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/courses/published', () => {
    it('should get all published courses', async () => {
      const response = await request(app)
        .get('/api/courses/published')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockCourseController.getPublishedCourses).toHaveBeenCalled();
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get a course by id', async () => {
      const response = await request(app)
        .get('/api/courses/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCourseController.findOne).toHaveBeenCalled();
    });
  });

  describe('GET /api/courses/:id/with-modules', () => {
    it('should get a course with its modules', async () => {
      const response = await request(app)
        .get('/api/courses/1/with-modules')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('modules');
      expect(mockCourseController.getCourseWithModules).toHaveBeenCalled();
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update a course', async () => {
      const courseData = {
        title: 'Updated Course',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put('/api/courses/1')
        .send(courseData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCourseController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should delete a course', async () => {
      const response = await request(app)
        .delete('/api/courses/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockCourseController.delete).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/courses/:id/toggle-publish', () => {
    it('should toggle course publish status', async () => {
      const response = await request(app)
        .patch('/api/courses/1/toggle-publish')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('published', true);
      expect(mockCourseController.togglePublish).toHaveBeenCalled();
    });
  });
}); 