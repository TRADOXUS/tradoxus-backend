import { LessonService } from '../../services/LessonService';
import { AppDataSource } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// Mock the database connection and repositories
jest.mock('../../config/database', () => ({
    AppDataSource: {
        createQueryRunner: jest.fn(),
        getRepository: jest.fn()
    }
}));

describe('LessonService', () => {
    let lessonService: LessonService;
    let mockRepository: any;
    let mockModuleRepository: any;
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

        mockModuleRepository = {
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
            if (entity.name === 'Lesson') return mockRepository;
            if (entity.name === 'Module') return mockModuleRepository;
            return {};
        });
        (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

        lessonService = new LessonService();
    });

    describe('createInModule', () => {
        it('should create a lesson in a module', async () => {
            const mockModule = {
                id: '1',
                title: 'Test Module'
            };

            const lessonData = {
                title: 'Test Lesson',
                order: 1
            };

            mockModuleRepository.findOne.mockResolvedValue(mockModule);
            mockRepository.create.mockReturnValue({ ...lessonData, module: mockModule });
            mockRepository.save.mockResolvedValue({ ...lessonData, module: mockModule, id: '1' });

            const result = await lessonService.createInModule('1', lessonData);

            expect(result).toBeDefined();
            expect(result.module).toEqual(mockModule);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when module is not found', async () => {
            mockModuleRepository.findOne.mockResolvedValue(null);

            await expect(lessonService.createInModule('1', { title: 'Test Lesson' }))
                .rejects
                .toThrow(AppError);
        });
    });

    describe('getLessonsByModule', () => {
        it('should return lessons for a module with pagination', async () => {
            const mockLessons = [
                { id: '1', title: 'Lesson 1' },
                { id: '2', title: 'Lesson 2' }
            ];

            mockRepository.findAndCount.mockResolvedValue([mockLessons, 2]);

            const result = await lessonService.getLessonsByModule('moduleId', 1, 10);

            expect(result.items).toEqual(mockLessons);
            expect(result.total).toBe(2);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: { module: { id: 'moduleId' } },
                skip: 0,
                take: 10,
                order: { order: 'ASC' }
            });
        });
    });

    describe('getLessonWithCapsules', () => {
        it('should return a lesson with its capsules', async () => {
            const mockLesson = {
                id: '1',
                title: 'Test Lesson',
                capsules: []
            };

            mockRepository.findOne.mockResolvedValue(mockLesson);

            const result = await lessonService.getLessonWithCapsules('1');

            expect(result).toEqual(mockLesson);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['capsules'],
                order: {
                    capsules: {
                        order: 'ASC'
                    }
                }
            });
        });
    });

    describe('reorderLessons', () => {
        it('should reorder lessons successfully', async () => {
            const lessonOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });

            const result = await lessonService.reorderLessons('moduleId', lessonOrders);

            expect(result).toBe(true);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during reordering', async () => {
            const lessonOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockRejectedValue(new Error('Database error'));

            const result = await lessonService.reorderLessons('moduleId', lessonOrders);

            expect(result).toBe(false);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('updatePrerequisites', () => {
        it('should update lesson prerequisites', async () => {
            const mockLesson = {
                id: '1',
                title: 'Test Lesson',
                prerequisites: []
            };

            mockRepository.findOneBy.mockResolvedValue(mockLesson);
            mockRepository.save.mockResolvedValue({ ...mockLesson, prerequisites: ['lesson1', 'lesson2'] });

            const result = await lessonService.updatePrerequisites('1', ['lesson1', 'lesson2']);

            expect(result?.prerequisites).toEqual(['lesson1', 'lesson2']);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when lesson is not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);

            await expect(lessonService.updatePrerequisites('1', ['lesson1']))
                .rejects
                .toThrow(AppError);
        });
    });
}); 