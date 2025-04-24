import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis
redis.connect().catch(console.error);

export const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redis.get(key);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Modify res.json method to cache the response
      const originalJson = res.json;
      res.json = function(body: any) {
        redis.setEx(key, duration, JSON.stringify(body));
        return originalJson.call(this, body);
      };

      return next();
    } catch (error) {
      console.error('Cache error:', error);
      return next();
    }
  };
};

export const clearCache = async (pattern: string) => {
  const keys = await redis.keys(`cache:${pattern}`);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}; 