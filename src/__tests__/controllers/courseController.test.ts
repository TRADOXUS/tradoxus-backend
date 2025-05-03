import request from "supertest";
import express from "express";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { errorHandler } from "../../middleware/errorHandler";
import { CourseService } from "../../services/CourseService";
import { Course } from "../../entities/Course";
import { CourseController } from "../../controllers/CourseController";
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

// Mock the database connection
jest.mock("../../config/database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Mock the services
jest.mock("../../services/CourseService", () => {
  return {
    CourseService: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getCourseWithModules: jest.fn(),
      togglePublish: jest.fn(),
      getPublishedCourses: jest.fn(),
    })),
  };
});

describe("Course Controller Tests", () => {
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

  let courseService: jest.Mocked<CourseService>;
  let courseController: CourseController;
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    courseService = new CourseService() as jest.Mocked<CourseService>;
    courseController = new CourseController(courseService);

    // Create a new Express app for each test
    app = express();
    app.use(express.json());

    // Set up routes with our mocked controller
    const router = Router();
    router.post(
      "/courses",
      asyncHandler((req, res) => courseController.create(req, res)),
    );
    router.get(
      "/courses",
      asyncHandler((req, res) => courseController.findAll(req, res)),
    );
    router.get(
      "/courses/published",
      asyncHandler((req, res) =>
        courseController.getPublishedCourses(req, res),
      ),
    );
    router.get(
      "/courses/:id",
      asyncHandler((req, res) => courseController.findOne(req, res)),
    );
    router.put(
      "/courses/:id",
      asyncHandler((req, res) => courseController.update(req, res)),
    );
    router.delete(
      "/courses/:id",
      asyncHandler((req, res) => courseController.delete(req, res)),
    );
    router.get(
      "/courses/:id/modules",
      asyncHandler((req, res) =>
        courseController.getCourseWithModules(req, res),
      ),
    );
    router.patch(
      "/courses/:id/toggle-publish",
      asyncHandler((req, res) => courseController.togglePublish(req, res)),
    );

    app.use("/api", router);
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        errorHandler(err, req, res, next);
      },
    );

    // Reset mock implementations
    courseService.create.mockImplementation(async (data: any) => ({
      id: "1",
      title: data?.title || "Test Course",
      description: data?.description || "Test Description",
      isPublished: false,
      modules: [],
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    courseService.findAll.mockImplementation(async () => ({
      items: [
        {
          id: "1",
          title: "Test Course",
          description: "Test Description",
          isPublished: false,
          modules: [],
          lessons: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    }));

    courseService.findOne.mockImplementation(async (id: any) => {
      if (id === "999") return null;
      return {
        id: id || "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    courseService.update.mockImplementation(async (id: any, data: any) => {
      if (id === "999") return null;
      return {
        id: id || "1",
        title: data?.title || "Test Course",
        description: data?.description || "Test Description",
        isPublished: data?.isPublished || false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    courseService.delete.mockImplementation(async (id: any) => {
      if (id === "999") return false;
      return true;
    });

    courseService.getCourseWithModules.mockImplementation(async (id: any) => {
      if (id === "999") return null;
      return {
        id: id || "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    courseService.togglePublish.mockImplementation(async (id: any) => {
      if (id === "999") return null;
      return {
        id: id || "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: true,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    courseService.getPublishedCourses.mockImplementation(async () => ({
      items: [
        {
          id: "1",
          title: "Test Course",
          description: "Test Description",
          isPublished: true,
          modules: [],
          lessons: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    }));
  });

  describe("POST /api/courses", () => {
    it("should create a new course", async () => {
      const mockResponse = {
        id: "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      courseService.create.mockImplementation(async () => mockResponse);

      const response = await request(app)
        .post("/api/courses")
        .send(mockResponse)
        .expect(201);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toMatchObject({
        id: mockResponse.id,
        title: mockResponse.title,
        description: mockResponse.description,
        isPublished: mockResponse.isPublished,
        modules: mockResponse.modules,
        lessons: mockResponse.lessons,
      });
      expect(new Date(responseBody.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data.updatedAt)).toBeInstanceOf(Date);
    });

    it("should handle errors when creating a course", async () => {
      courseService.create.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/api/courses")
        .send(mockCourse)
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to create course",
      });
    });
  });

  describe("GET /api/courses", () => {
    it("should get all courses with pagination", async () => {
      const mockResponse = {
        items: [
          {
            id: "1",
            title: "Test Course",
            description: "Test Description",
            isPublished: false,
            modules: [],
            lessons: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      };
      courseService.findAll.mockImplementation(async () => mockResponse);

      const response = await request(app).get("/api/courses").expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toHaveLength(1);
      expect(responseBody.data[0]).toMatchObject({
        id: mockResponse.items[0].id,
        title: mockResponse.items[0].title,
        description: mockResponse.items[0].description,
        isPublished: mockResponse.items[0].isPublished,
        modules: mockResponse.items[0].modules,
        lessons: mockResponse.items[0].lessons,
      });
      expect(new Date(responseBody.data[0].createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data[0].updatedAt)).toBeInstanceOf(Date);
      expect(responseBody.pagination).toEqual({
        total: mockResponse.total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should handle errors when fetching courses", async () => {
      courseService.findAll.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/api/courses").expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to fetch courses",
      });
    });
  });

  describe("GET /api/courses/:id", () => {
    it("should get a course by id", async () => {
      const mockResponse = {
        id: "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      courseService.findOne.mockImplementation(async (id) => {
        if (id === "999") return null;
        return mockResponse;
      });

      const response = await request(app).get("/api/courses/1").expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toMatchObject({
        id: mockResponse.id,
        title: mockResponse.title,
        description: mockResponse.description,
        isPublished: mockResponse.isPublished,
        modules: mockResponse.modules,
        lessons: mockResponse.lessons,
      });
      expect(new Date(responseBody.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data.updatedAt)).toBeInstanceOf(Date);
    });

    it("should return 404 for non-existent course", async () => {
      courseService.findOne.mockImplementation(async () => null);

      const response = await request(app).get("/api/courses/999").expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Course not found",
      });
    });

    it("should handle errors when fetching a course", async () => {
      courseService.findOne.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/api/courses/1").expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to fetch course",
      });
    });
  });

  describe("PUT /api/courses/:id", () => {
    it("should update a course", async () => {
      const mockResponse = {
        id: "1",
        title: "Updated Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      courseService.update.mockImplementation(async (id) => {
        if (id === "999") return null;
        return mockResponse;
      });

      const response = await request(app)
        .put("/api/courses/1")
        .send(mockResponse)
        .expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toMatchObject({
        id: mockResponse.id,
        title: mockResponse.title,
        description: mockResponse.description,
        isPublished: mockResponse.isPublished,
        modules: mockResponse.modules,
        lessons: mockResponse.lessons,
      });
      expect(new Date(responseBody.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data.updatedAt)).toBeInstanceOf(Date);
    });

    it("should return 404 for non-existent course", async () => {
      courseService.update.mockImplementation(async () => null);

      const response = await request(app)
        .put("/api/courses/999")
        .send(mockCourse)
        .expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Course not found",
      });
    });

    it("should handle errors when updating a course", async () => {
      courseService.update.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .put("/api/courses/1")
        .send(mockCourse)
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to update course",
      });
    });
  });

  describe("DELETE /api/courses/:id", () => {
    it("should delete a course", async () => {
      courseService.delete.mockImplementation(async (id) => {
        if (id === "999") return false;
        return true;
      });

      await request(app).delete("/api/courses/1").expect(204);
    });

    it("should return 404 for non-existent course", async () => {
      courseService.delete.mockImplementation(async () => false);

      const response = await request(app)
        .delete("/api/courses/999")
        .expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Course not found",
      });
    });

    it("should handle errors when deleting a course", async () => {
      courseService.delete.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app).delete("/api/courses/1").expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to delete course",
      });
    });
  });

  describe("GET /api/courses/:id/modules", () => {
    it("should get course with modules", async () => {
      const mockResponse = {
        id: "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      courseService.getCourseWithModules.mockImplementation(async (id) => {
        if (id === "999") return null;
        return mockResponse;
      });

      const response = await request(app)
        .get("/api/courses/1/modules")
        .expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toMatchObject({
        id: mockResponse.id,
        title: mockResponse.title,
        description: mockResponse.description,
        isPublished: mockResponse.isPublished,
        modules: mockResponse.modules,
        lessons: mockResponse.lessons,
      });
      expect(new Date(responseBody.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data.updatedAt)).toBeInstanceOf(Date);
    });

    it("should return 404 for non-existent course", async () => {
      courseService.getCourseWithModules.mockImplementation(async () => null);

      const response = await request(app)
        .get("/api/courses/999/modules")
        .expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Course not found",
      });
    });

    it("should handle errors when fetching course with modules", async () => {
      courseService.getCourseWithModules.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .get("/api/courses/1/modules")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to fetch course with modules",
      });
    });
  });

  describe("PATCH /api/courses/:id/toggle-publish", () => {
    it("should toggle course publish status", async () => {
      const mockResponse = {
        id: "1",
        title: "Test Course",
        description: "Test Description",
        isPublished: true,
        modules: [],
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      courseService.togglePublish.mockImplementation(async (id) => {
        if (id === "999") return null;
        return mockResponse;
      });

      const response = await request(app)
        .patch("/api/courses/1/toggle-publish")
        .expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toMatchObject({
        id: mockResponse.id,
        title: mockResponse.title,
        description: mockResponse.description,
        isPublished: mockResponse.isPublished,
        modules: mockResponse.modules,
        lessons: mockResponse.lessons,
      });
      expect(new Date(responseBody.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data.updatedAt)).toBeInstanceOf(Date);
    });

    it("should return 404 for non-existent course", async () => {
      courseService.togglePublish.mockImplementation(async () => null);

      const response = await request(app)
        .patch("/api/courses/999/toggle-publish")
        .expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Course not found",
      });
    });

    it("should handle errors when toggling course publish status", async () => {
      courseService.togglePublish.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .patch("/api/courses/1/toggle-publish")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to toggle course publish status",
      });
    });
  });

  describe("GET /api/courses/published", () => {
    it("should get published courses with pagination", async () => {
      const mockResponse = {
        items: [
          {
            id: "1",
            title: "Test Course",
            description: "Test Description",
            isPublished: true,
            modules: [],
            lessons: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      };
      courseService.getPublishedCourses.mockImplementation(
        async () => mockResponse,
      );

      const response = await request(app)
        .get("/api/courses/published")
        .expect(200);

      const responseBody = response.body;
      expect(responseBody.status).toBe("success");
      expect(responseBody.data).toHaveLength(1);
      expect(responseBody.data[0]).toMatchObject({
        id: mockResponse.items[0].id,
        title: mockResponse.items[0].title,
        description: mockResponse.items[0].description,
        isPublished: mockResponse.items[0].isPublished,
        modules: mockResponse.items[0].modules,
        lessons: mockResponse.items[0].lessons,
      });
      expect(new Date(responseBody.data[0].createdAt)).toBeInstanceOf(Date);
      expect(new Date(responseBody.data[0].updatedAt)).toBeInstanceOf(Date);
      expect(responseBody.pagination).toEqual({
        total: mockResponse.total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should handle errors when fetching published courses", async () => {
      courseService.getPublishedCourses.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .get("/api/courses/published")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to fetch published courses",
      });
    });
  });
});
