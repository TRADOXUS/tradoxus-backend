import { ModuleService } from '../../services/ModuleService';
import { AppDataSource } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// Mock the database connection and repositories
jest.mock('../../config/database', () => ({
    AppDataSource: {
        createQueryRunner: jest.fn(),
        getRepository: jest.fn()
    }
}));

describe('ModuleService', () => {
    let moduleService: ModuleService;
    let mockRepository: any;
    let mockCourseRepository: any;
    let mockQueryRunner: any;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock repositories
        mockRepository = {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
            create: jest.fn()
        };

        mockCourseRepository = {
            findOne: jest.fn(),
            findOneBy: jest.fn()
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
        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity.name === 'Module') return mockRepository;
            if (entity.name === 'Course') return mockCourseRepository;
            return {};
        });
        (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

        moduleService = new ModuleService();
    });

    describe('createInCourse', () => {
        it('should create a module in a course', async () => {
            const mockCourse = {
                id: '1',
                title: 'Test Course'
            };

            const moduleData = {
                title: 'Test Module',
                order: 1
            };

            mockCourseRepository.findOne.mockResolvedValue(mockCourse);
            mockRepository.create.mockReturnValue({ ...moduleData, course: mockCourse });
            mockRepository.save.mockResolvedValue({ ...moduleData, course: mockCourse, id: '1' });

            const result = await moduleService.createInCourse('1', moduleData);

            expect(result).toBeDefined();
            expect(result.course).toEqual(mockCourse);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when course is not found', async () => {
            mockCourseRepository.findOneBy.mockResolvedValue(null);

            await expect(moduleService.createInCourse('1', { title: 'Test Module' }))
                .rejects
                .toThrow(AppError);
        });
    });

    describe('getModulesByCourse', () => {
        it('should return modules for a course with pagination', async () => {
            const mockModules = [
                { id: '1', title: 'Module 1' },
                { id: '2', title: 'Module 2' }
            ];

            mockRepository.findAndCount.mockResolvedValue([mockModules, 2]);

            const result = await moduleService.getModulesByCourse('courseId', 1, 10);

            expect(result.items).toEqual(mockModules);
            expect(result.total).toBe(2);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: { course: { id: 'courseId' } },
                skip: 0,
                take: 10,
                order: { order: 'ASC' }
            });
        });
    });

    describe('getModuleWithLessons', () => {
        it('should return a module with its lessons', async () => {
            const mockModule = {
                id: '1',
                title: 'Test Module',
                lessons: []
            };

            mockRepository.findOne.mockResolvedValue(mockModule);

            const result = await moduleService.getModuleWithLessons('1');

            expect(result).toEqual(mockModule);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['lessons'],
                order: {
                    lessons: {
                        order: 'ASC'
                    }
                }
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

            const result = await moduleService.reorderModules('courseId', moduleOrders);

            expect(result).toBe(true);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during reordering', async () => {
            const moduleOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockRejectedValue(new Error('Database error'));

            const result = await moduleService.reorderModules('courseId', moduleOrders);

            expect(result).toBe(false);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });
}); 