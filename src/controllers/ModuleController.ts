import { Request, Response } from "express";
import { ModuleService } from "../services/ModuleService";
import { AppError } from "../middleware/errorHandler";

export class ModuleController {
  private moduleService: ModuleService;

  constructor() {
    this.moduleService = new ModuleService();
  }

  // Create a new module
  async create(req: Request, res: Response): Promise<void> {
    try {
      const module = await this.moduleService.create(req.body);
      res.status(201).json({
        status: "success",
        data: module,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // Get all modules with pagination
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { items, total } = await this.moduleService.findAll(page, limit);

      res.json({
        status: "success",
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // Get a module by id
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const module = await this.moduleService.findOne(id);

      if (!module) {
        res.status(404).json({
          status: "error",
          message: "Module not found",
        });
        return;
      }

      res.json({
        status: "success",
        data: module,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  }

  // Update a module
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const module = await this.moduleService.update(id, req.body);

      if (!module) {
        res.status(404).json({
          status: "error",
          message: "Module not found",
        });
        return;
      }

      res.json({
        status: "success",
        data: module,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  }

  // Delete a module
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const deleted = await this.moduleService.delete(id);

      if (!deleted) {
        res.status(404).json({
          status: "error",
          message: "Module not found",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: "error",
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  }

  // Create module within a course
  async createInCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.courseId;
      const module = await this.moduleService.createInCourse(
        courseId,
        req.body,
      );
      res.status(201).json({
        status: "success",
        data: module,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // Get modules by course
  async getModulesByCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.courseId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { items, total } = await this.moduleService.getModulesByCourse(
        courseId,
        page,
        limit,
      );

      res.json({
        status: "success",
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // Get module with lessons
  async getModuleWithLessons(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const module = await this.moduleService.getModuleWithLessons(id);

      if (!module) {
        res.status(404).json({ error: "Module not found" });
        return;
      }

      res.json({
        status: "success",
        data: module,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // Reorder modules
  async reorderModules(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.courseId;
      const { moduleOrders } = req.body;

      if (!Array.isArray(moduleOrders)) {
        res.status(400).json({ error: "Invalid module orders format" });
        return;
      }

      const success = await this.moduleService.reorderModules(
        courseId,
        moduleOrders,
      );
      if (!success) {
        res.status(500).json({ error: "Failed to reorder modules" });
        return;
      }

      const { items } = await this.moduleService.getModulesByCourse(courseId);
      res.json({
        status: "success",
        data: items,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
