import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Capsule, CapsuleType } from '../entities/Capsule';
import { Lesson } from '../entities/Lesson';
import { AppDataSource } from '../config/database';
import { validate } from 'class-validator';
import { FindOptionsWhere } from 'typeorm';

export class CapsuleController extends BaseController<Capsule> {
    private lessonRepository = AppDataSource.getRepository(Lesson);

    constructor() {
        super(Capsule);
    }

    // Create capsule within a lesson
    async createInLesson(req: Request, res: Response): Promise<void> {
        try {
            const lessonId = req.params.lessonId;
            const lesson = await this.lessonRepository.findOne({
                where: { id: lessonId }
            });

            if (!lesson) {
                res.status(404).json({ error: 'Lesson not found' });
                return;
            }

            const capsule = this.repository.create({
                ...req.body,
                lesson
            });

            const errors = await validate(capsule);
            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }

            const result = await this.repository.save(capsule);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get capsules by lesson
    async getCapsulesByLesson(req: Request, res: Response): Promise<void> {
        try {
            const lessonId = req.params.lessonId;
            const type = req.query.type as CapsuleType;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const whereClause: FindOptionsWhere<Capsule> = { lesson: { id: lessonId } };
            if (type) {
                whereClause.type = type;
            }

            const [capsules, total] = await this.repository.findAndCount({
                where: whereClause,
                skip,
                take: limit,
                order: { order: 'ASC' }
            });

            res.json({
                items: capsules,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Reorder capsules
    async reorderCapsules(req: Request, res: Response): Promise<void> {
        try {
            const lessonId = req.params.lessonId;
            const { capsuleOrders } = req.body;

            if (!Array.isArray(capsuleOrders)) {
                res.status(400).json({ error: 'Invalid capsule orders format' });
                return;
            }

            await AppDataSource.transaction(async transactionalEntityManager => {
                for (const item of capsuleOrders) {
                    await transactionalEntityManager.update(Capsule, item.id, {
                        order: item.order
                    });
                }
            });

            const updatedCapsules = await this.repository.find({
                where: { lesson: { id: lessonId } },
                order: { order: 'ASC' }
            });

            res.json(updatedCapsules);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update capsule content
    async updateContent(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const { content } = req.body;

            if (typeof content !== 'object') {
                res.status(400).json({ error: 'Content must be an object' });
                return;
            }

            const capsule = await this.repository.findOne({
                where: { id }
            });

            if (!capsule) {
                res.status(404).json({ error: 'Capsule not found' });
                return;
            }

            capsule.content = content;
            const result = await this.repository.save(capsule);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get capsules by type
    async getCapsulesByType(req: Request, res: Response): Promise<void> {
        try {
            const type = req.params.type as CapsuleType;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            if (!Object.values(CapsuleType).includes(type)) {
                res.status(400).json({ error: 'Invalid capsule type' });
                return;
            }

            const [capsules, total] = await this.repository.findAndCount({
                where: { type },
                skip,
                take: limit,
                order: { createdAt: 'DESC' },
                relations: ['lesson', 'lesson.module', 'lesson.module.course']
            });

            res.json({
                items: capsules,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
} 