import { AnalyticsService } from '../../services/AnalyticsService';
import { LessonProgress } from '../../entities/LessonProgress';
import { User } from '../../entities/User';
import { Lesson } from '../../entities/Lesson';
import { Course } from '../../entities/Course';
import { AppError } from '../../utils/AppError';
import { ProgressStatus, UserStatistics, LessonAnalytics, CourseCompletionRate, BulkProgressUpdate, BulkProgressStatus } from '../../types/progress';

// Mock de los repositorios
jest.mock('../../repositories/LessonProgressRepository', () => ({
  LessonProgressRepository: jest.fn().mockImplementation(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  })),
}));

jest.mock('../../repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findOne: jest.fn(),
  })),
}));

jest.mock('../../repositories/LessonRepository', () => ({
  LessonRepository: jest.fn().mockImplementation(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
  })),
}));

jest.mock('../../repositories/CourseRepository', () => ({
  CourseRepository: jest.fn().mockImplementation(() => ({
    findOne: jest.fn(),
  })),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockUser: Partial<User>;
  let mockLesson: Partial<Lesson>;
  let mockCourse: Partial<Course>;
  let mockProgress: Partial<LessonProgress>;

  beforeEach(() => {
    // Create repository mocks
    const lessonProgressRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const courseRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    // Initialize service
    service = new AnalyticsService(
      lessonProgressRepository as any,
      courseRepository as any
    );

    // Create mocks
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashedPassword',
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      lessonProgress: []
    };

    mockCourse = {
      id: 'course-1',
      title: 'Test Course',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockLesson = {
      id: 'lesson-1',
      title: 'Test Lesson',
      description: 'Test Description',
      course: mockCourse as Course,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgress = {
      id: 'progress-1',
      userId: 'user-1',
      lesson: mockLesson as Lesson,
      status: ProgressStatus.COMPLETED,
      startedAt: new Date(Date.now() - 3600000), // 1 hora antes
      completedAt: new Date(),
      timeSpent: 3600, // 1 hora en segundos
      lastInteractionAt: new Date(),
      completionPercentage: 100,
      attempts: 1,
      metadata: {
        capsuleProgress: { 'capsule-1': true },
        exerciseResults: { 'exercise-1': 90 },
        interactionEvents: [
          { type: 'video_view', timestamp: new Date(Date.now() - 1800000), data: { duration: 300 } },
          { type: 'quiz_attempt', timestamp: new Date(Date.now() - 900000), data: { score: 90 } },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('getUserStatistics', () => {
    it('debería obtener estadísticas del usuario correctamente', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([mockProgress]);

      // Ejecutar
      const result = await service.getUserStatistics('user-1');

      // Verificar
      expect(result).toBeDefined();
      expect(result.totalLessons).toBe(1);
      expect(result.completedLessons).toBe(1);
      expect(result.completionRate).toBe(100);
      expect(result.totalTimeSpent).toBe(3600);
    });

    it('debería lanzar un error si el usuario no existe', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([]);

      // Ejecutar y verificar
      await expect(service.getUserStatistics('user-1')).rejects.toThrow();
    });
  });

  describe('getLessonAnalytics', () => {
    it('debería obtener análisis de la lección correctamente', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([mockProgress]);

      // Ejecutar
      const result = await service.getLessonAnalytics('lesson-1');

      // Verificar
      expect(result).toBeDefined();
      expect(result.totalAttempts).toBe(1);
      expect(result.completionRate).toBe(100);
      expect(result.averageTimeSpent).toBe(3600);
    });

    it('debería lanzar un error si la lección no existe', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([]);

      // Ejecutar y verificar
      await expect(service.getLessonAnalytics('lesson-1')).rejects.toThrow();
    });
  });

  describe('getCourseCompletionRate', () => {
    it('debería obtener la tasa de finalización del curso correctamente', async () => {
      // Configurar mocks
      const courseRepository = service['courseRepository'];
      const lessonProgressRepository = service['lessonProgressRepository'];

      (courseRepository.findOne as jest.Mock).mockResolvedValue(mockCourse);
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([mockProgress]);

      // Ejecutar
      const result = await service.getCourseCompletionRate('course-1');

      // Verificar
      expect(result).toBeDefined();
      expect(result.courseId).toBe('course-1');
      expect(result.totalUsers).toBe(1);
      expect(result.fullyCompletedUsers).toBe(1);
      expect(result.averageCompletionRate).toBe(100);
    });

    it('debería lanzar un error si el curso no existe', async () => {
      // Configurar mocks
      const courseRepository = service['courseRepository'];
      (courseRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecutar y verificar
      await expect(service.getCourseCompletionRate('course-1')).rejects.toThrow();
    });
  });

  describe('bulkUpdateProgress', () => {
    it('debería actualizar el progreso en masa correctamente', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.save as jest.Mock).mockResolvedValue([mockProgress]);

      // Ejecutar
      const updates: BulkProgressUpdate[] = [
        { userId: 'user-1', lessonId: 'lesson-1', completionPercentage: 100, timeSpent: 3600 },
      ];
      const result = await service.bulkUpdateProgress(updates);

      // Verificar
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(lessonProgressRepository.save).toHaveBeenCalled();
    });
  });

  describe('getBulkStatus', () => {
    it('debería obtener el estado en masa correctamente', async () => {
      // Configurar mocks
      const lessonProgressRepository = service['lessonProgressRepository'];
      (lessonProgressRepository.find as jest.Mock).mockResolvedValue([mockProgress]);

      // Ejecutar
      const userIds = ['user-1'];
      const lessonIds = ['lesson-1'];
      const result = await service.getBulkStatus(userIds, lessonIds);

      // Verificar
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].lessonId).toBe('lesson-1');
      expect(result[0].status).toBe(ProgressStatus.COMPLETED);
    });
  });
}); 