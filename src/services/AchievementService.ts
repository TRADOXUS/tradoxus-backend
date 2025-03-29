import { BaseService } from "./BaseService";
import { Achievement, UserAchievement,  AchievementCategory } from "../entities/Achievement";
import { AppDataSource } from "../config/database";
import { Repository } from "typeorm";

export class AchievementService extends BaseService<Achievement> {
    private userAchievementRepo: Repository<UserAchievement>;
    
    constructor() {
        super(Achievement);
        this.userAchievementRepo = AppDataSource.getRepository(UserAchievement);
    }

    async assignAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
        const existing = await this.userAchievementRepo.findOne({ where: { userId, achievement: { id: achievementId } } });
        if (existing) return existing;

        const achievement = await this.findOne(achievementId);
        if (!achievement) throw new Error("Achievement not found");

        const newUserAchievement = this.userAchievementRepo.create({
            userId,
            achievement,
            earnedAt: new Date(),
            progress: 0,
            status: "IN_PROGRESS",
            metadata: {},
        });
        return this.userAchievementRepo.save(newUserAchievement);
    }

    async updateProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement | null> {
        const userAchievement = await this.userAchievementRepo.findOne({ where: { userId, achievement: { id: achievementId } } });
        if (!userAchievement) return null;

        userAchievement.progress += progress;
        if (userAchievement.progress >= 100) {
            userAchievement.status = "COMPLETED";
            this.sendNotification(userId, "🎉 Achievement Unlocked!", `You've completed ${userAchievement.achievement.name}`);
        }
        return this.userAchievementRepo.save(userAchievement);
    }

    async resetDailyStreaks(): Promise<void> {
        const userAchievements = await this.userAchievementRepo.find({ where: { status: "IN_PROGRESS", achievement: { category: AchievementCategory.STREAK } }, 
            relations: ["achievement"]});
        for (const userAchievement of userAchievements) {
            userAchievement.progress = 0;
            this.userAchievementRepo.save(userAchievement);
        }
    }

    private async sendNotification(userId: string, title: string, message: string): Promise<void> {
        console.log(`Notification to ${userId}: ${title} - ${message}`);
    }
    async findAll(page: number = 1, limit: number = 10): Promise<{ items: Achievement[]; total: number }> {
        try {
            const [items, total] = await this.repository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
            });
            console.log(`Fetched ${items.length} achievements for page ${page} with limit ${limit}`);
            return { items, total };
        } catch (error) {
            console.error('Error in AchievementService.findAll:', error);
            throw error;
        }
    }

    async findOne(id: string): Promise<Achievement | null> {
        return this.repository.findOne({ where: { id } });
    }
    async findByModuleId(moduleId: string): Promise<Achievement[]> {
        return this.repository
            .createQueryBuilder("achievement")
            .innerJoin("user_achievement", "ua", "ua.achievementId = achievement.id")
            .where("ua.metadata ->> 'moduleId' = :moduleId", { moduleId })
            .getMany();
    }
    
    async getUserAchievements(userId: string): Promise<UserAchievement[]> {
        return this.userAchievementRepo.find({ where: { userId }, relations: ["achievement"] });
    }
    
    async claimAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
        return this.assignAchievement(userId, achievementId);
    }
    
    async getUserProgress(userId: string): Promise<{ achievementId: string; progress: number }[]> {
        const achievements = await this.userAchievementRepo.find({ where: { userId } });
        return achievements.map(a => ({ achievementId: a.achievement.id, progress: a.progress }));
    }
    
    async getLeaderboard(): Promise<{ userId: string; points: number }[]> {
        // Example query - Adjust based on your data structure
        const leaderboard = await this.userAchievementRepo
            .createQueryBuilder("userAchievement")
            .select("userAchievement.userId", "userId")
            .addSelect("SUM(userAchievement.progress)", "points")
            .groupBy("userAchievement.userId")
            .orderBy("points", "DESC")
            .limit(10)
            .getRawMany();
    
        return leaderboard;
    }
    
    async getStatistics(): Promise<{ totalAchievements: number; completedAchievements: number }> {
        const total = await this.repository.count();
        const completed = await this.userAchievementRepo.count({ where: { status: "COMPLETED" } });
    
        return { totalAchievements: total, completedAchievements: completed };
    }
    
    async getCompletionRate(): Promise<number> {
        const total = await this.userAchievementRepo.count();
        if (total === 0) return 0;
    
        const completed = await this.userAchievementRepo.count({ where: { status: "COMPLETED" } });
        return (completed / total) * 100;
    }
    
    async getPopularAchievements(): Promise<Achievement[]> {
        return this.repository
            .createQueryBuilder("achievement")
            .leftJoinAndSelect("achievement.userAchievements", "userAchievements")
            .groupBy("achievement.id")
            .orderBy("COUNT(userAchievements.id)", "DESC")
            .limit(5)
            .getMany();
    }
    
}

