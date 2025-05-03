import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  UpdateResult,
} from "typeorm";
import { AppDataSource } from "../config/database";

export abstract class BaseService<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = AppDataSource.getRepository(entity);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: T[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
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
    const criteria = { id } as unknown as FindOptionsWhere<T>;
    const result: UpdateResult = await this.repository.update(
      criteria,
      data as T,
    );
    if (result.affected === 0) {
      return null;
    }
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected ? true : false;
  }

  protected createError(message: string, statusCode: number) {
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    throw error;
  }
}
