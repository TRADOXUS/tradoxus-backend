import { CourseService } from '../../services/CourseService';
import { Course } from '../../entities/Course';
import { Module } from '../../entities/Module';
import { AppDataSource } from '../../config/database';

// Mock the database connection and repositories
jest.mock('../../config/database', () => ({
    AppDataSource: {
        createQueryRunner: jest.fn(),
        getRepository: jest.fn()
    }
}));

describe('CourseService', () => {
    let courseService: CourseService;
    let mockRepository: any;
    let mockQueryRunner: any;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock repository
        mockRepository = {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
            create: jest.fn()
        };

        // Setup mock query runner
        mockQueryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                update: jest.fn()
            }
        };

        // Setup AppDataSource mock
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
        (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

        courseService = new CourseService();
    });

    describe('getCourseWithModules', () => {
        it('should return a course with its modules', async () => {
            const mockCourse = {
                id: '1',
                title: 'Test Course',
                modules: []
            };

            mockRepository.findOne.mockResolvedValue(mockCourse);

            const result = await courseService.getCourseWithModules('1');

            expect(result).toEqual(mockCourse);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['modules']
            });
        });

        it('should return null when course is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await courseService.getCourseWithModules('1');

            expect(result).toBeNull();
        });
    });

    describe('togglePublish', () => {
        it('should toggle course publish status', async () => {
            const mockCourse = {
                id: '1',
                title: 'Test Course',
                isPublished: false
            };

            mockRepository.findOneBy.mockResolvedValue(mockCourse);
            mockRepository.save.mockResolvedValue({ ...mockCourse, isPublished: true });

            const result = await courseService.togglePublish('1');

            expect(result?.isPublished).toBe(true);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should return null when course is not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);

            const result = await courseService.togglePublish('1');

            expect(result).toBeNull();
        });
    });

    describe('getPublishedCourses', () => {
        it('should return published courses with pagination', async () => {
            const mockCourses = [
                { id: '1', title: 'Course 1' },
                { id: '2', title: 'Course 2' }
            ];

            mockRepository.findAndCount.mockResolvedValue([mockCourses, 2]);

            const result = await courseService.getPublishedCourses(1, 10);

            expect(result.items).toEqual(mockCourses);
            expect(result.total).toBe(2);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: { isPublished: true },
                skip: 0,
                take: 10,
                order: { createdAt: 'DESC' }
            });
        });
    });

    describe('reorderModules', () => {
        it('should reorder modules successfully', async () => {
            const moduleOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });

            const result = await courseService.reorderModules('courseId', moduleOrders);

            expect(result).toBe(true);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during reordering', async () => {
            const moduleOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockRejectedValue(new Error('Database error'));

            const result = await courseService.reorderModules('courseId', moduleOrders);

            expect(result).toBe(false);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });
}); 