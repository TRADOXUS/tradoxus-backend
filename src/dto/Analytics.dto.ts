import { IsArray, IsUUID, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ProgressStatus } from '../entities/LessonProgress';

export interface AnalyticsMetadata {
    [key: string]: string | number | boolean | null | undefined;
}

export class BulkUpdateItemDto {
  @IsUUID()
  userId: string;
  
  @IsUUID()
  lessonId: string;
  
  @IsOptional()
  status?: ProgressStatus;
  
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
  
  @IsOptional()
  @IsNumber()
  completionPercentage?: number;
  
  @IsOptional()
  @IsObject()
  metadata?: AnalyticsMetadata;
}

export class BulkUpdateDto {
  @IsArray()
  updates: BulkUpdateItemDto[];
}

export class BulkStatusDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];
  
  @IsArray()
  @IsUUID(undefined, { each: true })
  lessonIds: string[];
} 