import { Lesson } from "../entities/Lesson";
import { BaseService } from "./BaseService";
import { Module } from "../entities/Module";
import { AppDataSource } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class LessonService extends BaseService<Lesson> {
    constructor() {
        super(Lesson);
    }

    async createInModule(moduleId: string, data: Partial<Lesson>): Promise<Lesson> {
        const moduleRepository = AppDataSource.getRepository(Module);
        const module = await moduleRepository.findOne({ where: { id: moduleId } });
        
        if (!module) {
            throw new AppError('Module not found', 404);
        }

        const lesson = this.repository.create({
            ...data,
            module
        });

        return this.repository.save(lesson);
    }

    async getLessonsByModule(moduleId: string, page: number = 1, limit: number = 10): Promise<{ items: Lesson[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            where: { module: { id: moduleId } },
            skip: (page - 1) * limit,
            take: limit,
            order: { order: 'ASC' }
        });
        return { items, total };
    }

    async getLessonWithCapsules(id: string): Promise<Lesson | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['capsules'],
            order: {
                capsules: {
                    order: 'ASC'
                }
            }
        });
    }

    async reorderLessons(moduleId: string, lessonOrders: { id: string; order: number }[]): Promise<boolean> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const { id, order } of lessonOrders) {
                await queryRunner.manager.update(Lesson, id, { order });
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

    async updatePrerequisites(id: string, prerequisites: string[]): Promise<Lesson | null> {
        const lesson = await this.findOne(id);
        if (!lesson) {
            throw new AppError('Lesson not found', 404);
        }

        lesson.prerequisites = prerequisites;
        return this.repository.save(lesson);
    }
} 