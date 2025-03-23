import { Router } from 'express';
import { CapsuleController } from '../controllers/CapsuleController';

const router = Router();
const capsuleController = new CapsuleController();

// Create a new capsule
router.post('/', capsuleController.create.bind(capsuleController));

// Get all capsules with pagination
router.get('/', capsuleController.findAll.bind(capsuleController));

// Get a capsule by id
router.get('/:id', capsuleController.findOne.bind(capsuleController));

// Update a capsule
router.put('/:id', capsuleController.update.bind(capsuleController));

// Delete a capsule
router.delete('/:id', capsuleController.delete.bind(capsuleController));

// Additional capsule-specific routes
router.post('/lessons/:lessonId', capsuleController.createInLesson.bind(capsuleController));
router.get('/lessons/:lessonId', capsuleController.getCapsulesByLesson.bind(capsuleController));
router.put('/lessons/:lessonId/reorder', capsuleController.reorderCapsules.bind(capsuleController));
router.put('/:id/content', capsuleController.updateContent.bind(capsuleController));
router.get('/type/:type', capsuleController.getCapsulesByType.bind(capsuleController));

export default router; 