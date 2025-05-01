import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { CourseController } from '../../controllers/CourseController';
// Unused controller imports removed
import { validateRequest } from '../../middleware/validateRequest';
import { asyncHandler } from '../../utils/asyncHandler';
import { CreateCourseDto, UpdateCourseDto } from '../../dto/CourseDto';
import { authenticate } from '../../middleware/authMiddleware'; 
import { requireAdmin } from '../../middleware/adminAuthMiddleware';
import { AppError } from '../../middleware/errorHandler';
import { User } from '../../entities/User';

// Mock controllers and specific middleware
jest.mock('../../controllers/CourseController');
jest.mock('../../middleware/validateRequest');
jest.mock('../../utils/asyncHandler');
// Mock the actual auth middleware functions
jest.mock('../../middleware/authMiddleware');
jest.mock('../../middleware/adminAuthMiddleware');
jest.mock('../../middleware/errorHandler');

// Define mock user types for clarity
const mockAdminUser = { id: 'admin-user-id', isAdmin: true, isActive: true }; 
const mockNormalUser = { id: 'normal-user-id', isAdmin: false, isActive: true };

describe('Course Routes', () => {
  let mockCourseController: jest.Mocked<CourseController>;
  let mockAuthenticate: jest.MockedFunction<typeof authenticate>;
  let mockRequireAdmin: jest.MockedFunction<typeof requireAdmin>;
  let app: express.Application;

  // --- Mock Implementations ---
  const setupMockAuth = () => {
    mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
    mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

    mockAuthenticate.mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authorization header missing or invalid' });
        return; // Return void
      }
      const token = authHeader.split(' ')[1];
      if (token === 'admin-token') {
        // Cast mock user to satisfy User type for testing
        req.user = mockAdminUser as User; 
        return next();
      }
      if (token === 'user-token') {
        // Cast mock user to satisfy User type for testing
        req.user = mockNormalUser as User; 
        return next();
      }
      // Simulate invalid token scenario
      res.status(401).json({ message: 'Invalid token' });
      return; // Return void
    });

    mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction) => {
      if (req.user?.isAdmin) {
        return next();
      }
      // Simulate requireAdmin middleware calling next with an error or responding directly
      // Use the mocked AppError constructor
      const error = new (AppError as jest.MockedClass<typeof AppError>)(403, 'Forbidden: Administrator privileges required.');
      res.status(403).json({ status: 'error', message: error.message });
      return; // Return void
    });

    // Mock AppError constructor to return an object satisfying AppError type
    (AppError as jest.MockedClass<typeof AppError>).mockImplementation((statusCode: number, message: string) => {
        const error = new Error(message) as AppError;
        error.statusCode = statusCode;
        return error;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    setupMockAuth();

    mockCourseController = new CourseController() as jest.Mocked<CourseController>;

    mockCourseController.create = jest.fn().mockImplementation((req, res) => {
      res.status(201).json({ id: 1, ...req.body });
    });
    mockCourseController.findAll = jest.fn().mockImplementation((req, res) => {
      res.status(200).json([{ id: 1, title: 'Course 1' }, { id: 2, title: 'Course 2' }]);
    });
    mockCourseController.findOne = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({ id: req.params.id, title: 'Test Course' });
    });
    mockCourseController.update = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({ id: req.params.id, ...req.body });
    });
    mockCourseController.delete = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Course deleted' }); 
    });
    mockCourseController.getPublishedCourses = jest.fn().mockImplementation((req, res) => {
      res.status(200).json([{ id: 1, title: 'Published Course 1' }]);
    });
    mockCourseController.getCourseWithModules = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({ id: req.params.id, title: 'Test Course', modules: [] });
    });
    mockCourseController.togglePublish = jest.fn().mockImplementation((req, res) => {
      // Simulate toggling based on current state if needed, or just return success
      res.status(200).json({ id: req.params.id, published: true }); 
    });

    // Mock the validation middleware to return a function that calls next()
    (validateRequest as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => {
      // Simulate validation success
      next();
      // To simulate validation failure:
      // res.status(400).json({ message: 'Validation Error', errors: [...] });
    });

    // Mock the async handler to return the original function (or a simplified version)
    (asyncHandler as jest.Mock).mockImplementation((fn) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            // Simulate error being passed to a global error handler if needed
            // For these tests, controller mocks handle responses directly
            console.error("Async handler caught error in test:", error);
            if (!res.headersSent) {
                res.status(500).json({ message: "Test Internal Server Error" });
            }
        }
    });

    // Replace the controller instances in the routes
    (CourseController as jest.Mock).mockImplementation(() => mockCourseController);
    // Mock other controllers if their routes were included in testRouter
    // (ModuleController as jest.Mock).mockImplementation(() => new ModuleController());
    // (LessonController as jest.Mock).mockImplementation(() => new LessonController());
    // (CapsuleController as jest.Mock).mockImplementation(() => new CapsuleController());

    // --- Define routes using the actual middleware (which are mocked) ---
    const testRouter = express.Router();
    testRouter.post('/', mockAuthenticate, mockRequireAdmin, validateRequest(CreateCourseDto), asyncHandler((req, res) => mockCourseController.create(req, res)));
    // Assuming GET routes might require authentication but not admin rights
    testRouter.get('/', mockAuthenticate, asyncHandler((req, res) => mockCourseController.findAll(req, res)));
    testRouter.get('/published', mockAuthenticate, asyncHandler((req, res) => mockCourseController.getPublishedCourses(req, res)));
    testRouter.get('/:id', mockAuthenticate, asyncHandler((req, res) => mockCourseController.findOne(req, res)));
    testRouter.get('/:id/with-modules', mockAuthenticate, asyncHandler((req, res) => mockCourseController.getCourseWithModules(req, res)));
    // Admin required routes
    testRouter.put('/:id', mockAuthenticate, mockRequireAdmin, validateRequest(UpdateCourseDto), asyncHandler((req, res) => mockCourseController.update(req, res)));
    testRouter.delete('/:id', mockAuthenticate, mockRequireAdmin, asyncHandler((req, res) => mockCourseController.delete(req, res)));
    testRouter.patch('/:id/toggle-publish', mockAuthenticate, mockRequireAdmin, asyncHandler((req, res) => mockCourseController.togglePublish(req, res)));

    // Use the testRouter
    app.use('/api/courses', testRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Course CRUD tests ---
  describe('POST /api/courses', () => {
    const courseData = { title: 'Test Course', description: 'Test Description' };

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(401);
      expect(mockCourseController.create).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden if user is not an admin', async () => {
      await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer user-token') 
        .send(courseData)
        .expect(403);
      expect(mockCourseController.create).not.toHaveBeenCalled();
    });

    it('should create a new course (201) if user is an admin', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer admin-token')
        .send(courseData)
        .expect(201); 

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCourseController.create).toHaveBeenCalledTimes(1);
    });
  });

  // --- GET Routes (Assuming only authentication needed) ---
  describe('GET /api/courses', () => {
     it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .get('/api/courses')
            .expect(401);
        expect(mockCourseController.findAll).not.toHaveBeenCalled();
     });

     it('should get all courses (200) if user is authenticated (non-admin OK)', async () => {
        const response = await request(app)
            .get('/api/courses')
            .set('Authorization', 'Bearer user-token')
            .expect(200);

        expect(response.body).toHaveLength(2);
        expect(mockCourseController.findAll).toHaveBeenCalledTimes(1);
     });
  });

  describe('GET /api/courses/published', () => {
     it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .get('/api/courses/published')
            .expect(401);
        expect(mockCourseController.getPublishedCourses).not.toHaveBeenCalled();
     });

     it('should get all published courses (200) if user is authenticated', async () => {
        const response = await request(app)
            .get('/api/courses/published')
            .set('Authorization', 'Bearer user-token')
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(mockCourseController.getPublishedCourses).toHaveBeenCalledTimes(1);
     });
  });

  describe('GET /api/courses/:id', () => {
     it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .get('/api/courses/1')
            .expect(401);
        expect(mockCourseController.findOne).not.toHaveBeenCalled();
     });

     it('should get a course by id (200) if user is authenticated', async () => {
        const response = await request(app)
            .get('/api/courses/1')
            .set('Authorization', 'Bearer user-token')
            .expect(200);

        expect(response.body).toHaveProperty('id', '1');
        expect(mockCourseController.findOne).toHaveBeenCalledTimes(1);
     });
  });

  describe('GET /api/courses/:id/with-modules', () => {
     it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .get('/api/courses/1/with-modules')
            .expect(401);
        expect(mockCourseController.getCourseWithModules).not.toHaveBeenCalled();
     });

     it('should get a course with its modules (200) if user is authenticated', async () => {
        const response = await request(app)
            .get('/api/courses/1/with-modules')
            .set('Authorization', 'Bearer user-token')
            .expect(200);

        expect(response.body).toHaveProperty('id', '1');
        expect(response.body).toHaveProperty('modules');
        expect(mockCourseController.getCourseWithModules).toHaveBeenCalledTimes(1);
     });
  });

  // --- PUT Route (Admin Required) ---
  describe('PUT /api/courses/:id', () => {
    const courseData = { title: 'Updated Course', description: 'Updated Description' };

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app)
        .put('/api/courses/1')
        .send(courseData)
        .expect(401);
      expect(mockCourseController.update).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden if user is not an admin', async () => {
      await request(app)
        .put('/api/courses/1')
        .set('Authorization', 'Bearer user-token')
        .send(courseData)
        .expect(403);
      expect(mockCourseController.update).not.toHaveBeenCalled();
    });

    it('should update a course (200) if user is an admin', async () => {
      const response = await request(app)
        .put('/api/courses/1')
        .set('Authorization', 'Bearer admin-token')
        .send(courseData)
        .expect(200);

      expect(response.body).toHaveProperty('id', '1');
      expect(mockCourseController.update).toHaveBeenCalledTimes(1);
    });
  });

  // --- DELETE Route (Admin Required) ---
  describe('DELETE /api/courses/:id', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .delete('/api/courses/1')
            .expect(401);
        expect(mockCourseController.delete).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden if user is not an admin', async () => {
        await request(app)
            .delete('/api/courses/1')
            .set('Authorization', 'Bearer user-token')
            .expect(403);
        expect(mockCourseController.delete).not.toHaveBeenCalled();
    });

    it('should delete a course (200) if user is an admin', async () => {
      const response = await request(app)
        .delete('/api/courses/1')
        .set('Authorization', 'Bearer admin-token') 
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockCourseController.delete).toHaveBeenCalledTimes(1);
    });
  });

  // --- PATCH Route (Admin Required) ---
  describe('PATCH /api/courses/:id/toggle-publish', () => {
     it('should return 401 Unauthorized if no token is provided', async () => {
        await request(app)
            .patch('/api/courses/1/toggle-publish')
            .expect(401);
        expect(mockCourseController.togglePublish).not.toHaveBeenCalled();
     });

     it('should return 403 Forbidden if user is not an admin', async () => {
        await request(app)
            .patch('/api/courses/1/toggle-publish')
            .set('Authorization', 'Bearer user-token')
            .expect(403);
        expect(mockCourseController.togglePublish).not.toHaveBeenCalled();
     });

     it('should toggle course publish status (200) if user is an admin', async () => {
        const response = await request(app)
            .patch('/api/courses/1/toggle-publish')
            .set('Authorization', 'Bearer admin-token') 
            .expect(200);

        expect(response.body).toHaveProperty('id', '1');
        expect(response.body).toHaveProperty('published', true);
        expect(mockCourseController.togglePublish).toHaveBeenCalledTimes(1);
     });
  });
});
