import { Request, Response } from 'express';
import { AchievementService } from '../services/AchievementService';
import { AppError } from '../middleware/errorHandler';


export class AchievementController {
    private achievementService: AchievementService;

    constructor(service?: AchievementService) {
        this.achievementService = service || new AchievementService();
    }
   
    async findAll(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
            
        const achievements = await this.achievementService.findAll(page, limit);
        if (!achievements) {
            throw new AppError(500, 'Failed to fetch achievements');
        }
        res.json({
            status: 'success',
            data: achievements.items,
        });
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const achievement = await this.achievementService.findOne(req.params.id);
            if (!achievement) {
                throw new AppError(404, 'Achievement not found');
            }
            res.json({ status: 'success', data: achievement });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch achievement');
        }
    }
    async findByModuleId(req: Request, res: Response): Promise<Response> {
        try {
            const { moduleId } = req.params;
    
            if (!moduleId) {
                return res.status(400).json({ status: "error", message: "Module ID is required" });
            }
    
            const achievements = await this.achievementService.findByModuleId(moduleId);
    
            return res.json({ status: "success", data: achievements });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    }
    

    async getUserAchievements(req: Request, res: Response): Promise<void> {
        try {
            const achievements = await this.achievementService.getUserAchievements(req.params.userId);
            res.json({ status: 'success', data: achievements });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch user achievements');
        }
    }

    async claimAchievement(req: Request, res: Response): Promise<void> {
        try {
            const achievement = await this.achievementService.claimAchievement(req.params.userId, req.params.achievementId);
            res.json({ status: 'success', data: achievement });
        } catch (err) {
            throw new AppError(500, 'Failed to claim achievement');
        }
    }

    async getUserProgress(req: Request, res: Response): Promise<void> {
        try {
            const progress = await this.achievementService.getUserProgress(req.params.userId);
            res.json({ status: 'success', data: progress });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch user progress');
        }
    }

    async updateProgress(req: Request, res: Response): Promise<Response> {
        try {
            const { userId, achievementId, progress } = req.body;
    
            if (!userId || !achievementId || progress === undefined) {
                throw new AppError(400, "Missing required parameters");
            }
    
            const updatedProgress = await this.achievementService.updateProgress(userId, achievementId, progress);
            
            if (!updatedProgress) {
                return res.status(404).json({ status: "error", message: "User achievement not found" });
            }
    
            return res.json({ status: "success", data: updatedProgress });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ status: "error", message: err.message });
        }
    }
    

    async getLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const leaderboard = await this.achievementService.getLeaderboard();
            res.json({ status: 'success', data: leaderboard });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch leaderboard');
        }
    }

    async getStatistics(req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.achievementService.getStatistics();
            res.json({ status: 'success', data: stats });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch achievement statistics');
        }
    }

    async getCompletionRate(req: Request, res: Response): Promise<void> {
        try {
            const rate = await this.achievementService.getCompletionRate();
            res.json({ status: 'success', data: rate });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch achievement completion rate');
        }
    }

    async getPopularAchievements(req: Request, res: Response): Promise<void> {
        try {
            const popular = await this.achievementService.getPopularAchievements();
            res.json({ status: 'success', data: popular });
        } catch (err) {
            throw new AppError(500, 'Failed to fetch popular achievements');
        }
    }
}
