import { Router } from 'express';
import { LessonController } from '../controllers/LessonController';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateLessonDto, UpdateLessonDto } from '../dto/LessonDto';

export const createLessonRouter = (lessonController: LessonController) => {
  const router = Router();

  // Generic CRUD routes
  router.post('/', validateRequest(CreateLessonDto), asyncHandler((req, res) => lessonController.create(req, res)));
  router.get('/', asyncHandler((req, res) => lessonController.findAll(req, res)));
  router.get('/:id', asyncHandler((req, res) => lessonController.findOne(req, res)));
  router.put('/:id', validateRequest(UpdateLessonDto), asyncHandler((req, res) => lessonController.update(req, res)));
  router.delete('/:id', asyncHandler((req, res) => lessonController.delete(req, res)));

  // Module-specific routes
  router.post('/modules/:moduleId', validateRequest(CreateLessonDto), asyncHandler((req, res) => lessonController.createInModule(req, res)));
  router.get('/modules/:moduleId', asyncHandler((req, res) => lessonController.getLessonsByModule(req, res)));
  router.post('/modules/:moduleId/reorder', asyncHandler((req, res) => lessonController.reorderLessons(req, res)));

  // Lesson-specific routes
  router.get('/:id/with-capsules', asyncHandler((req, res) => lessonController.getLessonWithCapsules(req, res)));
  router.patch('/:id/prerequisites', asyncHandler((req, res) => lessonController.updatePrerequisites(req, res)));

  return router;
};

// Default export for normal usage
const defaultController = new LessonController();
export default createLessonRouter(defaultController); 