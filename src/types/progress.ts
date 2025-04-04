export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface InteractionEvent {
  type: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LessonProgressMetadata {
  capsuleProgress: Record<string, boolean>;
  exerciseResults: Record<string, number>;
  interactionEvents: InteractionEvent[];
}

export interface UserStatistics {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  totalTimeSpent: number;
  averageCompletionPercentage: number;
  completionRate: number;
  averageTimePerLesson?: number;
  engagementScore?: number;
}

export interface LessonAnalytics {
  totalAttempts: number;
  completedAttempts: number;
  averageTimeSpent: number;
  averageCompletionPercentage: number;
  completionRate: number;
  averageScore?: number;
  engagementMetrics?: Record<string, any>;
}

export interface CourseCompletionRate {
  courseId: string;
  totalUsers: number;
  fullyCompletedUsers: number;
  averageCompletionRate: number;
  userCompletionRates: {
    userId: string;
    completedLessons: number;
    totalLessons: number;
    completionRate: number;
  }[];
  totalLessons?: number;
  completedLessons?: number;
  completionRate?: number;
  averageTimePerLesson?: number;
}

export interface BulkProgressUpdate {
  userId: string;
  lessonId: string;
  completionPercentage: number;
  timeSpent: number;
}

export interface BulkProgressStatus {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  completionPercentage: number;
} 