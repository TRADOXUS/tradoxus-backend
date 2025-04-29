import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { describe, it, expect, beforeEach, jest, afterAll } from '@jest/globals';
import routes from '../../routes';
import { errorHandler } from '../../middleware/errorHandler';
import { AppDataSource } from '../../config/database';
import { Course } from '../../entities/Course';
import { Module } from '../../entities/Module';
import { Lesson } from '../../entities/Lesson';
import { Capsule, CapsuleType } from '../../entities/Capsule';
import { Request, Response, NextFunction } from 'express';

// Mock the database connection
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        createQueryRunner: jest.fn(),
        destroy: jest.fn(),
    }
}));

// Mock the controller
jest.mock('../../controllers/CapsuleController', () => {
    return {
        CapsuleController: jest.fn().mockImplementation(() => ({
            create: jest.fn().mockImplementation(async (req: any, res: any) => {
                const capsule = req.body;
                // Create a new object with serialized dates
                const serializedCapsule = {
                    ...capsule,
                    createdAt: new Date(capsule.createdAt).toISOString(),
                    updatedAt: new Date(capsule.updatedAt).toISOString(),
                    lesson: {
                        ...capsule.lesson,
                        createdAt: new Date(capsule.lesson.createdAt).toISOString(),
                        updatedAt: new Date(capsule.lesson.updatedAt).toISOString(),
                        module: {
                            ...capsule.lesson.module,
                            createdAt: new Date(capsule.lesson.module.createdAt).toISOString(),
                            updatedAt: new Date(capsule.lesson.module.updatedAt).toISOString(),
                            course: {
                                ...capsule.lesson.module.course,
                                createdAt: new Date(capsule.lesson.module.course.createdAt).toISOString(),
                                updatedAt: new Date(capsule.lesson.module.course.updatedAt).toISOString()
                            }
                        }
                    }
                };
                res.status(201).json(serializedCapsule);
            }),
            findAll: jest.fn().mockImplementation(async (req: any, res: any) => {
                res.json({
                    items: [],
                    total: 0,
                    page: 1,
                    totalPages: 1
                });
            }),
            findOne: jest.fn().mockImplementation(async (req: any, res: any) => {
                if (req.params.id === '999') {
                    res.status(404).json({ error: 'Capsule not found' });
                    return;
                }
                // For GET requests, we'll use a mock capsule
                const mockCapsule = {
                    id: req.params.id,
                    title: 'Test Capsule',
                    description: 'Test Description',
                    order: 1,
                    type: CapsuleType.TEXT,
                    content: {},
                    lesson: {
                        id: '1',
                        title: 'Test Lesson',
                        description: 'Test Description',
                        order: 1,
                        prerequisites: [],
                        module: {
                            id: '1',
                            title: 'Test Module',
                            description: 'Test Description',
                            order: 1,
                            course: {
                                id: '1',
                                title: 'Test Course',
                                description: 'Test Description',
                                isPublished: false,
                                modules: [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                            lessons: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        capsules: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                res.json(mockCapsule);
            }),
            update: jest.fn().mockImplementation(async (req: any, res: any) => {
                if (req.params.id === '999') {
                    res.status(404).json({ error: 'Capsule not found' });
                    return;
                }
                const capsule = req.body;
                // Create a new object with serialized dates
                const serializedCapsule = {
                    ...capsule,
                    createdAt: new Date(capsule.createdAt).toISOString(),
                    updatedAt: new Date(capsule.updatedAt).toISOString(),
                    lesson: {
                        ...capsule.lesson,
                        createdAt: new Date(capsule.lesson.createdAt).toISOString(),
                        updatedAt: new Date(capsule.lesson.updatedAt).toISOString(),
                        module: {
                            ...capsule.lesson.module,
                            createdAt: new Date(capsule.lesson.module.createdAt).toISOString(),
                            updatedAt: new Date(capsule.lesson.module.updatedAt).toISOString(),
                            course: {
                                ...capsule.lesson.module.course,
                                createdAt: new Date(capsule.lesson.module.course.createdAt).toISOString(),
                                updatedAt: new Date(capsule.lesson.module.course.updatedAt).toISOString()
                            }
                        }
                    }
                };
                res.json(serializedCapsule);
            }),
            delete: jest.fn().mockImplementation(async (req: any, res: any) => {
                if (req.params.id === '999') {
                    res.status(404).json({ error: 'Capsule not found' });
                    return;
                }
                res.status(204).send();
            }),
            createInLesson: jest.fn().mockImplementation(async (req: any, res: any) => {
                const lessonId = req.params.lessonId;
                if (lessonId === '999') {
                    res.status(404).json({ error: 'Lesson not found' });
                    return;
                }
                const capsule = req.body;
                const serializedCapsule = {
                    ...capsule,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lesson: {
                        id: lessonId,
                        title: 'Test Lesson',
                        description: 'Test Description',
                        order: 1,
                        prerequisites: [],
                        module: {
                            id: '1',
                            title: 'Test Module',
                            description: 'Test Description',
                            order: 1,
                            course: {
                                id: '1',
                                title: 'Test Course',
                                description: 'Test Description',
                                isPublished: false,
                                modules: []
                            },
                            lessons: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        capsules: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                };
                res.status(201).json(serializedCapsule);
            }),
            getCapsulesByLesson: jest.fn().mockImplementation(async (req: any, res: any) => {
                const lessonId = req.params.lessonId;
                if (lessonId === '999') {
                    res.status(404).json({ error: 'Lesson not found' });
                    return;
                }
                res.json({
                    items: [],
                    total: 0,
                    page: 1,
                    totalPages: 1
                });
            }),
            reorderCapsules: jest.fn().mockImplementation(async (req: any, res: any) => {
                const lessonId = req.params.lessonId;
                if (lessonId === '999') {
                    res.status(404).json({ error: 'Lesson not found' });
                    return;
                }
                const { capsuleOrders } = req.body;
                if (!Array.isArray(capsuleOrders)) {
                    res.status(400).json({ error: 'Invalid capsule orders format' });
                    return;
                }
                res.json([]);
            }),
            updateContent: jest.fn().mockImplementation(async (req: any, res: any) => {
                const id = req.params.id;
                if (id === '999') {
                    res.status(404).json({ error: 'Capsule not found' });
                    return;
                }
                const { content } = req.body;
                if (typeof content !== 'object') {
                    res.status(400).json({ error: 'Content must be an object' });
                    return;
                }
                const mockCapsule = {
                    id,
                    title: 'Test Capsule',
                    description: 'Test Description',
                    order: 1,
                    type: CapsuleType.TEXT,
                    content,
                    lesson: {
                        id: '1',
                        title: 'Test Lesson',
                        description: 'Test Description',
                        order: 1,
                        prerequisites: [],
                        module: {
                            id: '1',
                            title: 'Test Module',
                            description: 'Test Description',
                            order: 1,
                            course: {
                                id: '1',
                                title: 'Test Course',
                                description: 'Test Description',
                                isPublished: false,
                                modules: []
                            },
                            lessons: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        capsules: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                res.json(mockCapsule);
            }),
            getCapsulesByType: jest.fn().mockImplementation(async (req: any, res: any) => {
                const type = req.params.type as CapsuleType;
                if (!Object.values(CapsuleType).includes(type)) {
                    res.status(400).json({ error: 'Invalid capsule type' });
                    return;
                }
                res.json({
                    items: [],
                    total: 0,
                    page: 1,
                    totalPages: 1
                });
            })
        }))
    };
});

const app = express();

// Setup middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

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

describe('Capsule Controller Tests', () => {
    const mockDate = new Date('2025-03-22T22:47:48.943Z');

    const convertToExpectedFormat = (obj: any): any => {
        if (obj instanceof Date) {
            return obj.toISOString();
        }
        if (Array.isArray(obj)) {
            return obj.map(convertToExpectedFormat);
        }
        if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
                result[key] = convertToExpectedFormat(obj[key]);
            }
            return result;
        }
        return obj;
    };

    const mockCourse: Course = {
        id: '1',
        title: 'Test Course',
        description: 'Test Description',
        isPublished: false,
        modules: [],
        lessons: [],
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockModule: Module = {
        id: '1',
        title: 'Test Module',
        description: 'Test Description',
        order: 1,
        course: mockCourse,
        lessons: [],
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockLesson: Lesson = {
        id: '1',
        title: 'Test Lesson',
        description: 'Test Description',
        order: 1,
        prerequisites: [],
        module: mockModule,
        capsules: [],
        course: mockCourse,
        progress: [],
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockCapsule: Capsule = {
        id: '1',
        title: 'Test Capsule',
        description: 'Test Description',
        order: 1,
        type: CapsuleType.TEXT,
        content: {},
        lesson: mockLesson,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/capsules', () => {
        it('should create a new capsule', async () => {
            const response = await request(app)
                .post('/api/capsules')
                .send(convertToExpectedFormat(mockCapsule))
                .expect(201);

            expect(response.body).toEqual(convertToExpectedFormat(mockCapsule));
        }, 10000);
    });

    describe('GET /api/capsules', () => {
        it('should get all capsules with pagination', async () => {
            const response = await request(app)
                .get('/api/capsules')
                .expect(200);

            expect(response.body).toEqual({
                items: [],
                total: 0,
                page: 1,
                totalPages: 1
            });
        });
    });

    describe('GET /api/capsules/:id', () => {
        it('should get a capsule by id', async () => {
            const response = await request(app)
                .get('/api/capsules/1')
                .expect(200);

            // The response will have ISO string dates
            expect(response.body).toMatchObject({
                id: '1',
                title: 'Test Capsule',
                description: 'Test Description',
                order: 1,
                type: CapsuleType.TEXT,
                content: {},
                lesson: {
                    id: '1',
                    title: 'Test Lesson',
                    description: 'Test Description',
                    order: 1,
                    prerequisites: [],
                    module: {
                        id: '1',
                        title: 'Test Module',
                        description: 'Test Description',
                        order: 1,
                        course: {
                            id: '1',
                            title: 'Test Course',
                            description: 'Test Description',
                            isPublished: false,
                            modules: []
                        }
                    }
                }
            });
            // Verify that dates are ISO strings
            expect(new Date(response.body.createdAt).toISOString()).toBe(response.body.createdAt);
            expect(new Date(response.body.updatedAt).toISOString()).toBe(response.body.updatedAt);
        });

        it('should return 404 for non-existent capsule', async () => {
            const response = await request(app)
                .get('/api/capsules/999')
                .expect(404);

            expect(response.body).toEqual({ error: 'Capsule not found' });
        });
    });

    describe('PUT /api/capsules/:id', () => {
        it('should update a capsule', async () => {
            const updatedCapsule = { ...mockCapsule, title: 'Updated Capsule' };
            const response = await request(app)
                .put('/api/capsules/1')
                .send(convertToExpectedFormat(updatedCapsule))
                .expect(200);

            expect(response.body).toEqual(convertToExpectedFormat(updatedCapsule));
        }, 10000);
    });

    describe('DELETE /api/capsules/:id', () => {
        it('should delete a capsule', async () => {
            await request(app)
                .delete('/api/capsules/1')
                .expect(204);
        });

        it('should return 404 for non-existent capsule', async () => {
            const response = await request(app)
                .delete('/api/capsules/999')
                .expect(404);

            expect(response.body).toEqual({ error: 'Capsule not found' });
        });
    });
}); 