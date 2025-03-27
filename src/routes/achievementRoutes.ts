import { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';

const router = Router();
const achievementController = new AchievementController();

// Achievement Management
router.get('/', achievementController.findAll);
router.get('/:id', achievementController.findOne);
router.get("/achievements/module/:moduleId", achievementController.findByModuleId.bind(achievementController));

// User Achievements
router.get('/users/:userId/achievements', achievementController.getUserAchievements);
router.post('/users/:userId/achievements/:achievementId/claim', achievementController.claimAchievement);
router.get('/users/:userId/achievements/progress', achievementController.getUserProgress);

// Achievement Progress
router.post('/progress/update', achievementController.updateProgress.bind(achievementController));
router.get('/leaderboard', achievementController.getLeaderboard);
router.get('/statistics', achievementController.getStatistics);

// Achievement Analytics
router.get('/analytics/completion-rate', achievementController.getCompletionRate);
router.get('/analytics/popular', achievementController.getPopularAchievements);

export default router;
