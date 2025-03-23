import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { describe, it, expect, beforeEach, jest, afterAll } from '@jest/globals';
import routes from '../../routes';
import { errorHandler } from '../../middleware/errorHandler';
import { ModuleService } from '../../services/ModuleService';
import { AppDataSource } from '../../config/database';
import { Course } from '../../entities/Course';
import { Module } from '../../entities/Module';

// Mock the database connection
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        createQueryRunner: jest.fn(),
        destroy: jest.fn(),
    }
}));

// Mock the services
jest.mock('../../services/ModuleService', () => {
  const mockDate = new Date('2025-03-22T22:47:48.943Z');
  return {
    ModuleService: jest.fn().mockImplementation(() => ({
      create: jest.fn().mockImplementation((data: any) => ({
        id: '1',
        title: data.title || 'Test Module',
        description: data.description || 'Test Description',
        order: data.order || 1,
        course: {
          id: '1',
          title: 'Test Course',
          description: 'Test Description',
          isPublished: false,
          modules: [],
          createdAt: mockDate,
          updatedAt: mockDate
        },
        lessons: [],
        createdAt: mockDate,
        updatedAt: mockDate
      })),
      findAll: jest.fn().mockImplementation(() => ({
        items: [{
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
            createdAt: mockDate,
            updatedAt: mockDate
          },
          lessons: [],
          createdAt: mockDate,
          updatedAt: mockDate
        }],
        total: 1
      })),
      findOne: jest.fn().mockImplementation((id: any) => {
        if (id === '999') return null;
        return {
          id,
          title: 'Test Module',
          description: 'Test Description',
          order: 1,
          course: {
            id: '1',
            title: 'Test Course',
            description: 'Test Description',
            isPublished: false,
            modules: [],
            createdAt: mockDate,
            updatedAt: mockDate
          },
          lessons: [],
          createdAt: mockDate,
          updatedAt: mockDate
        };
      }),
      update: jest.fn().mockImplementation((id: any, data: any) => {
        if (id === '999') return null;
        return {
          id,
          title: data.title || 'Test Module',
          description: data.description || 'Test Description',
          order: data.order || 1,
          course: {
            id: '1',
            title: 'Test Course',
            description: 'Test Description',
            isPublished: false,
            modules: [],
            createdAt: mockDate,
            updatedAt: mockDate
          },
          lessons: [],
          createdAt: mockDate,
          updatedAt: mockDate
        };
      }),
      delete: jest.fn().mockImplementation((id: any) => {
        if (id === '999') return Promise.resolve(false);
        return Promise.resolve(true);
      }),
      createInCourse: jest.fn(),
      getModulesByCourse: jest.fn(),
      getModuleWithLessons: jest.fn(),
      reorderModules: jest.fn()
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

// Error handler should be last
app.use(errorHandler);

// Clear all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Close database connection after all tests
afterAll(async () => {
    await AppDataSource.destroy();
});

describe('Module Controller Tests', () => {
    const mockDate = new Date('2025-03-22T22:47:48.943Z');
    const mockCourse: Course = {
        id: '1',
        title: 'Test Course',
        description: 'Test Description',
        isPublished: false,
        modules: [],
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

    let moduleService: jest.Mocked<ModuleService>;

    beforeEach(() => {
        jest.clearAllMocks();
        moduleService = new ModuleService() as jest.Mocked<ModuleService>;
    });

    describe('POST /api/modules', () => {
        it('should create a new module', async () => {
            moduleService.create.mockResolvedValue(mockModule);

            const response = await request(app)
                .post('/api/modules')
                .send(mockModule)
                .expect(201);

            expect(response.body).toEqual({
                status: 'success',
                data: {
                    ...mockModule,
                    createdAt: mockDate.toISOString(),
                    updatedAt: mockDate.toISOString(),
                    course: {
                        ...mockCourse,
                        createdAt: mockDate.toISOString(),
                        updatedAt: mockDate.toISOString()
                    }
                }
            });
        });
    });

    describe('GET /api/modules', () => {
        it('should get all modules with pagination', async () => {
            const mockModules = [mockModule];
            const mockTotal = 1;
            moduleService.findAll.mockResolvedValue({
                items: mockModules,
                total: mockTotal
            });

            const response = await request(app)
                .get('/api/modules')
                .expect(200);

            expect(response.body).toEqual({
                status: 'success',
                data: [{
                    ...mockModule,
                    createdAt: mockDate.toISOString(),
                    updatedAt: mockDate.toISOString(),
                    course: {
                        ...mockCourse,
                        createdAt: mockDate.toISOString(),
                        updatedAt: mockDate.toISOString()
                    }
                }],
                pagination: {
                    total: mockTotal,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            });
        });
    });

    describe('GET /api/modules/:id', () => {
        it('should get a module by id', async () => {
            moduleService.findOne.mockResolvedValue(mockModule);

            const response = await request(app)
                .get('/api/modules/1')
                .expect(200);

            expect(response.body).toEqual({
                status: 'success',
                data: {
                    ...mockModule,
                    createdAt: mockDate.toISOString(),
                    updatedAt: mockDate.toISOString(),
                    course: {
                        ...mockCourse,
                        createdAt: mockDate.toISOString(),
                        updatedAt: mockDate.toISOString()
                    }
                }
            });
        });

        it('should return 404 for non-existent module', async () => {
            moduleService.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/modules/999')
                .expect(404);

            expect(response.body).toEqual({
                status: 'error',
                message: 'Module not found'
            });
        });
    });

    describe('PUT /api/modules/:id', () => {
        it('should update a module', async () => {
            const updatedModule = { ...mockModule, title: 'Updated Module' };
            moduleService.update.mockResolvedValue(updatedModule);

            const response = await request(app)
                .put('/api/modules/1')
                .send(updatedModule)
                .expect(200);

            expect(response.body).toEqual({
                status: 'success',
                data: {
                    ...updatedModule,
                    createdAt: mockDate.toISOString(),
                    updatedAt: mockDate.toISOString(),
                    course: {
                        ...mockCourse,
                        createdAt: mockDate.toISOString(),
                        updatedAt: mockDate.toISOString()
                    }
                }
            });
        });

        it('should return 404 for non-existent module', async () => {
            moduleService.update.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/modules/999')
                .send(mockModule)
                .expect(404);

            expect(response.body).toEqual({
                status: 'error',
                message: 'Module not found'
            });
        });
    });

    describe('DELETE /api/modules/:id', () => {
        it('should delete a module', async () => {
            moduleService.delete.mockResolvedValue(true);

            await request(app)
                .delete('/api/modules/1')
                .expect(204);
        });

        it('should return 404 for non-existent module', async () => {
            moduleService.delete.mockResolvedValue(false);

            const response = await request(app)
                .delete('/api/modules/999')
                .expect(404);

            expect(response.body).toEqual({
                status: 'error',
                message: 'Module not found'
            });
        });
    });
}); 