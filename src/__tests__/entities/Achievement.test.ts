import { Achievement, UserAchievement, AchievementType, AchievementCategory } from "../../entities/Achievement";

describe("Achievement Entity", () => {
  it("should create an achievement with valid properties", async () => {
    const achievement = new Achievement();
    achievement.name = "Module Master";
    achievement.description = "Complete all lessons in a module with perfect scores";
    achievement.type = AchievementType.GOLD;
    achievement.category = AchievementCategory.MODULE_COMPLETION;
    achievement.points = 1000;
    achievement.icon = "gold_badge.png";
    achievement.criteria = [{ condition: "score", targetValue: 100 }];
    achievement.rewards = [{ type: "badge", value: "Gold Master" }];
    
    expect(achievement.name).toBe("Module Master");
    expect(achievement.type).toBe(AchievementType.GOLD);
    expect(achievement.category).toBe(AchievementCategory.MODULE_COMPLETION);
    expect(achievement.criteria.length).toBe(1);
  });
});

describe("UserAchievement Entity", () => {
  it("should create a user achievement with valid properties", async () => {
    const userAchievement = new UserAchievement();
    userAchievement.userId = "user-123";
    userAchievement.achievement = new Achievement();
    userAchievement.earnedAt = new Date();
    userAchievement.progress = 100;
    userAchievement.status = "completed";
    userAchievement.metadata = { moduleId: "module-456", attempts: 2 };

    expect(userAchievement.userId).toBe("user-123");
    expect(userAchievement.progress).toBe(100);
    expect(userAchievement.status).toBe("completed");
    expect(userAchievement.metadata?.moduleId).toBe("module-456");
  });
});
