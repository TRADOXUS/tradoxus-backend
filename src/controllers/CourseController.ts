import { Request, Response } from "express";
import { CourseService } from "../services/CourseService";
import { AppError } from "../middleware/errorHandler";

export class CourseController {
  private courseService: CourseService;

  constructor(service?: CourseService) {
    this.courseService = service || new CourseService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.create(req.body);
      res.status(201).json({
        status: "success",
        data: course,
      });
    } catch (err) {
      throw new AppError(500, "Failed to create course");
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.courseService.findAll(page, limit);

      if (!result) {
        throw new AppError(500, "Failed to fetch courses");
      }

      res.json({
        status: "success",
        data: result.items,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to fetch courses");
    }
  }

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.findOne(req.params.id);
      if (!course) {
        throw new AppError(404, "Course not found");
      }
      res.json({
        status: "success",
        data: course,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to fetch course");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.update(req.params.id, req.body);
      if (!course) {
        throw new AppError(404, "Course not found");
      }
      res.json({
        status: "success",
        data: course,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to update course");
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.courseService.delete(req.params.id);
      if (!result) {
        throw new AppError(404, "Course not found");
      }
      res.status(204).send();
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to delete course");
    }
  }

  async getCourseWithModules(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseWithModules(
        req.params.id,
      );
      if (!course) {
        throw new AppError(404, "Course not found");
      }
      res.json({
        status: "success",
        data: course,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to fetch course with modules");
    }
  }

  async togglePublish(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.togglePublish(req.params.id);
      if (!course) {
        throw new AppError(404, "Course not found");
      }
      res.json({
        status: "success",
        data: course,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to toggle course publish status");
    }
  }

  async getPublishedCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.courseService.getPublishedCourses(page, limit);

      if (!result) {
        throw new AppError(500, "Failed to fetch published courses");
      }

      res.json({
        status: "success",
        data: result.items,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to fetch published courses");
    }
  }
}
