import request from 'supertest';
import express from 'express';
import { createLessonRouter } from '../../routes/lessonRoutes';
import { LessonController } from '../../controllers/LessonController';

// Mock the controller
jest.mock('../../controllers/LessonController');

describe('Lesson Routes', () => {
  let mockLessonController: jest.Mocked<LessonController>;
  let app: express.Application;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Create a new instance of the mocked controller
    mockLessonController = new LessonController() as jest.Mocked<LessonController>;
    
    // Mock all controller methods
    mockLessonController.create = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockLessonController.findAll = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json([{ id: 1, title: 'Lesson 1' }, { id: 2, title: 'Lesson 2' }]);
    });
    mockLessonController.findOne = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ id: 1, title: 'Test Lesson' });
    });
    mockLessonController.update = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockLessonController.delete = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ success: true });
    });
    mockLessonController.createInModule = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ id: 1, ...req.body });
    });
    mockLessonController.getLessonsByModule = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({
        items: [{ id: 1, title: 'Lesson 1' }, { id: 2, title: 'Lesson 2' }],
        total: 2,
        page: 1,
        totalPages: 1
      });
    });
    mockLessonController.reorderLessons = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json([{ id: 1, order: 1 }, { id: 2, order: 2 }]);
    });
    mockLessonController.getLessonWithCapsules = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({
        id: 1,
        title: 'Test Lesson',
        capsules: [{ id: 1, title: 'Capsule 1' }]
      });
    });
    mockLessonController.updatePrerequisites = jest.fn().mockImplementation(function(this: LessonController, req, res) {
      res.json({ id: 1, prerequisites: req.body.prerequisites });
    });

    // Create a new router with the mocked controller
    const router = createLessonRouter(mockLessonController);
    app.use('/api/lessons', router);
  });

  // Generic CRUD tests
  describe('POST /api/lessons', () => {
    it('should create a new lesson', async () => {
      const lessonData = {
        title: 'Test Lesson',
        description: 'Test Description',
        moduleId: 'module-1'
      };

      const response = await request(app)
        .post('/api/lessons')
        .send(lessonData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockLessonController.create).toHaveBeenCalled();
    });

    it('should validate lesson data', async () => {
      const invalidData = {
        title: 'Te', // Too short
        moduleId: '' // Empty
      };

      await request(app)
        .post('/api/lessons')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/lessons', () => {
    it('should get all lessons with pagination', async () => {
      const response = await request(app)
        .get('/api/lessons')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockLessonController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('should get a lesson by id', async () => {
      const response = await request(app)
        .get('/api/lessons/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockLessonController.findOne).toHaveBeenCalled();
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('should update a lesson', async () => {
      const lessonData = {
        title: 'Updated Lesson',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put('/api/lessons/1')
        .send(lessonData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockLessonController.update).toHaveBeenCalled();
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: 'Te' // Too short
      };

      await request(app)
        .put('/api/lessons/1')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('should delete a lesson', async () => {
      const response = await request(app)
        .delete('/api/lessons/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockLessonController.delete).toHaveBeenCalled();
    });
  });

  // Lesson-specific tests
  describe('POST /api/lessons/modules/:moduleId', () => {
    it('should create a lesson in a module', async () => {
      const lessonData = {
        title: 'Module Lesson',
        description: 'Module Description',
        moduleId: 'module-1'
      };

      const response = await request(app)
        .post('/api/lessons/modules/module-1')
        .send(lessonData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockLessonController.createInModule).toHaveBeenCalled();
    });
  });

  describe('GET /api/lessons/modules/:moduleId', () => {
    it('should get all lessons for a module', async () => {
      const response = await request(app)
        .get('/api/lessons/modules/module-1')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(mockLessonController.getLessonsByModule).toHaveBeenCalled();
    });
  });

  describe('POST /api/lessons/modules/:moduleId/reorder', () => {
    it('should reorder lessons in a module', async () => {
      const reorderData = {
        lessonOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 }
        ]
      };

      const response = await request(app)
        .post('/api/lessons/modules/module-1/reorder')
        .send(reorderData)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockLessonController.reorderLessons).toHaveBeenCalled();
    });
  });

  describe('GET /api/lessons/:id/with-capsules', () => {
    it('should get a lesson with its capsules', async () => {
      const response = await request(app)
        .get('/api/lessons/1/with-capsules')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('capsules');
      expect(mockLessonController.getLessonWithCapsules).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/lessons/:id/prerequisites', () => {
    it('should update lesson prerequisites', async () => {
      const prerequisitesData = {
        prerequisites: ['lesson-1', 'lesson-2']
      };

      const response = await request(app)
        .patch('/api/lessons/1/prerequisites')
        .send(prerequisitesData)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('prerequisites');
      expect(mockLessonController.updatePrerequisites).toHaveBeenCalled();
    });
  });
}); 