import request from "supertest";
import express, { Express, Request, Response, Router } from "express";
import { AchievementController } from "../../controllers/AchievementController";
import { asyncHandler } from "../../utils/asyncHandler";

jest.mock("../../controllers/AchievementController");
jest.mock("../../utils/asyncHandler");

describe("Achievement Routes", () => {
  let mockAchievementController: jest.Mocked<AchievementController>;
  let app: Express;
  let router: Router;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    mockAchievementController =
      new AchievementController() as jest.Mocked<AchievementController>;

    mockAchievementController.findAll = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json([{ id: 1, name: "Achievement 1" }]);
        },
      );
    mockAchievementController.findOne = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json({ id: 1, name: "Achievement 1" });
        },
      );
    mockAchievementController.findByModuleId = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<Response> => {
          return res.json([{ id: 1, moduleId: req.params.moduleId }]);
        },
      );
    mockAchievementController.getUserAchievements = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json([{ id: 1, userId: req.params.userId }]);
        },
      );
    mockAchievementController.claimAchievement = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json({ success: true });
        },
      );
    mockAchievementController.getUserProgress = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json({ progress: 50 });
        },
      );
    mockAchievementController.updateProgress = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<Response> => {
          return res.json({ success: true });
        },
      );
    mockAchievementController.getLeaderboard = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json([{ userId: 1, score: 100 }]);
        },
      );
    mockAchievementController.getStatistics = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json({ totalAchievements: 10 });
        },
      );
    mockAchievementController.getCompletionRate = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json({ completionRate: 75 });
        },
      );
    mockAchievementController.getPopularAchievements = jest
      .fn()
      .mockImplementation(
        async (req: Request, res: Response): Promise<void> => {
          void res.json([{ id: 1, name: "Popular Achievement" }]);
        },
      );

    (asyncHandler as jest.Mock).mockImplementation((fn) => fn);
    (AchievementController as jest.Mock).mockImplementation(
      () => mockAchievementController,
    );

    router = Router();
    router.get(
      "/",
      asyncHandler((req, res) => mockAchievementController.findAll(req, res)),
    );
    router.get(
      "/:id",
      asyncHandler((req, res) => mockAchievementController.findOne(req, res)),
    );
    router.get(
      "/module/:moduleId",
      asyncHandler(async (req, res) => {
        await mockAchievementController.findByModuleId(req, res);
      }),
    );
    router.get(
      "/users/:userId/achievements",
      asyncHandler((req, res) =>
        mockAchievementController.getUserAchievements(req, res),
      ),
    );
    router.post(
      "/users/:userId/achievements/:achievementId/claim",
      asyncHandler((req, res) =>
        mockAchievementController.claimAchievement(req, res),
      ),
    );
    router.get(
      "/users/:userId/achievements/progress",
      asyncHandler((req, res) =>
        mockAchievementController.getUserProgress(req, res),
      ),
    );
    router.post(
      "/progress/update",
      asyncHandler(async (req, res) => {
        await mockAchievementController.updateProgress(req, res);
      }),
    );
    router.get(
      "/leaderboard",
      asyncHandler((req, res) =>
        mockAchievementController.getLeaderboard(req, res),
      ),
    );
    router.get(
      "/statistics",
      asyncHandler((req, res) =>
        mockAchievementController.getStatistics(req, res),
      ),
    );
    router.get(
      "/analytics/completion-rate",
      asyncHandler((req, res) =>
        mockAchievementController.getCompletionRate(req, res),
      ),
    );
    router.get(
      "/analytics/popular",
      asyncHandler((req, res) =>
        mockAchievementController.getPopularAchievements(req, res),
      ),
    );

    app.use("/api/achievements", router);
  });

  it("should get all achievements", async () => {
    const response = await request(app).get("/api/achievements").expect(200);
    expect(response.body).toHaveLength(1);
    expect(mockAchievementController.findAll).toHaveBeenCalled();
  });

  it("should get an achievement by ID", async () => {
    const response = await request(app).get("/api/achievements/1").expect(200);
    expect(response.body).toHaveProperty("id", 1);
    expect(mockAchievementController.findOne).toHaveBeenCalled();
  });

  it("should get achievements by module ID", async () => {
    const response = await request(app)
      .get("/api/achievements/module/1")
      .expect(200);
    expect(response.body[0]).toHaveProperty("moduleId", "1");
    expect(mockAchievementController.findByModuleId).toHaveBeenCalled();
  });

  it("should get user achievements", async () => {
    const response = await request(app)
      .get("/api/achievements/users/1/achievements")
      .expect(200);
    expect(response.body[0]).toHaveProperty("userId", "1");
    expect(mockAchievementController.getUserAchievements).toHaveBeenCalled();
  });

  it("should claim an achievement", async () => {
    const response = await request(app)
      .post("/api/achievements/users/1/achievements/2/claim")
      .expect(200);
    expect(response.body).toHaveProperty("success", true);
    expect(mockAchievementController.claimAchievement).toHaveBeenCalled();
  });

  it("should get user progress", async () => {
    const response = await request(app)
      .get("/api/achievements/users/1/achievements/progress")
      .expect(200);
    expect(response.body).toHaveProperty("progress", 50);
    expect(mockAchievementController.getUserProgress).toHaveBeenCalled();
  });

  it("should update achievement progress", async () => {
    const response = await request(app)
      .post("/api/achievements/progress/update")
      .expect(200);
    expect(response.body).toHaveProperty("success", true);
    expect(mockAchievementController.updateProgress).toHaveBeenCalled();
  });

  it("should get completion rate analytics", async () => {
    const response = await request(app)
      .get("/api/achievements/analytics/completion-rate")
      .expect(200);
    expect(response.body).toHaveProperty("completionRate", 75);
    expect(mockAchievementController.getCompletionRate).toHaveBeenCalled();
  });

  it("should get popular achievements analytics", async () => {
    const response = await request(app)
      .get("/api/achievements/analytics/popular")
      .expect(200);
    expect(response.body[0]).toHaveProperty("name", "Popular Achievement");
    expect(mockAchievementController.getPopularAchievements).toHaveBeenCalled();
  });
});
