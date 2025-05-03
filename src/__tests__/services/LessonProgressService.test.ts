import { LessonProgressService } from "../../services/LessonProgressService";
import { LessonProgress } from "../../entities/LessonProgress";
import { Lesson } from "../../entities/Lesson";
import { Course } from "../../entities/Course";
import { ProgressStatus } from "../../types/progress";
import {
  StartLessonProgressDto,
  UpdateLessonProgressDto,
  CompleteLessonProgressDto,
} from "../../dto/LessonProgress.dto";
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
}));

describe("LessonProgressService", () => {
  let service: LessonProgressService;
  let mockLesson: Partial<Lesson>;
  let mockCourse: Partial<Course>;
  let mockProgress: Partial<LessonProgress>;

  beforeEach(() => {
    // Create repository mocks
    const lessonProgressRepository = new Repository<LessonProgress>(
      LessonProgress,
      null as any,
    );
    const lessonRepository = new Repository<Lesson>(Lesson, null as any);

    // Initialize service
    service = new LessonProgressService(
      lessonProgressRepository,
      lessonRepository,
    );

    // Create mocks
    mockCourse = {
      id: "course-1",
      title: "Test Course",
      description: "Test Description",
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
      status: ProgressStatus.IN_PROGRESS,
      startedAt: new Date(),
      timeSpent: 0,
      lastInteractionAt: new Date(),
      completionPercentage: 0,
      attempts: 0,
      metadata: {
        capsuleProgress: {},
        exerciseResults: {},
        interactionEvents: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe("startProgress", () => {
    it("debería iniciar una lección correctamente", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      const lessonRepository = service["lessonRepository"];

      (lessonRepository.findOne as jest.Mock).mockResolvedValue(mockLesson);
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(null);
      (lessonProgressRepository.create as jest.Mock).mockReturnValue(
        mockProgress,
      );
      (lessonProgressRepository.save as jest.Mock).mockResolvedValue(
        mockProgress,
      );

      // Ejecutar
      const dto: StartLessonProgressDto = { lessonId: "lesson-1" };
      const result = await service.startProgress("user-1", dto);

      // Verificar
      expect(result).toBeDefined();
      expect(result.status).toBe(ProgressStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
      expect(lessonProgressRepository.save).toHaveBeenCalled();
    });

    it("debería lanzar un error si la lección no existe", async () => {
      // Configurar mocks
      const lessonRepository = service["lessonRepository"];
      (lessonRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      const dto: StartLessonProgressDto = { lessonId: "lesson-1" };
      await expect(service.startProgress("user-1", dto)).rejects.toThrow();
    });
  });

  describe("completeProgress", () => {
    it("debería completar una lección correctamente", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(
        mockProgress,
      );
      (lessonProgressRepository.save as jest.Mock).mockResolvedValue({
        ...mockProgress,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
        completionPercentage: 100,
      });

      // Ejecutar
      const dto: CompleteLessonProgressDto = {
        lessonId: "lesson-1",
        finalTimeSpent: 3600,
      };
      const result = await service.completeProgress("user-1", dto);

      // Verificar
      expect(result).toBeDefined();
      expect(result.status).toBe(ProgressStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(result.completionPercentage).toBe(100);
      expect(lessonProgressRepository.save).toHaveBeenCalled();
    });

    it("debería lanzar un error si el progreso no existe", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      const dto: CompleteLessonProgressDto = {
        lessonId: "lesson-1",
        finalTimeSpent: 3600,
      };
      await expect(service.completeProgress("user-1", dto)).rejects.toThrow();
    });
  });

  describe("updateProgress", () => {
    it("debería actualizar el progreso correctamente", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(
        mockProgress,
      );
      (lessonProgressRepository.save as jest.Mock).mockResolvedValue({
        ...mockProgress,
        completionPercentage: 50,
        timeSpent: 300,
      });

      // Ejecutar
      const dto: UpdateLessonProgressDto = {
        lessonId: "lesson-1",
        completionPercentage: 50,
        timeSpent: 300,
      };
      const result = await service.updateProgress("user-1", dto);

      // Verificar
      expect(result).toBeDefined();
      expect(result.completionPercentage).toBe(50);
      expect(result.timeSpent).toBe(300);
      expect(lessonProgressRepository.save).toHaveBeenCalled();
    });

    it("debería lanzar un error si el progreso no existe", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      const dto: UpdateLessonProgressDto = {
        lessonId: "lesson-1",
        completionPercentage: 50,
        timeSpent: 300,
      };
      await expect(service.updateProgress("user-1", dto)).rejects.toThrow();
    });
  });

  describe("getProgress", () => {
    it("debería obtener el progreso correctamente", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(
        mockProgress,
      );

      // Ejecutar
      const result = await service.getProgress("user-1", "lesson-1");

      // Verificar
      expect(result).toBeDefined();
      expect(result.status).toBe(mockProgress.status);
      expect(result.completionPercentage).toBe(
        mockProgress.completionPercentage,
      );
    });

    it("debería lanzar un error si el progreso no existe", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      await expect(service.getProgress("user-1", "lesson-1")).rejects.toThrow();
    });
  });

  describe("getUserProgress", () => {
    it("debería obtener el progreso del usuario correctamente", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([
        mockProgress,
      ]);

      // Ejecutar
      const result = await service.getUserProgress("user-1");

      // Verificar
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].status).toBe(mockProgress.status);
    });

    it("debería devolver un array vacío si no hay progreso", async () => {
      // Configurar mocks
      const lessonProgressRepository = service["lessonProgressRepository"];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([]);

      // Ejecutar
      const result = await service.getUserProgress("user-1");

      // Verificar
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
