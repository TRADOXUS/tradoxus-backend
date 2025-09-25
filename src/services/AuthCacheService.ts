import { redisCacheManager, CACHE_CONFIG } from "../config/redis";
import { User } from "../entities/User";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface CachedUserSession {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: string;
  sessionId: string;
}

export interface CachedJWTData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class AuthCacheService {
  // Cache user session data
  static async cacheUserSession(
    sessionId: string,
    user: User,
    permissions: string[] = [],
  ): Promise<void> {
    try {
      const sessionData: CachedUserSession = {
        userId: user.id.toString(),
        email: user.email ?? "",
        role: user.isAdmin ? "admin" : "user",
        permissions,
        lastActivity: new Date().toISOString(),
        sessionId,
      };

      const key = `${CACHE_CONFIG.KEY_PREFIXES.SESSION}:${sessionId}`;
      await redisCacheManager.set(
        key,
        JSON.stringify(sessionData),
        CACHE_CONFIG.TTL.USER_SESSION,
      );

      // Also cache user-specific session list
      const userSessionsKey = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${user.id}:sessions`;
      const existingSessions = await redisCacheManager.get(userSessionsKey);
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];

      if (!sessions.includes(sessionId)) {
        sessions.push(sessionId);
        await redisCacheManager.set(
          userSessionsKey,
          JSON.stringify(sessions),
          CACHE_CONFIG.TTL.USER_SESSION,
        );
      }

      logger.info(`Cached user session for user ${user.id}`);
    } catch (error) {
      logger.error("Failed to cache user session:", error);
    }
  }

  // Get cached user session
  static async getCachedUserSession(
    sessionId: string,
  ): Promise<CachedUserSession | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.SESSION}:${sessionId}`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        const sessionData = JSON.parse(cachedData) as CachedUserSession;

        // Update last activity
        sessionData.lastActivity = new Date().toISOString();
        await redisCacheManager.set(
          key,
          JSON.stringify(sessionData),
          CACHE_CONFIG.TTL.USER_SESSION,
        );

        return sessionData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached user session:", error);
      return null;
    }
  }

