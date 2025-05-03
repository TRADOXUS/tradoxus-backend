import { AnalyticsService } from "../../services/AnalyticsService";
import { LessonProgress } from "../../entities/LessonProgress";
import { Lesson } from "../../entities/Lesson";
import { Course } from "../../entities/Course";
import { ProgressStatus } from "../../types/progress";
import { Repository } from "typeorm";

// Mock de los repositorios
jest.mock("typeorm", () => ({
  Repository: jest.fn().mockImplementation(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  })),
  PrimaryGeneratedColumn: jest.fn(),
  Column: jest.fn(),
  Entity: jest.fn(),
  ManyToOne: jest.fn(),
  OneToMany: jest.fn(),
  CreateDateColumn: jest.fn(),
  UpdateDateColumn: jest.fn(),
  DeleteDateColumn: jest.fn(),
  In: jest.fn().mockImplementation((values) => values),
}));

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockCourse: Partial<Course>;
  let mockLesson: Partial<Lesson>;
  let mockProgress: Partial<LessonProgress>;
  let lessonProgressRepository: Repository<LessonProgress>;
  let courseRepository: Repository<Course>;

  beforeEach(() => {
    // Create repository mocks
    lessonProgressRepository = new Repository<LessonProgress>(
      LessonProgress,
      null as any,
    );
    courseRepository = new Repository<Course>(Course, null as any);

    // Initialize service
    service = new AnalyticsService(lessonProgressRepository, courseRepository);

    // Create mocks
    mockCourse = {
      id: "course-1",
      title: "Test Course",
      description: "Test Description",
      lessons: [
        {
          id: "lesson-1",
          title: "Test Lesson",
          description: "Test Description",
          order: 1,
          module: null as any,
          capsules: [],
          course: mockCourse as Course,
          progress: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockLesson = {
      id: "lesson-1",
      title: "Test Lesson",
      description: "Test Description",
      course: mockCourse as Course,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgress = {
      id: "progress-1",
      userId: "user-1",
      lesson: mockLesson as Lesson,
      status: ProgressStatus.COMPLETED,
      startedAt: new Date(Date.now() - 3600000), // 1 hora antes
      completedAt: new Date(),
      timeSpent: 3600, // 1 hora en segundos
      lastInteractionAt: new Date(),
      completionPercentage: 100,
      attempts: 1,
      metadata: {
        capsuleProgress: { "capsule-1": true },
        exerciseResults: { "exercise-1": 90 },
        interactionEvents: [
          {
            type: "video_view",
            timestamp: new Date(Date.now() - 1800000),
            data: { duration: 300 },
          },
          {
            type: "quiz_attempt",
            timestamp: new Date(Date.now() - 900000),
            data: { score: 90 },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe("getUserStatistics", () => {
    it("debería obtener estadísticas del usuario correctamente", async () => {
      // Configurar mocks
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([
        mockProgress,
      ]);

      // Ejecutar
      const result = await service.getUserStatistics("user-1");

      // Verificar
      expect(result).toBeDefined();
      expect(result.totalLessons).toBe(1);
      expect(result.completedLessons).toBe(1);
      expect(result.completionRate).toBe(100);
      expect(result.totalTimeSpent).toBe(3600);
    });

    it("debería retornar estadísticas vacías si el usuario no existe", async () => {
      // Configurar mocks
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([]);

      // Ejecutar
      const result = await service.getUserStatistics("user-1");

      // Verificar
      expect(result).toEqual({
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        totalTimeSpent: 0,
        averageCompletionPercentage: 0,
        completionRate: 0,
      });
    });
  });

  describe("getLessonAnalytics", () => {
    it("debería obtener análisis de la lección correctamente", async () => {
      // Configurar mocks
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([
        mockProgress,
      ]);

      // Ejecutar
      const result = await service.getLessonAnalytics("lesson-1");

      // Verificar
      expect(result).toBeDefined();
      expect(result.totalAttempts).toBe(1);
      expect(result.completionRate).toBe(100);
      expect(result.averageTimeSpent).toBe(3600);
    });

    it("debería retornar estadísticas vacías si la lección no existe", async () => {
      // Configurar mocks
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([]);

      // Ejecutar
      const result = await service.getLessonAnalytics("lesson-1");

      // Verificar
      expect(result).toEqual({
        totalAttempts: 0,
        completedAttempts: 0,
        averageTimeSpent: 0,
        averageCompletionPercentage: 0,
        completionRate: 0,
      });
    });
  });

  describe("getCourseCompletionRate", () => {
    it("debería obtener la tasa de finalización del curso correctamente", async () => {
      // Configurar mocks
      (courseRepository.findOne as jest.Mock).mockResolvedValue(mockCourse);
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([
        mockProgress,
      ]);

      // Ejecutar
      const result = await service.getCourseCompletionRate("course-1");

      // Verificar
      expect(result).toBeDefined();
      expect(result.courseId).toBe("course-1");
      expect(result.totalUsers).toBe(1);
      expect(result.fullyCompletedUsers).toBe(1);
      expect(result.averageCompletionRate).toBe(100);
    });

    it("debería lanzar un error si el curso no existe", async () => {
      // Configurar mocks
      (courseRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      await expect(service.getCourseCompletionRate("course-1")).rejects.toThrow(
        "Course not found",
      );
    });
  });

  describe("bulkUpdateProgress", () => {
    it("debería actualizar el progreso en masa correctamente", async () => {
      // Configurar mocks
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(
        mockProgress,
      );
      (lessonProgressRepository.save as jest.Mock).mockResolvedValue(
        mockProgress,
      );

      // Ejecutar
      const updates = [
        {
          userId: "user-1",
          lessonId: "lesson-1",
          completionPercentage: 100,
          timeSpent: 3600,
        },
      ];
      const result = await service.bulkUpdateProgress(updates);

      // Verificar
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(lessonProgressRepository.save).toHaveBeenCalled();
    });
  });

  describe("getBulkStatus", () => {
    it("debería obtener el estado en masa correctamente", async () => {
      // Configurar mocks
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([
        mockProgress,
      ]);

      // Ejecutar
      const userIds = ["user-1"];
      const lessonIds = ["lesson-1"];
      const result = await service.getBulkStatus(userIds, lessonIds);

      // Verificar
      expect(result).toBeDefined();
      expect(result["user-1"]).toBeDefined();
      expect(result["user-1"]["lesson-1"]).toBeDefined();
      expect(result["user-1"]["lesson-1"].status).toBe(
        ProgressStatus.COMPLETED,
      );
    });
  });
});
