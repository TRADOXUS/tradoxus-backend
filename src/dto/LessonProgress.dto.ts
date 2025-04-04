import { IsUUID, IsEnum, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ProgressStatus } from '../entities/LessonProgress';

export class StartLessonProgressDto {
  @IsUUID()
  lessonId: string;
}

export class UpdateLessonProgressDto {
  @IsUUID()
  lessonId: string;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsNumber()
  @IsOptional()
  timeSpent?: number;

  @IsNumber()
  @IsOptional()
  completionPercentage?: number;

  @IsObject()
  @IsOptional()
  metadata?: {
    capsuleProgress?: Record<string, boolean>;
    exerciseResults?: Record<string, number>;
    interactionEvents?: Array<{
      type: string;
      timestamp: Date;
      data: any;
    }>;
  };
}

export class CompleteLessonProgressDto {
  @IsUUID()
  lessonId: string;

  @IsNumber()
  @IsOptional()
  finalTimeSpent?: number;
} 