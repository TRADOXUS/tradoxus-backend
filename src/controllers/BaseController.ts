import { Request, Response } from 'express';
import { Repository, FindOptionsWhere, ObjectLiteral, EntityTarget, DeepPartial } from 'typeorm';
import { validate } from 'class-validator';
import { AppDataSource } from '../config/database';

export interface BaseEntity extends ObjectLiteral {
    id: string;
    createdAt: Date;
}

export class BaseController<T extends BaseEntity> {
    protected repository: Repository<T>;

    constructor(entity: EntityTarget<T>) {
        this.repository = AppDataSource.getRepository(entity);
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const entity = this.repository.create(req.body);
            const errors = await validate(entity);

            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }

            const result = await this.repository.save(entity);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const [items, total] = await this.repository.findAndCount({
                skip,
                take: limit,
                order: { createdAt: 'DESC' } as any
            });

            res.json({
                items,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const item = await this.repository.findOne({ 
                where: { id } as FindOptionsWhere<T>
            });

            if (!item) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }

            res.json(item);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const item = await this.repository.findOne({ 
                where: { id } as FindOptionsWhere<T>
            });

            if (!item) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }

            const updatedItem = this.repository.merge(item, req.body as DeepPartial<T>);
            const errors = await validate(updatedItem);

            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }

            const result = await this.repository.save(updatedItem);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const item = await this.repository.findOne({ 
                where: { id } as FindOptionsWhere<T>
            });

            if (!item) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }

            await this.repository.softDelete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
} 