import { redisCacheManager, CACHE_CONFIG } from "../config/redis";
import { Course } from "../entities/Course";
import { Module } from "../entities/Module";
import { Lesson } from "../entities/Lesson";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface CachedCourseData {
  course: Partial<Course>;
  modules: Partial<Module>[];
  totalLessons: number;
  estimatedDuration: number;
  difficulty: string;
  lastUpdated: string;
}

export interface CachedModuleData {
  module: Partial<Module>;
  lessons: Partial<Lesson>[];
  totalLessons: number;
  estimatedDuration: number;
  lastUpdated: string;
}

export interface CachedLessonData {
  lesson: Partial<Lesson>;
  content: string;
  resources: Array<{
    type: string;
    url: string;
    title: string;
  }>;
  lastUpdated: string;
}

export interface CachedUserProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  completedModules: string[];
  progressPercentage: number;
  timeSpent: number;
  lastAccessed: string;
  achievements: string[];
}

export interface CachedUserAchievements {
  userId: string;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
  }>;
  totalAchievements: number;
  lastUpdated: string;
}

export class CourseCacheService {
  // Cache course data with modules
  static async cacheCourseData(
    courseId: string,
    courseData: CachedCourseData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:data`;
      await redisCacheManager.set(
        key,
        JSON.stringify(courseData),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      // Also cache course metadata separately for quick access
      const metadataKey = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:metadata`;
      const metadata = {
        id: courseData.course.id,
        title: courseData.course.title,
        description: courseData.course.description,
        difficulty: courseData.difficulty,
        totalLessons: courseData.totalLessons,
        estimatedDuration: courseData.estimatedDuration,
        lastUpdated: courseData.lastUpdated,
      };

      await redisCacheManager.set(
        metadataKey,
        JSON.stringify(metadata),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      logger.info(`Cached course data for course ${courseId}`);
    } catch (error) {
      logger.error("Failed to cache course data:", error);
    }
  }

