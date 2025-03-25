import { Request, Response } from 'express';
import { CourseService } from '../services/CourseService';
import { AppError } from '../middleware/errorHandler';

export class CourseController {
    private courseService: CourseService;

    constructor(service?: CourseService) {
        this.courseService = service || new CourseService();
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const course = await this.courseService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: course
            });
        } catch (err) {
            throw new AppError('Failed to create course', 500);
        }
    }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.courseService.findAll(page, limit);
            
            if (!result) {
                throw new AppError('Failed to fetch courses', 500);
            }

            res.json({
                status: 'success',
                data: result.items,
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to fetch courses', 500);
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const course = await this.courseService.findOne(req.params.id);
            if (!course) {
                throw new AppError('Course not found', 404);
            }
            res.json({
                status: 'success',
                data: course
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to fetch course', 500);
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const course = await this.courseService.update(req.params.id, req.body);
            if (!course) {
                throw new AppError('Course not found', 404);
            }
            res.json({
                status: 'success',
                data: course
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to update course', 500);
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.courseService.delete(req.params.id);
            if (!result) {
                throw new AppError('Course not found', 404);
            }
            res.status(204).send();
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to delete course', 500);
        }
    }

    async getCourseWithModules(req: Request, res: Response): Promise<void> {
        try {
            const course = await this.courseService.getCourseWithModules(req.params.id);
            if (!course) {
                throw new AppError('Course not found', 404);
            }
            res.json({
                status: 'success',
                data: course
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to fetch course with modules', 500);
        }
    }

    async togglePublish(req: Request, res: Response): Promise<void> {
        try {
            const course = await this.courseService.togglePublish(req.params.id);
            if (!course) {
                throw new AppError('Course not found', 404);
            }
            res.json({
                status: 'success',
                data: course
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to toggle course publish status', 500);
        }
    }

    async getPublishedCourses(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.courseService.getPublishedCourses(page, limit);
            
            if (!result) {
                throw new AppError('Failed to fetch published courses', 500);
            }

            res.json({
                status: 'success',
                data: result.items,
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError('Failed to fetch published courses', 500);
        }
    }
} 