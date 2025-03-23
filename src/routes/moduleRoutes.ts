import { Router } from 'express';
import { ModuleController } from '../controllers/ModuleController';

const router = Router();
const moduleController = new ModuleController();

// Additional module-specific routes (more specific first)
router.post('/courses/:courseId', moduleController.createInCourse.bind(moduleController));
router.get('/courses/:courseId', moduleController.getModulesByCourse.bind(moduleController));
router.put('/courses/:courseId/reorder', moduleController.reorderModules.bind(moduleController));
router.get('/:id/lessons', moduleController.getModuleWithLessons.bind(moduleController));

// Generic CRUD routes (more generic last)
router.post('/', moduleController.create.bind(moduleController));
router.get('/', moduleController.findAll.bind(moduleController));
router.get('/:id', moduleController.findOne.bind(moduleController));
router.put('/:id', moduleController.update.bind(moduleController));
router.delete('/:id', moduleController.delete.bind(moduleController));

export default router; 