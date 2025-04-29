import { Module } from "../entities/Module";
import { BaseService } from "./BaseService";
import { Course } from "../entities/Course";
import { AppDataSource } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class ModuleService extends BaseService<Module> {
    constructor() {
        super(Module);
    }

    async createInCourse(courseId: string, data: Partial<Module>): Promise<Module> {
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.findOne({ where: { id: courseId } });
        
        if (!course) {
            throw new AppError(404, 'Course not found');
        }

        const module = this.repository.create({
            ...data,
            course
        });

        return this.repository.save(module);
    }

    async getModulesByCourse(courseId: string, page: number = 1, limit: number = 10): Promise<{ items: Module[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            where: { course: { id: courseId } },
            skip: (page - 1) * limit,
            take: limit,
            order: { order: 'ASC' }
        });
        return { items, total };
    }

    async getModuleWithLessons(id: string): Promise<Module | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['lessons'],
            order: {
                lessons: {
                    order: 'ASC'
                }
            }
        });
    }

    async reorderModules(courseId: string, moduleOrders: { id: string; order: number }[]): Promise<boolean> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const { id, order } of moduleOrders) {
                await queryRunner.manager.update(Module, id, { order });
            }
            await queryRunner.commitTransaction();
            return true;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            return false;
        } finally {
            await queryRunner.release();
        }
    }
} 