  // Get cached course data
  static async getCachedCourseData(
    courseId: string,
  ): Promise<CachedCourseData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:data`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedCourseData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached course data:", error);
      return null;
    }
  }

  // Cache module data with lessons
  static async cacheModuleData(
    moduleId: string,
    moduleData: CachedModuleData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.MODULE}:${moduleId}:data`;
      await redisCacheManager.set(
        key,
        JSON.stringify(moduleData),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      logger.info(`Cached module data for module ${moduleId}`);
    } catch (error) {
      logger.error("Failed to cache module data:", error);
    }
  }

  // Get cached module data
  static async getCachedModuleData(
    moduleId: string,
  ): Promise<CachedModuleData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.MODULE}:${moduleId}:data`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedModuleData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached module data:", error);
      return null;
    }
  }

  // Cache lesson data with content
  static async cacheLessonData(
    lessonId: string,
    lessonData: CachedLessonData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.LESSON}:${lessonId}:data`;
      await redisCacheManager.set(
        key,
        JSON.stringify(lessonData),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      logger.info(`Cached lesson data for lesson ${lessonId}`);
    } catch (error) {
      logger.error("Failed to cache lesson data:", error);
    }
  }

  // Get cached lesson data
  static async getCachedLessonData(
    lessonId: string,
  ): Promise<CachedLessonData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.LESSON}:${lessonId}:data`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedLessonData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached lesson data:", error);
      return null;
    }
  }

  // Cache user progress
  static async cacheUserProgress(
    userId: string,
    courseId: string,
    progress: CachedUserProgress,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:course:${courseId}:progress`;
      await redisCacheManager.set(
        key,
        JSON.stringify(progress),
        CACHE_CONFIG.TTL.USER_PROFILE,
      );

      // Also cache user's overall progress summary
      const summaryKey = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:progress:summary`;
      const summaryData = await redisCacheManager.get(summaryKey);
      const summary = summaryData ? JSON.parse(summaryData) : { courses: {} };
      summary.courses[courseId] = {
        progressPercentage: progress.progressPercentage,
        lastAccessed: progress.lastAccessed,
        completedLessons: progress.completedLessons.length,
      };

      await redisCacheManager.set(
        summaryKey,
        JSON.stringify(summary),
        CACHE_CONFIG.TTL.USER_PROFILE,
      );

      logger.info(
        `Cached user progress for user ${userId} in course ${courseId}`,
      );
    } catch (error) {
      logger.error("Failed to cache user progress:", error);
    }
  }

  // Get cached user progress
  static async getCachedUserProgress(
    userId: string,
    courseId: string,
  ): Promise<CachedUserProgress | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:course:${courseId}:progress`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedUserProgress;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached user progress:", error);
      return null;
    }
  }

  // Cache user achievements
  static async cacheUserAchievements(
    userId: string,
    achievements: CachedUserAchievements,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:achievements`;
      await redisCacheManager.set(
        key,
        JSON.stringify(achievements),
        CACHE_CONFIG.TTL.USER_PROFILE,
      );

      logger.info(`Cached user achievements for user ${userId}`);
    } catch (error) {
      logger.error("Failed to cache user achievements:", error);
    }
  }

  // Get cached user achievements
  static async getCachedUserAchievements(
    userId: string,
  ): Promise<CachedUserAchievements | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:achievements`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedUserAchievements;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached user achievements:", error);
      return null;
    }
  }

  // Cache course list for quick access
  static async cacheCourseList(courses: Partial<Course>[]): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:list:all`;
      await redisCacheManager.set(
        key,
        JSON.stringify(courses),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      logger.info(`Cached course list with ${courses.length} courses`);
    } catch (error) {
      logger.error("Failed to cache course list:", error);
    }
  }

  // Get cached course list
  static async getCachedCourseList(): Promise<Partial<Course>[] | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:list:all`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as Partial<Course>[];
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached course list:", error);
      return null;
    }
  }

  // Cache popular courses
  static async cachePopularCourses(courses: Partial<Course>[]): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:popular`;
      await redisCacheManager.set(
        key,
        JSON.stringify(courses),
        CACHE_CONFIG.TTL.COURSE_CONTENT,
      );

      logger.info(`Cached ${courses.length} popular courses`);
    } catch (error) {
      logger.error("Failed to cache popular courses:", error);
    }
  }

  // Get cached popular courses
  static async getCachedPopularCourses(): Promise<Partial<Course>[] | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:popular`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as Partial<Course>[];
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached popular courses:", error);
      return null;
    }
  }

  // Invalidate course cache
  static async invalidateCourseCache(courseId: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:*`,
        `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:list:*`,
        `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:popular`,
      ];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(`Invalidated course cache for course ${courseId}`);
    } catch (error) {
      logger.error("Failed to invalidate course cache:", error);
    }
  }

  // Invalidate module cache
  static async invalidateModuleCache(moduleId: string): Promise<void> {
    try {
      const patterns = [`${CACHE_CONFIG.KEY_PREFIXES.MODULE}:${moduleId}:*`];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(`Invalidated module cache for module ${moduleId}`);
    } catch (error) {
      logger.error("Failed to invalidate module cache:", error);
    }
  }

  // Invalidate lesson cache
  static async invalidateLessonCache(lessonId: string): Promise<void> {
    try {
      const patterns = [`${CACHE_CONFIG.KEY_PREFIXES.LESSON}:${lessonId}:*`];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(`Invalidated lesson cache for lesson ${lessonId}`);
    } catch (error) {
      logger.error("Failed to invalidate lesson cache:", error);
    }
  }

  // Invalidate user progress cache
  static async invalidateUserProgressCache(
    userId: string,
    courseId?: string,
  ): Promise<void> {
    try {
      const patterns = courseId
        ? [
            `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:course:${courseId}:progress`,
          ]
        : [
            `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:course:*:progress`,
            `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:progress:summary`,
          ];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(
        `Invalidated user progress cache for user ${userId}${courseId ? ` in course ${courseId}` : ""}`,
      );
    } catch (error) {
      logger.error("Failed to invalidate user progress cache:", error);
    }
  }

  // Invalidate user achievements cache
  static async invalidateUserAchievementsCache(userId: string): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:achievements`;
      await redisCacheManager.del(key);
      logger.info(`Invalidated user achievements cache for user ${userId}`);
    } catch (error) {
      logger.error("Failed to invalidate user achievements cache:", error);
    }
  }

  // Warm cache with course data
  static async warmCourseCache(
    courseId: string,
    courseData: CachedCourseData,
  ): Promise<void> {
    try {
      await this.cacheCourseData(courseId, courseData);
      logger.info(`Warmed cache for course ${courseId}`);
    } catch (error) {
      logger.error("Failed to warm course cache:", error);
    }
  }

  // Warm cache with popular courses
  static async warmPopularCoursesCache(
    courses: Partial<Course>[],
  ): Promise<void> {
    try {
      await this.cachePopularCourses(courses);
      logger.info(`Warmed cache for ${courses.length} popular courses`);
    } catch (error) {
      logger.error("Failed to warm popular courses cache:", error);
    }
  }

  // Get cache statistics for course data
  static async getCourseCacheStats(): Promise<{
    courseKeys: number;
    moduleKeys: number;
    lessonKeys: number;
    userProgressKeys: number;
    totalKeys: number;
  }> {
    try {
      const courseKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:*`,
      );
      const moduleKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.MODULE}:*`,
      );
      const lessonKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.LESSON}:*`,
      );
      const userProgressKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.USER}:*:course:*:progress`,
      );

      return {
        courseKeys: courseKeys.length,
        moduleKeys: moduleKeys.length,
        lessonKeys: lessonKeys.length,
        userProgressKeys: userProgressKeys.length,
        totalKeys:
          courseKeys.length +
          moduleKeys.length +
          lessonKeys.length +
          userProgressKeys.length,
      };
    } catch (error) {
      logger.error("Failed to get course cache stats:", error);
      return {
        courseKeys: 0,
        moduleKeys: 0,
        lessonKeys: 0,
        userProgressKeys: 0,
        totalKeys: 0,
      };
    }
  }

  // Check if course data is cached
  static async isCourseDataCached(courseId: string): Promise<boolean> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:data`;
      return await redisCacheManager.exists(key);
    } catch (error) {
      logger.error("Failed to check course data cache:", error);
      return false;
    }
  }

  // Get cached course IDs
  static async getCachedCourseIds(): Promise<string[]> {
    try {
      const keys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:*:data`,
      );
      return keys.map((key) => {
        const parts = key.split(":");
        return parts[1]; // Extract course ID from key
      });
    } catch (error) {
      logger.error("Failed to get cached course IDs:", error);
      return [];
    }
  }
}
