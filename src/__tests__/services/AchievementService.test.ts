import { AchievementService } from "../../services/AchievementService";
import { Repository } from "typeorm";
import { Achievement, UserAchievement } from "../../entities/Achievement";
import { AppDataSource } from "../../config/database";

jest.mock("../../config/database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("AchievementService", () => {
  let achievementService: AchievementService;
  let mockAchievementRepo: Partial<Repository<Achievement>>;
  let mockUserAchievementRepo: Partial<Repository<UserAchievement>>;

  beforeEach(() => {
    mockAchievementRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockUserAchievementRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity.name === "Achievement") return mockAchievementRepo;
      if (entity.name === "UserAchievement") return mockUserAchievementRepo;
      return {};
    });

    achievementService = new AchievementService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should assign an achievement to a user", async () => {
    const mockAchievement = {
      id: "achv123",
      name: "Test Achievement",
    } as Achievement;
    const mockUserAchievement = {
      userId: "user1",
      achievement: mockAchievement,
    } as UserAchievement;

    (mockUserAchievementRepo.findOne as jest.Mock).mockResolvedValue(null);
    (mockAchievementRepo.findOne as jest.Mock).mockResolvedValue(
      mockAchievement,
    );
    (mockUserAchievementRepo.save as jest.Mock).mockResolvedValue(
      mockUserAchievement,
    );
    (mockUserAchievementRepo.create as jest.Mock).mockReturnValue(
      mockUserAchievement,
    );

    const result = await achievementService.assignAchievement(
      "user1",
      "achv123",
    );

    expect(result).toEqual(mockUserAchievement);
    expect(mockAchievementRepo.findOne).toHaveBeenCalledWith({
      where: { id: "achv123" },
    });
    expect(mockUserAchievementRepo.save).toHaveBeenCalled();
  });

  it("should return existing achievement if already assigned", async () => {
    const mockUserAchievement = {
      userId: "user1",
      achievement: { id: "achv123" },
    } as UserAchievement;

    (mockUserAchievementRepo.findOne as jest.Mock).mockResolvedValue(
      mockUserAchievement,
    );

    const result = await achievementService.assignAchievement(
      "user1",
      "achv123",
    );

    expect(result).toEqual(mockUserAchievement);
    expect(mockUserAchievementRepo.findOne).toHaveBeenCalledWith({
      where: { userId: "user1", achievement: { id: "achv123" } },
    });
  });

  it("should update achievement progress", async () => {
    const mockUserAchievement = {
      userId: "user1",
      achievement: { id: "achv123", name: "Test Achievement" },
      progress: 50,
      status: "IN_PROGRESS",
    } as UserAchievement;

    (mockUserAchievementRepo.findOne as jest.Mock).mockResolvedValue(
      mockUserAchievement,
    );
    (mockUserAchievementRepo.save as jest.Mock).mockImplementation((ach) =>
      Promise.resolve(ach),
    );

    const result = await achievementService.updateProgress(
      "user1",
      "achv123",
      60,
    );

    expect(result?.progress).toBe(110);
    expect(result?.status).toBe("COMPLETED");
    expect(mockUserAchievementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 110, status: "COMPLETED" }),
    );
  });

  it("should return null if user achievement is not found", async () => {
    (mockUserAchievementRepo.findOne as jest.Mock).mockResolvedValue(null);

    const result = await achievementService.updateProgress(
      "user1",
      "achv123",
      20,
    );

    expect(result).toBeNull();
    expect(mockUserAchievementRepo.findOne).toHaveBeenCalled();
  });

  it("should reset daily streaks", async () => {
    const mockUserAchievements = [
      {
        progress: 5,
        status: "IN_PROGRESS",
        achievement: { category: "STREAK" },
      },
      {
        progress: 3,
        status: "IN_PROGRESS",
        achievement: { category: "STREAK" },
      },
    ] as UserAchievement[];

    (mockUserAchievementRepo.find as jest.Mock).mockResolvedValue(
      mockUserAchievements,
    );
    (mockUserAchievementRepo.save as jest.Mock).mockImplementation((ach) =>
      Promise.resolve(ach),
    );

    await achievementService.resetDailyStreaks();

    expect(mockUserAchievementRepo.save).toHaveBeenCalledTimes(2);
    expect(mockUserAchievements[0].progress).toBe(0);
    expect(mockUserAchievements[1].progress).toBe(0);
  });
});
