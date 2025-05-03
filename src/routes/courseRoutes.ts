import { Router } from "express";
import { CourseController } from "../controllers/CourseController";
import { ModuleController } from "../controllers/ModuleController";
import { LessonController } from "../controllers/LessonController";
import { CapsuleController } from "../controllers/CapsuleController";
import { validateRequest } from "../middleware/validateRequest";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/adminAuthMiddleware";
import { CreateCourseDto, UpdateCourseDto } from "../dto/CourseDto";

const router = Router();
const courseController = new CourseController();
const moduleController = new ModuleController();
const lessonController = new LessonController();
const capsuleController = new CapsuleController();

// Course routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest(CreateCourseDto),
  asyncHandler((req, res) => courseController.create(req, res)),
);
router.get(
  "/",
  asyncHandler((req, res) => courseController.findAll(req, res)),
);
router.get(
  "/published",
  asyncHandler((req, res) => courseController.getPublishedCourses(req, res)),
);
router.get(
  "/:id",
  asyncHandler((req, res) => courseController.findOne(req, res)),
);
router.get(
  "/:id/with-modules",
  asyncHandler((req, res) => courseController.getCourseWithModules(req, res)),
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(UpdateCourseDto),
  asyncHandler((req, res) => courseController.update(req, res)),
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => courseController.delete(req, res)),
);
router.patch(
  "/:id/toggle-publish",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => courseController.togglePublish(req, res)),
);

// Module routes
router.post(
  "/courses/:courseId/modules",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => moduleController.createInCourse(req, res)),
);
router.get(
  "/courses/:courseId/modules",
  asyncHandler((req, res) => moduleController.getModulesByCourse(req, res)),
);
router.put(
  "/modules/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => moduleController.update(req, res)),
);
router.delete(
  "/modules/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => moduleController.delete(req, res)),
);
router.get(
  "/modules/:id/with-lessons",
  asyncHandler((req, res) => moduleController.getModuleWithLessons(req, res)),
);
router.post(
  "/courses/:courseId/modules/reorder",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => moduleController.reorderModules(req, res)),
);

// Lesson routes
router.post(
  "/modules/:moduleId/lessons",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => lessonController.createInModule(req, res)),
);
router.get(
  "/modules/:moduleId/lessons",
  asyncHandler((req, res) => lessonController.getLessonsByModule(req, res)),
);
router.put(
  "/lessons/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => lessonController.update(req, res)),
);
router.delete(
  "/lessons/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => lessonController.delete(req, res)),
);
router.get(
  "/lessons/:id/with-capsules",
  asyncHandler((req, res) => lessonController.getLessonWithCapsules(req, res)),
);
router.post(
  "/modules/:moduleId/lessons/reorder",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => lessonController.reorderLessons(req, res)),
);
router.patch(
  "/lessons/:id/prerequisites",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => lessonController.updatePrerequisites(req, res)),
);

// Capsule routes
router.post(
  "/lessons/:lessonId/capsules",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => capsuleController.createInLesson(req, res)),
);
router.get(
  "/lessons/:lessonId/capsules",
  asyncHandler((req, res) => capsuleController.getCapsulesByLesson(req, res)),
);
router.put(
  "/capsules/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => capsuleController.update(req, res)),
);
router.delete(
  "/capsules/:id",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => capsuleController.delete(req, res)),
);
router.patch(
  "/capsules/:id/content",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => capsuleController.updateContent(req, res)),
);
router.post(
  "/lessons/:lessonId/capsules/reorder",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => capsuleController.reorderCapsules(req, res)),
);
router.get(
  "/capsules/type/:type",
  asyncHandler((req, res) => capsuleController.getCapsulesByType(req, res)),
);

export default router;
