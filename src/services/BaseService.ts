import { Repository, DeepPartial, FindOptionsWhere, ObjectLiteral } from "typeorm";
import { AppDataSource } from "../config/database";

export abstract class BaseService<T extends ObjectLiteral> {
    protected repository: Repository<T>;

    constructor(entity: new () => T) {
        this.repository = AppDataSource.getRepository(entity);
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ items: T[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' } as any
        });
        return { items, total };
    }

    async findOne(id: string): Promise<T | null> {
        return this.repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
    }

    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async update(id: string, data: DeepPartial<T>): Promise<T | null> {
        await this.repository.update(id, data as any);
        return this.findOne(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.softDelete(id);
        return result.affected ? true : false;
    }
} 