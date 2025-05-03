import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { Lesson } from "../entities/Lesson";
import { Module } from "../entities/Module";
import { AppDataSource } from "../config/database";
import { validate } from "class-validator";

export class LessonController extends BaseController<Lesson> {
  private moduleRepository = AppDataSource.getRepository(Module);

  constructor() {
    super(Lesson);
  }

  // Create lesson within a module
  async createInModule(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = req.params.moduleId;
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      if (!module) {
        res.status(404).json({ error: "Module not found" });
        return;
      }

      const lesson = this.repository.create({
        ...req.body,
        module,
      });

      const errors = await validate(lesson);
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const result = await this.repository.save(lesson);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get lessons by module
  async getLessonsByModule(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = req.params.moduleId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [lessons, total] = await this.repository.findAndCount({
        where: { module: { id: moduleId } },
        skip,
        take: limit,
        order: { order: "ASC" },
        relations: ["capsules"],
      });

      res.json({
        items: lessons,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Reorder lessons
  async reorderLessons(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = req.params.moduleId;
      const { lessonOrders } = req.body;

      if (!Array.isArray(lessonOrders)) {
        res.status(400).json({ error: "Invalid lesson orders format" });
        return;
      }

      await AppDataSource.transaction(async (transactionalEntityManager) => {
        for (const item of lessonOrders) {
          await transactionalEntityManager.update(Lesson, item.id, {
            order: item.order,
          });
        }
      });

      const updatedLessons = await this.repository.find({
        where: { module: { id: moduleId } },
        order: { order: "ASC" },
      });

      res.json(updatedLessons);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get lesson with capsules
  async getLessonWithCapsules(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const lesson = await this.repository.findOne({
        where: { id },
        relations: ["capsules"],
        order: {
          capsules: {
            order: "ASC",
          },
        },
      });

      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Update lesson prerequisites
  async updatePrerequisites(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { prerequisites } = req.body;

      if (!Array.isArray(prerequisites)) {
        res.status(400).json({ error: "Prerequisites must be an array" });
        return;
      }

      const lesson = await this.repository.findOne({
        where: { id },
      });

      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      lesson.prerequisites = prerequisites;
      const result = await this.repository.save(lesson);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
