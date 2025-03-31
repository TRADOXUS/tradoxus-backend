import { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const achievementController = new AchievementController();

// Achievement Management
router.get('/', asyncHandler((req, res) => achievementController.findAll(req, res)));
router.get('/:id', asyncHandler((req, res) => achievementController.findOne(req, res)));
router.get("/module/:moduleId", asyncHandler(achievementController.findByModuleId.bind(achievementController)));

//router.post("/module/:moduleId", asyncHandler((req, res) => achievementController.findByModuleId.bind(achievementController)));

// User Achievements
router.get('/users/:userId/achievements', asyncHandler((req, res) => achievementController.getUserAchievements(req,res)));
router.post('/users/:userId/achievements/:achievementId/claim', asyncHandler((req, res) => achievementController.claimAchievement(req,res)));
router.get('/users/:userId/achievements/progress',asyncHandler((req, res) =>  achievementController.getUserProgress(req,res)));

// Achievement Progress
router.post('/progress/update', asyncHandler(achievementController.updateProgress.bind(achievementController)));
router.get('/leaderboard', asyncHandler((req, res) => achievementController.getLeaderboard(req,res)));
router.get('/statistics', asyncHandler((req, res) => achievementController.getStatistics(req,res)));

// Achievement Analytics
router.get('/analytics/completion-rate', asyncHandler((req, res) => achievementController.getCompletionRate(req,res)));
router.get('/analytics/popular', asyncHandler((req, res) =>  achievementController.getPopularAchievements(req,res)));

export default router;
