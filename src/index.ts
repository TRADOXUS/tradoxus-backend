import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config/config";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { NextFunction, Request, Response } from "express";

import { AppDataSource } from "./config/database";

import { authenticate } from "./middleware/authMiddleware";
import { connectToRedis } from "./config/redis";
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();

connectToRedis();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting middleware
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT token middleware
app.use("/api", authenticate);

// API routes
app.use("/api/v1", routes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

// Database connection and server start
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
    console.log(
      "📌 Loaded Entities:",
      AppDataSource.entityMetadatas.map((e) => e.name),
    );

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

// Start server
// app.listen(config.port, () => {
//   console.log(`The Server is running in ${config.nodeEnv} mode on port ${config.port}`);
//});
