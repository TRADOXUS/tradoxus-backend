import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/AnalyticsService";
import { BulkUpdateDto, BulkStatusDto } from "../dto/Analytics.dto";

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getUserStatistics(req: Request, res: Response, next: NextFunction): void {
    const { userId } = req.params;
    this.analyticsService
      .getUserStatistics(userId)
      .then((statistics) => res.json(statistics))
      .catch(next);
  }

  getLessonAnalytics(req: Request, res: Response, next: NextFunction): void {
    const { lessonId } = req.params;
    this.analyticsService
      .getLessonAnalytics(lessonId)
      .then((analytics) => res.json(analytics))
      .catch(next);
  }

  getCourseCompletionRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { courseId } = req.params;
    this.analyticsService
      .getCourseCompletionRate(courseId)
      .then((completionRate) => res.json(completionRate))
      .catch(next);
  }

  bulkUpdateProgress(req: Request, res: Response, next: NextFunction): void {
    const dto: BulkUpdateDto = req.body;
    this.analyticsService
      .bulkUpdateProgress(dto.updates)
      .then((results) => res.json(results))
      .catch(next);
  }

  getBulkStatus(req: Request, res: Response, next: NextFunction): void {
    const dto: BulkStatusDto = req.body;
    this.analyticsService
      .getBulkStatus(dto.userIds, dto.lessonIds)
      .then((status) => res.json(status))
      .catch(next);
  }
}
