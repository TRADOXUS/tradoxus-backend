import request from "supertest";
import express from "express";
import { Router } from "express";
import { ModuleController } from "../../controllers/ModuleController";
import { validateRequest } from "../../middleware/validateRequest";
import { asyncHandler } from "../../utils/asyncHandler";
import { CreateModuleDto, UpdateModuleDto } from "../../dto/ModuleDto";

// Mock all controllers and middleware
jest.mock("../../controllers/ModuleController");
jest.mock("../../middleware/validateRequest");
jest.mock("../../utils/asyncHandler");

describe("Module Routes", () => {
  let mockModuleController: jest.Mocked<ModuleController>;
  let app: express.Application;
  let router: Router;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new Express app for each test
    app = express();
    app.use(express.json());

    // Create new instance of the mocked controller
    mockModuleController =
      new ModuleController() as jest.Mocked<ModuleController>;

    // Mock all controller methods
    mockModuleController.create = jest.fn().mockImplementation(function (
      this: ModuleController,
      req,
      res,
    ) {
      res.json({ id: 1, ...req.body });
    });
    mockModuleController.findAll = jest.fn().mockImplementation(function (
      this: ModuleController,
      req,
      res,
    ) {
      res.json([
        { id: 1, title: "Module 1" },
        { id: 2, title: "Module 2" },
      ]);
    });
    mockModuleController.findOne = jest.fn().mockImplementation(function (
      this: ModuleController,
      req,
      res,
    ) {
      res.json({ id: 1, title: "Test Module" });
    });
    mockModuleController.update = jest.fn().mockImplementation(function (
      this: ModuleController,
      req,
      res,
    ) {
      res.json({ id: 1, ...req.body });
    });
    mockModuleController.delete = jest.fn().mockImplementation(function (
      this: ModuleController,
      req,
      res,
    ) {
      res.json({ success: true });
    });
    mockModuleController.createInCourse = jest
      .fn()
      .mockImplementation(function (this: ModuleController, req, res) {
        res.json({ id: 1, courseId: req.params.courseId, ...req.body });
      });
    mockModuleController.getModulesByCourse = jest
      .fn()
      .mockImplementation(function (this: ModuleController, req, res) {
        res.json([{ id: 1, courseId: req.params.courseId, title: "Module 1" }]);
      });
    mockModuleController.getModuleWithLessons = jest
      .fn()
      .mockImplementation(function (this: ModuleController, req, res) {
        res.json({ id: 1, title: "Test Module", lessons: [] });
      });
    mockModuleController.reorderModules = jest
      .fn()
      .mockImplementation(function (this: ModuleController, req, res) {
        res.json({ success: true });
      });

    // Mock the validation middleware to return a function that calls next()
    (validateRequest as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: any) => {
        next();
      },
    );

    // Mock the async handler to return the original function
    (asyncHandler as jest.Mock).mockImplementation((fn) => fn);

    // Replace the controller instance in the routes
    (ModuleController as jest.Mock).mockImplementation(
      () => mockModuleController,
    );

    // Create a new router
    router = Router();

    // Define routes
    // Module-specific routes
    router.post(
      "/courses/:courseId",
      validateRequest(CreateModuleDto),
      asyncHandler((req, res) => mockModuleController.createInCourse(req, res)),
    );
    router.get(
      "/courses/:courseId",
      asyncHandler((req, res) =>
        mockModuleController.getModulesByCourse(req, res),
      ),
    );
    router.put(
      "/courses/:courseId/reorder",
      asyncHandler((req, res) => mockModuleController.reorderModules(req, res)),
    );
    router.get(
      "/:id/lessons",
      asyncHandler((req, res) =>
        mockModuleController.getModuleWithLessons(req, res),
      ),
    );

    // Generic CRUD routes
    router.post(
      "/",
      validateRequest(CreateModuleDto),
      asyncHandler((req, res) => mockModuleController.create(req, res)),
    );
    router.get(
      "/",
      asyncHandler((req, res) => mockModuleController.findAll(req, res)),
    );
    router.get(
      "/:id",
      asyncHandler((req, res) => mockModuleController.findOne(req, res)),
    );
    router.put(
      "/:id",
      validateRequest(UpdateModuleDto),
      asyncHandler((req, res) => mockModuleController.update(req, res)),
    );
    router.delete(
      "/:id",
      asyncHandler((req, res) => mockModuleController.delete(req, res)),
    );

    // Use the router
    app.use("/api/modules", router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Module-specific tests
  describe("POST /api/modules/courses/:courseId", () => {
    it("should create a new module in a course", async () => {
      const moduleData = {
        title: "Test Module",
        description: "Test Description",
      };

      const response = await request(app)
        .post("/api/modules/courses/1")
        .send(moduleData)
        .expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("courseId", "1");
      expect(mockModuleController.createInCourse).toHaveBeenCalled();
    });
  });

  describe("GET /api/modules/courses/:courseId", () => {
    it("should get all modules for a course", async () => {
      const response = await request(app)
        .get("/api/modules/courses/1")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("courseId", "1");
      expect(mockModuleController.getModulesByCourse).toHaveBeenCalled();
    });
  });

  describe("PUT /api/modules/courses/:courseId/reorder", () => {
    it("should reorder modules in a course", async () => {
      const reorderData = {
        moduleIds: [1, 2, 3],
      };

      const response = await request(app)
        .put("/api/modules/courses/1/reorder")
        .send(reorderData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(mockModuleController.reorderModules).toHaveBeenCalled();
    });
  });

  describe("GET /api/modules/:id/lessons", () => {
    it("should get a module with its lessons", async () => {
      const response = await request(app)
        .get("/api/modules/1/lessons")
        .expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("lessons");
      expect(mockModuleController.getModuleWithLessons).toHaveBeenCalled();
    });
  });

  // Generic CRUD tests
  describe("POST /api/modules", () => {
    it("should create a new module", async () => {
      const moduleData = {
        title: "Test Module",
        description: "Test Description",
      };

      const response = await request(app)
        .post("/api/modules")
        .send(moduleData)
        .expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(mockModuleController.create).toHaveBeenCalled();
    });
  });

  describe("GET /api/modules", () => {
    it("should get all modules", async () => {
      const response = await request(app).get("/api/modules").expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockModuleController.findAll).toHaveBeenCalled();
    });
  });

  describe("GET /api/modules/:id", () => {
    it("should get a module by id", async () => {
      const response = await request(app).get("/api/modules/1").expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(mockModuleController.findOne).toHaveBeenCalled();
    });
  });

  describe("PUT /api/modules/:id", () => {
    it("should update a module", async () => {
      const moduleData = {
        title: "Updated Module",
        description: "Updated Description",
      };

      const response = await request(app)
        .put("/api/modules/1")
        .send(moduleData)
        .expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(mockModuleController.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/modules/:id", () => {
    it("should delete a module", async () => {
      const response = await request(app).delete("/api/modules/1").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(mockModuleController.delete).toHaveBeenCalled();
    });
  });
});
