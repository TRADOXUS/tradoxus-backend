import { Repository } from "typeorm";
import { LessonProgress, ProgressStatus } from "../entities/LessonProgress";
import {
  StartLessonProgressDto,
  UpdateLessonProgressDto,
  CompleteLessonProgressDto,
} from "../dto/LessonProgress.dto";
import { Lesson } from "../entities/Lesson";

export class LessonProgressService {
  constructor(
    private lessonProgressRepository: Repository<LessonProgress>,
    private lessonRepository: Repository<Lesson>,
  ) {}

  async startProgress(
    userId: string,
    dto: StartLessonProgressDto,
  ): Promise<LessonProgress> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: dto.lessonId },
    });
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    let progress = await this.lessonProgressRepository.findOne({
      where: {
        userId,
        lesson: { id: dto.lessonId },
      },
    });

    if (!progress) {
      progress = this.lessonProgressRepository.create({
        userId,
        lesson,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        lastInteractionAt: new Date(),
      });
    } else if (progress.status === ProgressStatus.COMPLETED) {
      progress.status = ProgressStatus.IN_PROGRESS;
      progress.startedAt = new Date();
      progress.lastInteractionAt = new Date();
    }

    return this.lessonProgressRepository.save(progress);
  }

  async updateProgress(
    userId: string,
    dto: UpdateLessonProgressDto,
  ): Promise<LessonProgress> {
    const progress = await this.lessonProgressRepository.findOne({
      where: {
        userId,
        lesson: { id: dto.lessonId },
      },
    });

    if (!progress) {
      throw new Error("Progress not found");
    }

    if (dto.status) progress.status = dto.status;
    if (dto.timeSpent) progress.timeSpent = dto.timeSpent;
    if (dto.completionPercentage)
      progress.completionPercentage = dto.completionPercentage;
    if (dto.metadata)
      progress.metadata = { ...progress.metadata, ...dto.metadata };

    progress.lastInteractionAt = new Date();

    return this.lessonProgressRepository.save(progress);
  }

  async completeProgress(
    userId: string,
    dto: CompleteLessonProgressDto,
  ): Promise<LessonProgress> {
    const progress = await this.lessonProgressRepository.findOne({
      where: {
        userId,
        lesson: { id: dto.lessonId },
      },
    });

    if (!progress) {
      throw new Error("Progress not found");
    }

    progress.status = ProgressStatus.COMPLETED;
    progress.completedAt = new Date();
    if (dto.finalTimeSpent) progress.timeSpent = dto.finalTimeSpent;
    progress.completionPercentage = 100;

    return this.lessonProgressRepository.save(progress);
  }

  async getProgress(userId: string, lessonId: string): Promise<LessonProgress> {
    const progress = await this.lessonProgressRepository.findOne({
      where: {
        userId,
        lesson: { id: lessonId },
      },
    });

    if (!progress) {
      throw new Error("Progress not found");
    }

    return progress;
  }

  async getUserProgress(userId: string): Promise<LessonProgress[]> {
    return this.lessonProgressRepository.find({
      where: { userId },
      relations: ["lesson"],
    });
  }
}
