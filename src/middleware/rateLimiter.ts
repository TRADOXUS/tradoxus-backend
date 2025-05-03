import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";

const MAX_REQUESTS_LIMIT = 10; // maximum requests in the rate limit window
const RATE_LIMITING_WINDOW = 1; // rate limit window in seconds

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = `rate_limit:${req.url}:${req.ip}`;
  try {
    const requests = await redisClient.get(key);
    if (requests) {
      if (isNaN(parseInt(requests))) {
        res.status(500).json({
          error: "Incorrect value for request count in cache.",
        });
        return;
      }
      if (parseInt(requests) >= MAX_REQUESTS_LIMIT) {
        res.status(429).json({
          error: "Too many requests, please try again some time later",
        });
        return;
      }
      await redisClient.incr(key);
    } else {
      await redisClient.set(key, "1", { EX: RATE_LIMITING_WINDOW });
    }
    next();
  } catch (error) {
    console.error("Rate limiting error: ", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
