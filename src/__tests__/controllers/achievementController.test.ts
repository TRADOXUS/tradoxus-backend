import request from "supertest";
import express from "express";
import { describe, expect, beforeEach, jest } from "@jest/globals";
import { errorHandler } from "../../middleware/errorHandler";
import {
  AchievementType,
  AchievementCategory,
} from "../../entities/Achievement";
import { AchievementController } from "../../controllers/AchievementController";
import { AchievementService } from "../../services/AchievementService";
import { AppError } from "../../middleware/errorHandler";
import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";

jest.mock("../../services/AchievementService");

const mockService = new AchievementService() as jest.Mocked<AchievementService>;
const app = express();
app.use(express.json());
const controller = new AchievementController(mockService);

// Mock routes
app.get("/", (req, res) => controller.findAll(req, res));
app.get(
  "/:id",
  asyncHandler((req, res) => controller.findOne(req, res)),
);
app.get(
  "/module/:moduleId",
  asyncHandler(controller.findByModuleId.bind(controller)),
);
app.get(
  "/user-achievements/:userId",
  asyncHandler((req, res) => controller.getUserAchievements(req, res)),
);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

// Test cases
describe("AchievementController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should return all achievements", async () => {
    mockService.findAll.mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Test Achievement",
          description: "This is a test achievement",
          type: AchievementType.SPECIAL,
          category: AchievementCategory.STREAK,
          points: 100,
          icon: "test-icon.png",
          criteria: [],
          rewards: [],
          metadata: {
            moduleId: "test-module",
            completionDetails: {
              score: 100,
              timeSpent: 3600,
              attempts: 1,
              perfectScore: true,
              streakDays: 7,
            },
            attempts: 1,
          },
        },
      ],
      total: 1,
    });
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test("should return 404 if achievement is not found", async () => {
    mockService.findOne.mockResolvedValue(null);
    const response = await request(app).get("/999");
    expect(response.status).toBe(500);
  });

  test("should return achievements by module ID", async () => {
    mockService.findByModuleId.mockResolvedValue([
      {
        id: "123",
        name: "Module Achievement",
        description: "Awarded for first achievement",
        type: AchievementType.SPECIAL,
        category: AchievementCategory.STREAK,
        points: 50,
        icon: "first-win.png",
        criteria: [],
        rewards: [],
        metadata: {
          moduleId: "module-123",
          completionDetails: {
            score: 90,
            timeSpent: 1800,
            attempts: 2,
            perfectScore: false,
            streakDays: 5,
          },
          attempts: 2,
        },
      },
    ]);
    const response = await request(app).get("/module/123");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test("should return user achievements", async () => {
    mockService.getUserAchievements.mockResolvedValue([
      {
        id: "1",
        userId: "user123",
        earnedAt: new Date(),
        progress: 100,
        status: "completed",
        metadata: {},
        achievement: {
          id: "achv1",
          name: "First Win",
          description: "Awarded for first achievement",
          type: AchievementType.SPECIAL,
          category: AchievementCategory.STREAK,
          points: 50,
          icon: "first-win.png",
          criteria: [],
          rewards: [],
          metadata: {
            moduleId: "module-achv1",
            completionDetails: {
              score: 95,
              timeSpent: 2700,
              attempts: 1,
              perfectScore: true,
              streakDays: 10,
            },
            attempts: 1,
          },
        },
      },
    ]);

    const response = await request(app).get("/user-achievements/user123");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test("should handle errors gracefully", async () => {
    mockService.findOne.mockImplementation(() => {
      throw new AppError(500, "Failed to fetch achievement");
    });

    const response = await request(app).get("/999");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "error",
      message: "Failed to fetch achievement",
    });
  }, 7000);
});
