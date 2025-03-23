import { Course } from "../entities/Course";
import { BaseService } from "./BaseService";
import { Module } from "../entities/Module";
import { AppDataSource } from "../config/database";

export class CourseService extends BaseService<Course> {
    constructor() {
        super(Course);
    }

    async getCourseWithModules(id: string): Promise<Course | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['modules']
        });
    }

    async togglePublish(id: string): Promise<Course | null> {
        const course = await this.findOne(id);
        if (!course) return null;

        course.isPublished = !course.isPublished;
        return this.repository.save(course);
    }

    async getPublishedCourses(page: number = 1, limit: number = 10): Promise<{ items: Course[]; total: number }> {
        const [items, total] = await this.repository.findAndCount({
            where: { isPublished: true },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });
        return { items, total };
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