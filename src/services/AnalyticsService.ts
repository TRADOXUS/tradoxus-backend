import { Repository, In } from "typeorm";
import { LessonProgress, ProgressStatus } from "../entities/LessonProgress";
import { Course } from "../entities/Course";
import { AnalyticsMetadata } from "../dto/Analytics.dto";

interface BulkStatusResult {
  [userId: string]: {
    [lessonId: string]: {
      status: ProgressStatus;
      completionPercentage: number;
      timeSpent: number;
      lastInteractionAt: Date;
    };
  };
}

export class AnalyticsService {
  constructor(
    private lessonProgressRepository: Repository<LessonProgress>,
    private courseRepository: Repository<Course>,
  ) {}

  async getUserStatistics(userId: string) {
    const progress = await this.lessonProgressRepository.find({
      where: { userId },
      relations: ["lesson"],
    });

    const totalLessons = progress.length;
    const completedLessons = progress.filter(
      (p) => p.status === ProgressStatus.COMPLETED,
    ).length;
    const inProgressLessons = progress.filter(
      (p) => p.status === ProgressStatus.IN_PROGRESS,
    ).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageCompletionPercentage =
      progress.reduce((sum, p) => sum + p.completionPercentage, 0) /
      (totalLessons || 1);

    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      totalTimeSpent,
      averageCompletionPercentage,
      completionRate: totalLessons
        ? (completedLessons / totalLessons) * 100
        : 0,
    };
  }

  async getLessonAnalytics(lessonId: string) {
    const progress = await this.lessonProgressRepository.find({
      where: { lesson: { id: lessonId } },
    });

    const totalAttempts = progress.length;
    const completedAttempts = progress.filter(
      (p) => p.status === ProgressStatus.COMPLETED,
    ).length;
    const averageTimeSpent =
      progress.reduce((sum, p) => sum + p.timeSpent, 0) / (totalAttempts || 1);
    const averageCompletionPercentage =
      progress.reduce((sum, p) => sum + p.completionPercentage, 0) /
      (totalAttempts || 1);

    return {
      totalAttempts,
      completedAttempts,
      averageTimeSpent,
      averageCompletionPercentage,
      completionRate: totalAttempts
        ? (completedAttempts / totalAttempts) * 100
        : 0,
    };
  }

  async getCourseCompletionRate(courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ["lessons"],
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const lessonIds = course.lessons.map((lesson: { id: string }) => lesson.id);
    const progress = await this.lessonProgressRepository.find({
      where: { lesson: { id: In(lessonIds) } },
    });

    // Group by user
    const userProgress = new Map<string, Set<string>>();

    progress.forEach((p) => {
      if (!userProgress.has(p.userId)) {
        userProgress.set(p.userId, new Set());
      }

      if (p.status === ProgressStatus.COMPLETED) {
        userProgress.get(p.userId)?.add(p.lesson.id);
      }
    });

    // Calculate completion rates by user
    const completionRates = Array.from(userProgress.entries()).map(
      ([userId, completedLessonIds]) => ({
        userId,
        completedLessons: completedLessonIds.size,
        totalLessons: lessonIds.length,
        completionRate: (completedLessonIds.size / lessonIds.length) * 100,
      }),
    );

    // Calculate general statistics
    const totalUsers = completionRates.length;
    const averageCompletionRate =
      completionRates.reduce((sum, rate) => sum + rate.completionRate, 0) /
      (totalUsers || 1);
    const fullyCompletedUsers = completionRates.filter(
      (rate) => rate.completionRate === 100,
    ).length;

    return {
      courseId,
      totalUsers,
      fullyCompletedUsers,
      averageCompletionRate,
      userCompletionRates: completionRates,
    };
  }

  async bulkUpdateProgress(
    updates: Array<{
      userId: string;
      lessonId: string;
      status?: ProgressStatus;
      timeSpent?: number;
      completionPercentage?: number;
      metadata?: AnalyticsMetadata;
    }>,
  ) {
    const results = [];

    for (const update of updates) {
      try {
        const progress = await this.lessonProgressRepository.findOne({
          where: {
            userId: update.userId,
            lesson: { id: update.lessonId },
          },
        });

        if (!progress) {
          results.push({
            userId: update.userId,
            lessonId: update.lessonId,
            success: false,
            error: "Progreso no encontrado",
          });
          continue;
        }

        if (update.status) progress.status = update.status;
        if (update.timeSpent) progress.timeSpent = update.timeSpent;
        if (update.completionPercentage)
          progress.completionPercentage = update.completionPercentage;
        if (update.metadata)
          progress.metadata = { ...progress.metadata, ...update.metadata };

        progress.lastInteractionAt = new Date();

        if (
          update.status === ProgressStatus.COMPLETED &&
          !progress.completedAt
        ) {
          progress.completedAt = new Date();
        }

        await this.lessonProgressRepository.save(progress);

        results.push({
          userId: update.userId,
          lessonId: update.lessonId,
          success: true,
        });
      } catch (error) {
        results.push({
          userId: update.userId,
          lessonId: update.lessonId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getBulkStatus(
    userIds: string[],
    lessonIds: string[],
  ): Promise<BulkStatusResult> {
    const progress = await this.lessonProgressRepository.find({
      where: {
        userId: In(userIds),
        lesson: { id: In(lessonIds) },
      },
    });

    const statusMap = new Map<
      string,
      Map<
        string,
        {
          status: ProgressStatus;
          completionPercentage: number;
          timeSpent: number;
          lastInteractionAt: Date;
        }
      >
    >();

    // Inicializar mapas para cada usuario
    userIds.forEach((userId) => {
      statusMap.set(userId, new Map());
      lessonIds.forEach((lessonId) => {
        statusMap.get(userId)?.set(lessonId, {
          status: ProgressStatus.NOT_STARTED,
          completionPercentage: 0,
          timeSpent: 0,
          lastInteractionAt: new Date(),
        });
      });
    });

    // Llenar con datos reales
    progress.forEach((p) => {
      const userMap = statusMap.get(p.userId);
      if (userMap) {
        userMap.set(p.lesson.id, {
          status: p.status,
          completionPercentage: p.completionPercentage,
          timeSpent: p.timeSpent,
          lastInteractionAt: p.lastInteractionAt,
        });
      }
    });

    // Convertir a formato de respuesta
    const result: BulkStatusResult = {};
    statusMap.forEach((lessonMap, userId) => {
      result[userId] = {};
      lessonMap.forEach((data, lessonId) => {
        result[userId][lessonId] = data;
      });
    });

    return result;
  }
}
