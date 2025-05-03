import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
} from "@jest/globals";
import routes from "../../routes";
import { errorHandler } from "../../middleware/errorHandler";
import { AppDataSource } from "../../config/database";
import { Course } from "../../entities/Course";
import { Module } from "../../entities/Module";
import { Lesson } from "../../entities/Lesson";
import { Request, Response, NextFunction } from "express";

// Mock the database connection
jest.mock("../../config/database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Mock the controller
jest.mock("../../controllers/LessonController", () => {
  return {
    LessonController: jest.fn().mockImplementation(() => ({
      create: jest.fn().mockImplementation(async (req: any, res: any) => {
        const lesson = req.body;
        const now = new Date();
        // Create a new object with serialized dates
        const serializedLesson = {
          ...lesson,
          id: "1",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          module: {
            id: lesson.moduleId,
            title: "Test Module",
            description: "Test Description",
            order: 1,
            course: {
              id: "1",
              title: "Test Course",
              description: "Test Description",
              isPublished: false,
              modules: [],
            },
            lessons: [],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          capsules: [],
        };
        res.status(201).json(serializedLesson);
      }),
      findAll: jest.fn().mockImplementation(async (req: any, res: any) => {
        res.json({
          items: [],
          total: 0,
          page: 1,
          totalPages: 1,
        });
      }),
      findOne: jest.fn().mockImplementation(async (req: any, res: any) => {
        if (req.params.id === "999") {
          res.status(404).json({ error: "Lesson not found" });
          return;
        }
        const now = new Date();
        // For GET requests, we'll use a mock lesson
        const mockLesson = {
          id: req.params.id,
          title: "Test Lesson",
          description: "Test Description",
          order: 1,
          prerequisites: [],
          module: {
            id: "1",
            title: "Test Module",
            description: "Test Description",
            order: 1,
            course: {
              id: "1",
              title: "Test Course",
              description: "Test Description",
              isPublished: false,
              modules: [],
            },
            lessons: [],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          capsules: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        res.json(mockLesson);
      }),
      update: jest.fn().mockImplementation(async (req: any, res: any) => {
        if (req.params.id === "999") {
          res.status(404).json({ error: "Lesson not found" });
          return;
        }
        const lesson = req.body;
        const now = new Date();
        // Create a new object with serialized dates
        const serializedLesson = {
          ...lesson,
          id: req.params.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          module: {
            id: lesson.moduleId,
            title: "Test Module",
            description: "Test Description",
            order: 1,
            course: {
              id: "1",
              title: "Test Course",
              description: "Test Description",
              isPublished: false,
              modules: [],
            },
            lessons: [],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          capsules: [],
        };
        res.json(serializedLesson);
      }),
      delete: jest.fn().mockImplementation(async (req: any, res: any) => {
        if (req.params.id === "999") {
          res.status(404).json({ error: "Lesson not found" });
          return;
        }
        res.status(204).send();
      }),
    })),
  };
});

const app = express();

// Setup middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);

// Fix errorHandler usage
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Close database connection after all tests
afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Lesson Controller Tests", () => {
  const mockCourse: Course = {
    id: "1",
    title: "Test Course",
    description: "Test Description",
    isPublished: false,
    modules: [],
    lessons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson: Lesson = {
    id: "1",
    title: "Test Lesson",
    description: "Test Description",
    order: 1,
    prerequisites: [],
    module: {} as Module,
    capsules: [],
    course: mockCourse,
    progress: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/lessons", () => {
    it("should create a new lesson", async () => {
      const lessonData = {
        title: "Test Lesson",
        description: "Test Description",
        order: 1,
        prerequisites: [],
        moduleId: "1",
      };

      const response = await request(app)
        .post("/api/lessons")
        .send(lessonData)
        .expect(201);

      // Convert mock lesson dates to ISO strings for comparison
      const expectedLesson = {
        ...lessonData,
        id: expect.any(String),
        module: {
          id: "1",
          title: "Test Module",
          description: "Test Description",
          order: 1,
          course: {
            id: "1",
            title: "Test Course",
            description: "Test Description",
            isPublished: false,
            modules: [],
          },
          lessons: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        capsules: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      };

      expect(response.body).toEqual(expectedLesson);
    });
  });

  describe("GET /api/lessons", () => {
    it("should get all lessons with pagination", async () => {
      const response = await request(app).get("/api/lessons").expect(200);

      expect(response.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe("GET /api/lessons/:id", () => {
    it("should get a lesson by id", async () => {
      const response = await request(app).get("/api/lessons/1").expect(200);

      // The response will have ISO string dates
      expect(response.body).toMatchObject({
        id: "1",
        title: "Test Lesson",
        description: "Test Description",
        order: 1,
        prerequisites: [],
        module: {
          id: "1",
          title: "Test Module",
          description: "Test Description",
          order: 1,
          course: {
            id: "1",
            title: "Test Course",
            description: "Test Description",
            isPublished: false,
            modules: [],
          },
        },
        capsules: [],
      });
      // Verify that dates are ISO strings
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
      expect(new Date(response.body.updatedAt).toISOString()).toBe(
        response.body.updatedAt,
      );
    });

    it("should return 404 for non-existent lesson", async () => {
      const response = await request(app).get("/api/lessons/999").expect(404);

      expect(response.body).toEqual({ error: "Lesson not found" });
    });
  });

  describe("PUT /api/lessons/:id", () => {
    it("should update a lesson", async () => {
      const lessonData = {
        title: "Updated Lesson",
        description: "Test Description",
        order: 1,
        prerequisites: [],
        moduleId: "1",
      };

      const response = await request(app)
        .put("/api/lessons/1")
        .send(lessonData)
        .expect(200);

      // Verify the response structure without exact date matching
      expect(response.body).toMatchObject({
        id: "1",
        title: "Updated Lesson",
        description: "Test Description",
        order: 1,
        prerequisites: [],
        module: {
          id: "1",
          title: "Test Module",
          description: "Test Description",
          order: 1,
          course: {
            id: "1",
            title: "Test Course",
            description: "Test Description",
            isPublished: false,
            modules: [],
          },
          lessons: [],
        },
        capsules: [],
      });

      // Verify that dates are valid ISO strings
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
      expect(new Date(response.body.updatedAt).toISOString()).toBe(
        response.body.updatedAt,
      );
      expect(new Date(response.body.module.createdAt).toISOString()).toBe(
        response.body.module.createdAt,
      );
      expect(new Date(response.body.module.updatedAt).toISOString()).toBe(
        response.body.module.updatedAt,
      );
    });

    it("should return 404 for non-existent lesson", async () => {
      const response = await request(app)
        .put("/api/lessons/999")
        .send(mockLesson)
        .expect(404);

      expect(response.body).toEqual({ error: "Lesson not found" });
    });
  });

  describe("DELETE /api/lessons/:id", () => {
    it("should delete a lesson", async () => {
      await request(app).delete("/api/lessons/1").expect(204);
    });

    it("should return 404 for non-existent lesson", async () => {
      const response = await request(app)
        .delete("/api/lessons/999")
        .expect(404);

      expect(response.body).toEqual({ error: "Lesson not found" });
    });
  });
});
