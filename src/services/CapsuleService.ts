import { Capsule, CapsuleType } from "../entities/Capsule";
import { BaseService } from "./BaseService";
import { Lesson } from "../entities/Lesson";
import { AppDataSource } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class CapsuleService extends BaseService<Capsule> {
    constructor() {
        super(Capsule);
    }

    async createInLesson(lessonId: string, data: Partial<Capsule>): Promise<Capsule> {
        const lessonRepository = AppDataSource.getRepository(Lesson);
        const lesson = await lessonRepository.findOne({ where: { id: lessonId } });
        
        if (!lesson) {
            throw new AppError('Lesson not found', 404);
        }

        const capsule = this.repository.create({
            ...data,
            lesson
        });

        return this.repository.save(capsule);
    }

    async getCapsulesByLesson(lessonId: string, page: number = 1, limit: number = 10): Promise<{ items: Capsule[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            where: { lesson: { id: lessonId } },
            skip: (page - 1) * limit,
            take: limit,
            order: { order: 'ASC' }
        });
        return { items, total };
    }

    async getCapsulesByType(type: CapsuleType, page: number = 1, limit: number = 10): Promise<{ items: Capsule[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            where: { type },
            skip: (page - 1) * limit,
            take: limit,
            order: { order: 'ASC' }
        });
        return { items, total };
    }

    async reorderCapsules(lessonId: string, capsuleOrders: { id: string; order: number }[]): Promise<boolean> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const { id, order } of capsuleOrders) {
                await queryRunner.manager.update(Capsule, id, { order });
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

    async updateContent(id: string, content: Record<string, any>): Promise<Capsule | null> {
        const capsule = await this.findOne(id);
        if (!capsule) {
            throw new AppError('Capsule not found', 404);
        }

        capsule.content = content;
        return this.repository.save(capsule);
    }
} 