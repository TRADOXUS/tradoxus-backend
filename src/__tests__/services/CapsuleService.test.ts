import { CapsuleService } from '../../services/CapsuleService';
import { CapsuleType } from '../../entities/Capsule';
import { AppDataSource } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// Mock the database connection and repositories
jest.mock('../../config/database', () => ({
    AppDataSource: {
        createQueryRunner: jest.fn(),
        getRepository: jest.fn()
    }
}));

describe('CapsuleService', () => {
    let capsuleService: CapsuleService;
    let mockRepository: any;
    let mockLessonRepository: any;
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

        mockLessonRepository = {
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
            if (entity.name === 'Capsule') return mockRepository;
            if (entity.name === 'Lesson') return mockLessonRepository;
            return {};
        });
        (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

        capsuleService = new CapsuleService();
    });

    describe('createInLesson', () => {
        it('should create a capsule in a lesson', async () => {
            const mockLesson = {
                id: '1',
                title: 'Test Lesson'
            };

            const capsuleData = {
                title: 'Test Capsule',
                type: CapsuleType.VIDEO,
                order: 1
            };

            mockLessonRepository.findOne.mockResolvedValue(mockLesson);
            mockRepository.create.mockReturnValue({ ...capsuleData, lesson: mockLesson });
            mockRepository.save.mockResolvedValue({ ...capsuleData, lesson: mockLesson, id: '1' });

            const result = await capsuleService.createInLesson('1', capsuleData);

            expect(result).toBeDefined();
            expect(result.lesson).toEqual(mockLesson);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when lesson is not found', async () => {
            mockLessonRepository.findOne.mockResolvedValue(null);

            await expect(capsuleService.createInLesson('1', { title: 'Test Capsule' }))
                .rejects
                .toThrow(AppError);
        });
    });

    describe('getCapsulesByLesson', () => {
        it('should return capsules for a lesson with pagination', async () => {
            const mockCapsules = [
                { id: '1', title: 'Capsule 1' },
                { id: '2', title: 'Capsule 2' }
            ];

            mockRepository.findAndCount.mockResolvedValue([mockCapsules, 2]);

            const result = await capsuleService.getCapsulesByLesson('lessonId', 1, 10);

            expect(result.items).toEqual(mockCapsules);
            expect(result.total).toBe(2);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: { lesson: { id: 'lessonId' } },
                skip: 0,
                take: 10,
                order: { order: 'ASC' }
            });
        });
    });

    describe('getCapsulesByType', () => {
        it('should return capsules by type with pagination', async () => {
            const mockCapsules = [
                { id: '1', title: 'Video Capsule 1', type: CapsuleType.VIDEO },
                { id: '2', title: 'Video Capsule 2', type: CapsuleType.VIDEO }
            ];

            mockRepository.findAndCount.mockResolvedValue([mockCapsules, 2]);

            const result = await capsuleService.getCapsulesByType(CapsuleType.VIDEO, 1, 10);

            expect(result.items).toEqual(mockCapsules);
            expect(result.total).toBe(2);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: { type: CapsuleType.VIDEO },
                skip: 0,
                take: 10,
                order: { order: 'ASC' }
            });
        });
    });

    describe('reorderCapsules', () => {
        it('should reorder capsules successfully', async () => {
            const capsuleOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });

            const result = await capsuleService.reorderCapsules('lessonId', capsuleOrders);

            expect(result).toBe(true);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during reordering', async () => {
            const capsuleOrders = [
                { id: '1', order: 1 },
                { id: '2', order: 2 }
            ];

            mockQueryRunner.manager.update.mockRejectedValue(new Error('Database error'));

            const result = await capsuleService.reorderCapsules('lessonId', capsuleOrders);

            expect(result).toBe(false);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('updateContent', () => {
        it('should update capsule content', async () => {
            const mockCapsule = {
                id: '1',
                title: 'Test Capsule',
                content: {}
            };

            const newContent = {
                videoUrl: 'https://example.com/video',
                duration: 120
            };

            mockRepository.findOneBy.mockResolvedValue(mockCapsule);
            mockRepository.save.mockResolvedValue({ ...mockCapsule, content: newContent });

            const result = await capsuleService.updateContent('1', newContent);

            expect(result?.content).toEqual(newContent);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when capsule is not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);

            await expect(capsuleService.updateContent('1', { videoUrl: 'test' }))
                .rejects
                .toThrow(AppError);
        });
    });
}); 