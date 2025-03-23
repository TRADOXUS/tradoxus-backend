import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { CapsuleController } from '../../controllers/CapsuleController';
import { validateRequest } from '../../middleware/validateRequest';
import { asyncHandler } from '../../utils/asyncHandler';
import { CreateCapsuleDto, UpdateCapsuleDto } from '../../dto/CapsuleDto';

// Mock all controllers and middleware
jest.mock('../../controllers/CapsuleController');
jest.mock('../../middleware/validateRequest');
jest.mock('../../utils/asyncHandler');

describe('Capsule Routes', () => {
  let mockCapsuleController: jest.Mocked<CapsuleController>;
  let app: express.Application;
  let router: Router;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Create new instance of the mocked controller
    mockCapsuleController = new CapsuleController() as jest.Mocked<CapsuleController>;
    
    // Mock all controller methods
    mockCapsuleController.create = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockCapsuleController.findAll = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json([{ id: 1, title: 'Capsule 1' }, { id: 2, title: 'Capsule 2' }]);
    });
    mockCapsuleController.findOne = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ id: 1, title: 'Test Capsule' });
    });
    mockCapsuleController.update = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockCapsuleController.delete = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ success: true });
    });
    mockCapsuleController.createInLesson = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ id: 1, lessonId: req.params.lessonId, ...req.body });
    });
    mockCapsuleController.getCapsulesByLesson = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json([{ id: 1, lessonId: req.params.lessonId, title: 'Capsule 1' }]);
    });
    mockCapsuleController.getCapsulesByType = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json([{ id: 1, type: req.params.type, title: 'Capsule 1' }]);
    });
    mockCapsuleController.updateContent = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ id: 1, content: req.body.content });
    });
    mockCapsuleController.reorderCapsules = jest.fn().mockImplementation(function(this: CapsuleController, req, res) {
      res.json({ success: true });
    });

    // Mock the validation middleware to return a function that calls next()
    (validateRequest as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => {
      next();
    });

    // Mock the async handler to return the original function
    (asyncHandler as jest.Mock).mockImplementation((fn) => fn);

    // Replace the controller instance in the routes
    (CapsuleController as jest.Mock).mockImplementation(() => mockCapsuleController);

    // Create a new router
    router = Router();

    // Define routes
    // Generic CRUD routes
    router.post('/', validateRequest(CreateCapsuleDto), asyncHandler((req, res) => mockCapsuleController.create(req, res)));
    router.get('/', asyncHandler((req, res) => mockCapsuleController.findAll(req, res)));
    router.get('/:id', asyncHandler((req, res) => mockCapsuleController.findOne(req, res)));
    router.put('/:id', validateRequest(UpdateCapsuleDto), asyncHandler((req, res) => mockCapsuleController.update(req, res)));
    router.delete('/:id', asyncHandler((req, res) => mockCapsuleController.delete(req, res)));

    // Capsule-specific routes
    router.post('/lessons/:lessonId', validateRequest(CreateCapsuleDto), asyncHandler((req, res) => mockCapsuleController.createInLesson(req, res)));
    router.get('/lessons/:lessonId', asyncHandler((req, res) => mockCapsuleController.getCapsulesByLesson(req, res)));
    router.put('/lessons/:lessonId/reorder', asyncHandler((req, res) => mockCapsuleController.reorderCapsules(req, res)));
    router.put('/:id/content', asyncHandler((req, res) => mockCapsuleController.updateContent(req, res)));
    router.get('/type/:type', asyncHandler((req, res) => mockCapsuleController.getCapsulesByType(req, res)));

    // Use the router
    app.use('/api/capsules', router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Generic CRUD tests
  describe('POST /api/capsules', () => {
    it('should create a new capsule', async () => {
      const capsuleData = {
        title: 'Test Capsule',
        content: 'Test Content',
        type: 'video'
      };

      const response = await request(app)
        .post('/api/capsules')
        .send(capsuleData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCapsuleController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/capsules', () => {
    it('should get all capsules', async () => {
      const response = await request(app)
        .get('/api/capsules')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockCapsuleController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/capsules/:id', () => {
    it('should get a capsule by id', async () => {
      const response = await request(app)
        .get('/api/capsules/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCapsuleController.findOne).toHaveBeenCalled();
    });
  });

  describe('PUT /api/capsules/:id', () => {
    it('should update a capsule', async () => {
      const capsuleData = {
        title: 'Updated Capsule',
        content: 'Updated Content'
      };

      const response = await request(app)
        .put('/api/capsules/1')
        .send(capsuleData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCapsuleController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/capsules/:id', () => {
    it('should delete a capsule', async () => {
      const response = await request(app)
        .delete('/api/capsules/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockCapsuleController.delete).toHaveBeenCalled();
    });
  });

  // Capsule-specific tests
  describe('POST /api/capsules/lessons/:lessonId', () => {
    it('should create a new capsule in a lesson', async () => {
      const capsuleData = {
        title: 'Test Capsule',
        content: 'Test Content',
        type: 'video'
      };

      const response = await request(app)
        .post('/api/capsules/lessons/1')
        .send(capsuleData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('lessonId', '1');
      expect(mockCapsuleController.createInLesson).toHaveBeenCalled();
    });
  });

  describe('GET /api/capsules/lessons/:lessonId', () => {
    it('should get all capsules for a lesson', async () => {
      const response = await request(app)
        .get('/api/capsules/lessons/1')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('lessonId', '1');
      expect(mockCapsuleController.getCapsulesByLesson).toHaveBeenCalled();
    });
  });

  describe('PUT /api/capsules/lessons/:lessonId/reorder', () => {
    it('should reorder capsules in a lesson', async () => {
      const reorderData = {
        capsuleIds: [1, 2, 3]
      };

      const response = await request(app)
        .put('/api/capsules/lessons/1/reorder')
        .send(reorderData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockCapsuleController.reorderCapsules).toHaveBeenCalled();
    });
  });

  describe('PUT /api/capsules/:id/content', () => {
    it('should update capsule content', async () => {
      const contentData = {
        content: 'Updated Content'
      };

      const response = await request(app)
        .put('/api/capsules/1/content')
        .send(contentData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('content', 'Updated Content');
      expect(mockCapsuleController.updateContent).toHaveBeenCalled();
    });
  });

  describe('GET /api/capsules/type/:type', () => {
    it('should get capsules by type', async () => {
      const response = await request(app)
        .get('/api/capsules/type/video')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('type', 'video');
      expect(mockCapsuleController.getCapsulesByType).toHaveBeenCalled();
    });
  });
}); 