  // Cache JWT token data
  static async cacheJWTData(
    token: string,
    jwtData: CachedJWTData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:jwt:${token}`;
      await redisCacheManager.set(
        key,
        JSON.stringify(jwtData),
        CACHE_CONFIG.TTL.USER_SESSION,
      );

      // Cache user permissions separately for quick access
      const permissionsKey = `${CACHE_CONFIG.KEY_PREFIXES.PERMISSIONS}:${jwtData.userId}`;
      await redisCacheManager.set(
        permissionsKey,
        JSON.stringify(jwtData.permissions),
        CACHE_CONFIG.TTL.PERMISSIONS,
      );

      logger.info(`Cached JWT data for user ${jwtData.userId}`);
    } catch (error) {
      logger.error("Failed to cache JWT data:", error);
    }
  }

  // Get cached JWT data
  static async getCachedJWTData(token: string): Promise<CachedJWTData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:jwt:${token}`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedJWTData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached JWT data:", error);
      return null;
    }
  }

  // Cache user permissions
  static async cacheUserPermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.PERMISSIONS}:${userId}`;
      await redisCacheManager.set(
        key,
        JSON.stringify(permissions),
        CACHE_CONFIG.TTL.PERMISSIONS,
      );

      logger.info(`Cached permissions for user ${userId}`);
    } catch (error) {
      logger.error("Failed to cache user permissions:", error);
    }
  }

  // Get cached user permissions
  static async getCachedUserPermissions(
    userId: string,
  ): Promise<string[] | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.PERMISSIONS}:${userId}`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as string[];
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached user permissions:", error);
      return null;
    }
  }

  // Cache user profile data
  static async cacheUserProfile(
    userId: string,
    userData: Partial<User>,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:profile`;
      await redisCacheManager.set(
        key,
        JSON.stringify(userData),
        CACHE_CONFIG.TTL.USER_PROFILE,
      );

      logger.info(`Cached user profile for user ${userId}`);
    } catch (error) {
      logger.error("Failed to cache user profile:", error);
    }
  }

  // Get cached user profile
  static async getCachedUserProfile(
    userId: string,
  ): Promise<Partial<User> | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:profile`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as Partial<User>;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached user profile:", error);
      return null;
    }
  }

  // Invalidate user session
  static async invalidateUserSession(sessionId: string): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.SESSION}:${sessionId}`;
      await redisCacheManager.del(key);
      logger.info(`Invalidated session ${sessionId}`);
    } catch (error) {
      logger.error("Failed to invalidate user session:", error);
    }
  }

  // Invalidate all user sessions
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:sessions`;
      const sessionsData = await redisCacheManager.get(userSessionsKey);

      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as string[];

        // Delete all session keys
        await Promise.all(
          sessions.map((sessionId) =>
            redisCacheManager.del(
              `${CACHE_CONFIG.KEY_PREFIXES.SESSION}:${sessionId}`,
            ),
          ),
        );

        // Delete user sessions list
        await redisCacheManager.del(userSessionsKey);

        logger.info(
          `Invalidated ${sessions.length} sessions for user ${userId}`,
        );
      }
    } catch (error) {
      logger.error("Failed to invalidate all user sessions:", error);
    }
  }

  // Invalidate user cache (profile, permissions, etc.)
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:profile`,
        `${CACHE_CONFIG.KEY_PREFIXES.PERMISSIONS}:${userId}`,
        `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:sessions`,
      ];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(`Invalidated user cache for user ${userId}`);
    } catch (error) {
      logger.error("Failed to invalidate user cache:", error);
    }
  }

  // Invalidate JWT token
  static async invalidateJWTToken(token: string): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:jwt:${token}`;
      await redisCacheManager.del(key);
      logger.info(`Invalidated JWT token`);
    } catch (error) {
      logger.error("Failed to invalidate JWT token:", error);
    }
  }

  // Check if user session is valid
  static async isUserSessionValid(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getCachedUserSession(sessionId);
      return sessionData !== null;
    } catch (error) {
      logger.error("Failed to check user session validity:", error);
      return false;
    }
  }

  // Get user's active sessions count
  static async getUserActiveSessionsCount(userId: string): Promise<number> {
    try {
      const userSessionsKey = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:sessions`;
      const sessionsData = await redisCacheManager.get(userSessionsKey);

      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as string[];
        return sessions.length;
      }

      return 0;
    } catch (error) {
      logger.error("Failed to get user active sessions count:", error);
      return 0;
    }
  }

  // Clean up expired sessions (can be called periodically)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // Redis TTL will handle expiration automatically
      // This method can be used for additional cleanup if needed
      logger.info("Session cleanup completed (handled by Redis TTL)");
    } catch (error) {
      logger.error("Failed to cleanup expired sessions:", error);
    }
  }

  // Warm cache with user data
  static async warmUserCache(
    userId: string,
    userData: User,
    permissions: string[] = [],
  ): Promise<void> {
    try {
      await Promise.all([
        this.cacheUserProfile(userId, userData),
        this.cacheUserPermissions(userId, permissions),
      ]);

      logger.info(`Warmed cache for user ${userId}`);
    } catch (error) {
      logger.error("Failed to warm user cache:", error);
    }
  }

  // Get auth cache statistics
  static async getAuthCacheStats(): Promise<number> {
    try {
      const sessionKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.SESSION}:*`,
      );
      const userKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.USER}:*`,
      );
      const permissionKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.PERMISSIONS}:*`,
      );

      return sessionKeys.length + userKeys.length + permissionKeys.length;
    } catch (error) {
      logger.error("Failed to get auth cache stats:", error);
      return 0;
    }
  }
}
