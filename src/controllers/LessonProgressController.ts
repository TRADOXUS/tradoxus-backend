import { Request, Response } from "express";
import { LessonProgressService } from "../services/LessonProgressService";
import {
  StartLessonProgressDto,
  UpdateLessonProgressDto,
  CompleteLessonProgressDto,
} from "../dto/LessonProgress.dto";

export class LessonProgressController {
  constructor(private lessonProgressService: LessonProgressService) {}

  async startProgress(req: Request, res: Response) {
    try {
      const dto: StartLessonProgressDto = req.body;
      const progress = await this.lessonProgressService.startProgress(
        req.user!.id,
        dto,
      );
      res.status(201).json(progress);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateProgress(req: Request, res: Response) {
    try {
      const dto: UpdateLessonProgressDto = req.body;
      const progress = await this.lessonProgressService.updateProgress(
        req.user!.id,
        dto,
      );
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async completeProgress(req: Request, res: Response) {
    try {
      const dto: CompleteLessonProgressDto = req.body;
      const progress = await this.lessonProgressService.completeProgress(
        req.user!.id,
        dto,
      );
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getProgress(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const progress = await this.lessonProgressService.getProgress(
        req.user!.id,
        lessonId,
      );
      res.json(progress);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async getUserProgress(req: Request, res: Response) {
    try {
      const progress = await this.lessonProgressService.getUserProgress(
        req.user!.id,
      );
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}
